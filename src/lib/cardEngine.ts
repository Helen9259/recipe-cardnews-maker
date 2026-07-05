import { v4 as uuid } from "uuid";
import { CardNewsCard, CardLine } from "@/types/card";
import { CardNewsProject, MainColor } from "@/types/recipe";
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

/** 순서 카드 중 삽화가 없는 카드에 대해 /api/generate-illustration을 호출해 채워 넣는다 */
export async function generateStepIllustrations(
  cards: CardNewsCard[],
  mainColor: MainColor
): Promise<CardNewsCard[]> {
  const results = await Promise.all(
    cards.map(async (card) => {
      if (card.kind !== "steps" || card.imageUrl) return card;
      const bodyLine = card.lines.find((l) => l.role === "body");
      try {
        const res = await fetch("/api/generate-illustration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepText: bodyLine?.text || "",
            keyIngredient: card.keyIngredient,
            mainColor,
          }),
        });
        if (!res.ok) return card;
        const data = await res.json();
        return { ...card, imageUrl: data.imageUrl as string };
      } catch {
        return card;
      }
    })
  );
  return results;
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
