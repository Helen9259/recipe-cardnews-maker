import { v4 as uuid } from "uuid";
import { CardNewsCard, CardLine } from "@/types/card";
import { CardNewsProject } from "@/types/recipe";
import { getDarkModeTokens } from "@/lib/darkMode";
import { getCardAccentColor } from "@/lib/cardColors";
import { splitTitleForTwoTone } from "@/lib/titleSplit";

function line(role: CardLine["role"], text: string, color: string): CardLine {
  return { id: uuid(), role, text, color };
}

/** "대파 1대"처럼 수량이 붙은 재료 문자열에서 이름만 떼어낸다 */
function stripQuantity(ingredient: string): string {
  return ingredient.replace(/\s*\d+.*$/, "").trim();
}

/**
 * 조리 단계 문구에 언급된 재료를 recipe.ingredients 순서대로 찾아 첫 매칭을 반환한다.
 * 삽화가 "재료 아이콘"을 그릴 때 어떤 재료를 주인공으로 삼을지 정하는 데 쓰인다.
 */
function findKeyIngredient(stepText: string, ingredients: string[]): string | undefined {
  for (const ingredient of ingredients) {
    const name = stripQuantity(ingredient);
    if (name && stepText.includes(name)) return name;
  }
  return undefined;
}

/**
 * Recipe + CardStyle로 카드 배열의 뼈대를 만든다 (텍스트/레이아웃 데이터만, 삽화는 아직 없음).
 * 순서 카드는 RecipeStep 1개당 1장 (추출 단계에서 이미 최대 15개로 그룹핑되어 있음).
 */
export function buildBaseCards(project: CardNewsProject): CardNewsCard[] {
  const { recipe, style, instaAccountName, promoText } = project;
  const tokens = getDarkModeTokens(style.mode);
  const accent = getCardAccentColor(style.mainColor, style.mode);
  const cards: CardNewsCard[] = [];

  // 제목이 두 줄로 나뉠 만큼 길면 첫 줄은 기본 텍스트색, 둘째 줄은 메인 컬러를 기본값으로 준다.
  // 색상은 그냥 일반 CardLine.color라서 화면5에서 여전히 줄별로 수동 변경 가능하다.
  const titleSegments = splitTitleForTwoTone(recipe.title);
  const titleLines = titleSegments.map((segment, idx) =>
    line("title", segment, idx === 0 ? tokens.text : accent)
  );

  cards.push({
    id: "cover",
    kind: "cover",
    selected: true,
    imageUrl: recipe.thumbnailUrl,
    lines: [
      ...titleLines,
      line("subtitle", recipe.sourceName ? `${recipe.sourceName}의 레시피` : "", tokens.subtext),
      line("watermark", instaAccountName ? `@${instaAccountName}` : "", tokens.watermark),
    ],
  });

  cards.push({
    id: "ingredients",
    kind: "ingredients",
    selected: true,
    lines: [
      line("title", "재료", tokens.text),
      line("subtitle", recipe.servings, tokens.subtext),
      ...recipe.ingredients.map((ingredient) => line("body", ingredient, tokens.text)),
    ],
  });

  recipe.steps.forEach((step, idx) => {
    const lines: CardLine[] = [
      line("subtitle", `STEP ${idx + 1}`, tokens.subtext),
      line("body", step.text, tokens.text),
    ];
    if (step.tip) {
      lines.push(line("tip", `TIP. ${step.tip}`, tokens.subtext));
    }
    cards.push({
      id: `step-${step.id}`,
      kind: "steps",
      selected: true,
      imageUrl: step.illustrationUrl,
      stepIds: [step.id],
      keyIngredient: findKeyIngredient(step.text, recipe.ingredients),
      lines,
    });
  });

  cards.push({
    id: "outro",
    kind: "outro",
    selected: true,
    lines: [
      line("title", instaAccountName ? `@${instaAccountName}` : "", tokens.text),
      line("body", promoText, tokens.subtext),
    ],
  });

  return cards;
}

/** 여러 항목을 동시에 최대 limit개까지만 처리한다 (Cloudflare 쪽에 한꺼번에 몰리는 것 방지) */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface KeywordResult {
  step: number;
  keyword: string;
}

/**
 * 재료 목록 + 전체 조리 단계를 한 번에 보내서 단계별 영문 삽화 키워드를 받아온다.
 * 실패해도 조용히 빈 결과를 반환해서(throw하지 않음) 로컬 매칭 폴백으로 계속 진행되게 한다.
 */
async function fetchIllustrationKeywords(
  ingredients: string[],
  stepTexts: string[]
): Promise<Map<number, string>> {
  const keywordByIndex = new Map<number, string>();
  try {
    const res = await fetch("/api/illustration-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, steps: stepTexts }),
    });
    if (!res.ok) {
      console.error(`[illustration] 배치 키워드 추출 실패 (${res.status}), 로컬 매칭으로 대체`);
      return keywordByIndex;
    }
    const data = (await res.json()) as { keywords?: KeywordResult[] };
    for (const { step, keyword } of data.keywords ?? []) {
      if (typeof step === "number" && keyword) keywordByIndex.set(step - 1, keyword);
    }
  } catch (err) {
    console.error("[illustration] 배치 키워드 추출 중 오류, 로컬 매칭으로 대체:", err);
  }
  return keywordByIndex;
}

async function requestIllustration(stepText: string, keyIngredient: string | undefined): Promise<string | null> {
  try {
    const res = await fetch("/api/generate-illustration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepText, keyIngredient }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.imageUrl as string) || null;
  } catch {
    return null;
  }
}

const ILLUSTRATION_CONCURRENCY = 3;

/**
 * 순서 카드 중 삽화가 없는 카드에 대해 /api/generate-illustration을 호출해 채워 넣는다.
 * 1) 재료+전체 단계를 배치로 한 번만 Gemini에 보내 영문 키워드를 뽑고(실패 시 로컬 매칭 폴백),
 * 2) 카드별로 최대 1회 재시도, 그래도 실패하면 imageUrl 없이 illustrationFailed: true로 표시해서
 *    화면에서 조용히 넘어가지 않고 재시도 버튼을 보여줄 수 있게 한다.
 */
export async function generateStepIllustrations(cards: CardNewsCard[]): Promise<CardNewsCard[]> {
  const stepCards = cards.filter((c) => c.kind === "steps");
  if (!stepCards.some((c) => !c.imageUrl)) return cards;

  const ingredientCard = cards.find((c) => c.kind === "ingredients");
  const ingredients = ingredientCard
    ? ingredientCard.lines.filter((l) => l.role === "body").map((l) => l.text)
    : [];
  const stepTexts = stepCards.map((c) => c.lines.find((l) => l.role === "body")?.text || "");

  const keywordByIndex = await fetchIllustrationKeywords(ingredients, stepTexts);

  const updatedStepCards = await mapWithConcurrency(stepCards, ILLUSTRATION_CONCURRENCY, async (card, idx) => {
    if (card.imageUrl) return card;

    const stepText = stepTexts[idx];
    const keyIngredient = keywordByIndex.get(idx) || card.keyIngredient;

    let imageUrl = await requestIllustration(stepText, keyIngredient);
    if (!imageUrl) {
      console.error(`[illustration] 1차 생성 실패 (${card.id}), 재시도`);
      imageUrl = await requestIllustration(stepText, keyIngredient);
    }

    if (!imageUrl) {
      console.error(`[illustration] 재시도까지 실패 (${card.id})`);
      return { ...card, keyIngredient, illustrationFailed: true };
    }
    return { ...card, keyIngredient, imageUrl, illustrationFailed: false };
  });

  const updatedById = new Map(updatedStepCards.map((c) => [c.id, c]));
  return cards.map((card) => (card.kind === "steps" ? updatedById.get(card.id) ?? card : card));
}

/** 화면5에서 삽화 생성에 실패한 카드 하나만 다시 시도할 때 사용 */
export async function regenerateStepIllustration(card: CardNewsCard): Promise<CardNewsCard> {
  const bodyLine = card.lines.find((l) => l.role === "body");
  const stepText = bodyLine?.text || "";

  const imageUrl = await requestIllustration(stepText, card.keyIngredient);
  if (!imageUrl) {
    console.error(`[illustration] 수동 재시도 실패 (${card.id})`);
    return { ...card, illustrationFailed: true };
  }
  return { ...card, imageUrl, illustrationFailed: false };
}

/** 화면5 편집 패널에서 특정 카드의 특정 줄 텍스트/색상을 수정할 때 사용 */
export function updateCardLine(
  cards: CardNewsCard[],
  cardId: string,
  lineId: string,
  patch: Partial<Pick<CardLine, "text" | "color">>
): CardNewsCard[] {
  return cards.map((card) =>
    card.id === cardId
      ? { ...card, lines: card.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) }
      : card
  );
}

/** 화면6 내보내기에서 카드 선택/해제 토글 */
export function toggleCardSelected(cards: CardNewsCard[], cardId: string): CardNewsCard[] {
  return cards.map((card) => (card.id === cardId ? { ...card, selected: !card.selected } : card));
}
