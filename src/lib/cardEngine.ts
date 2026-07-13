import { v4 as uuid } from "uuid";
import { CardNewsCard, CardLine, CoverImageMode, PhotoLayout } from "@/types/card";
import { CardNewsProject, Recipe, RecipeStep } from "@/types/recipe";
import { getDarkModeTokens, DarkModeTokens } from "@/lib/darkMode";
import { splitTitleForTwoTone } from "@/lib/titleSplit";

function line(role: CardLine["role"], text: string, color: string): CardLine {
  return { id: uuid(), role, text, color };
}

function truncateUrl(url: string, max = 44): string {
  return url.length > max ? `${url.slice(0, max - 1)}…` : url;
}

/** 블로그 출처는 이미지 없이 "블로그명 · 원문 링크" 텍스트로만 표시한다 */
function formatBlogSourceLine(recipe: Recipe): string {
  const link = truncateUrl(recipe.sourceUrl);
  return recipe.sourceName ? `${recipe.sourceName} · ${link}` : link;
}

function buildCoverCard(project: CardNewsProject): CardNewsCard {
  const { recipe, style, instaAccountName } = project;
  const tokens = getDarkModeTokens(style.mode);

  // 제목이 길면 읽기 좋게 단어 경계로 두 줄로 나눈다 (색은 둘 다 기본 텍스트색 — 배경이
  // 이제 메인 컬러라 별도 포인트 컬러를 텍스트에 또 쓰면 배경과 뒤섞여 안 보일 수 있다)
  const titleSegments = splitTitleForTwoTone(recipe.title);
  const titleLines = titleSegments.map((segment) => line("title", segment, tokens.text));

  const subtitleText =
    recipe.sourceType === "blog"
      ? formatBlogSourceLine(recipe)
      : recipe.sourceName
        ? `${recipe.sourceName}의 레시피`
        : "";

  // 유튜브 출처면 공식 썸네일을 기본으로, 블로그는 이미지 없이 텍스트만
  const coverImageMode: CoverImageMode = recipe.sourceType === "youtube" && recipe.thumbnailUrl ? "youtube" : "none";

  return {
    id: "cover",
    kind: "cover",
    selected: true,
    imageUrl: coverImageMode === "youtube" ? recipe.thumbnailUrl : undefined,
    coverImageMode,
    lines: [
      ...titleLines,
      line("subtitle", subtitleText, tokens.subtext),
      line("watermark", instaAccountName ? `@${instaAccountName}` : "", tokens.watermark),
    ],
  };
}

function buildIngredientsCard(recipe: Recipe, tokens: DarkModeTokens): CardNewsCard {
  return {
    id: "ingredients",
    kind: "ingredients",
    selected: true,
    lines: [
      line("title", "재료", tokens.text),
      line("subtitle", recipe.servings, tokens.subtext),
      ...recipe.ingredients.map((ingredient) => line("body", ingredient, tokens.text)),
    ],
  };
}

function buildStepCards(recipe: Recipe, tokens: DarkModeTokens): CardNewsCard[] {
  return recipe.steps.map((step, idx) => {
    const lines: CardLine[] = [
      line("subtitle", `STEP ${idx + 1}`, tokens.subtext),
      line("body", step.text, tokens.text),
    ];
    if (step.tip) {
      lines.push(line("tip", `TIP. ${step.tip}`, tokens.subtext));
    }
    return {
      id: `step-${step.id}`,
      kind: "steps",
      selected: true,
      stepIds: [step.id],
      lines,
    };
  });
}

// 사진 모드가 꺼져있을 때(재료+순서 통합 카드) 자동 분할 기준
const MERGE_CHAR_THRESHOLD = 480;
const MERGE_ITEM_THRESHOLD = 16;

function shouldSplitMergedCard(ingredients: string[], steps: RecipeStep[]): boolean {
  const totalChars =
    ingredients.reduce((sum, s) => sum + s.length, 0) +
    steps.reduce((sum, s) => sum + s.text.length + (s.tip?.length || 0), 0);
  const totalItems = ingredients.length + steps.length;
  return totalChars > MERGE_CHAR_THRESHOLD || totalItems > MERGE_ITEM_THRESHOLD;
}

function buildOneMergedCard(ingredients: string[], steps: RecipeStep[], tokens: DarkModeTokens): CardNewsCard {
  const lines: CardLine[] = [line("title", "재료+순서", tokens.text)];
  ingredients.forEach((ingredient) => lines.push(line("ingredient", ingredient, tokens.text)));
  steps.forEach((step, idx) => {
    const number = idx + 1;
    const text = step.tip ? `${number}. ${step.text} (TIP. ${step.tip})` : `${number}. ${step.text}`;
    lines.push(line("step", text, tokens.text));
  });

  return {
    id: "merged",
    kind: "ingredientsSteps",
    selected: true,
    stepIds: steps.map((s) => s.id),
    lines,
  };
}

/** 내용 초과로 통합 카드가 안 들어갈 때: 재료 카드 1장 + 순서만 모은 카드 1장으로 분리한다 */
function buildStepsListCard(steps: RecipeStep[], tokens: DarkModeTokens): CardNewsCard {
  const lines: CardLine[] = [line("title", "순서", tokens.text)];
  steps.forEach((step, idx) => {
    const number = idx + 1;
    const text = step.tip ? `${number}. ${step.text} (TIP. ${step.tip})` : `${number}. ${step.text}`;
    lines.push(line("step", text, tokens.text));
  });

  return {
    id: "stepsList",
    kind: "stepsList",
    selected: true,
    stepIds: steps.map((s) => s.id),
    lines,
  };
}

/**
 * 사진 모드가 꺼져있을 때: 재료+순서를 카드 1장에 통합한다.
 * 내용량(글자수 또는 항목수)이 기준을 넘으면 "재료 카드" + "순서 카드"로 컴포넌트 단위 분리한다
 * (재료 카드는 사진 모드일 때와 동일한 컴포넌트를 재사용).
 */
function buildMergedCards(recipe: Recipe, tokens: DarkModeTokens): CardNewsCard[] {
  if (!shouldSplitMergedCard(recipe.ingredients, recipe.steps)) {
    return [buildOneMergedCard(recipe.ingredients, recipe.steps, tokens)];
  }

  return [buildIngredientsCard(recipe, tokens), buildStepsListCard(recipe.steps, tokens)];
}

function buildOutroCard(project: CardNewsProject, tokens: DarkModeTokens): CardNewsCard {
  const { instaAccountName, promoText } = project;
  return {
    id: "outro",
    kind: "outro",
    selected: true,
    lines: [
      line("title", instaAccountName ? `@${instaAccountName}` : "", tokens.text),
      line("body", promoText, tokens.subtext),
    ],
  };
}

/**
 * Recipe + CardStyle로 카드 배열을 만든다.
 * photoMode가 켜져있으면 재료 카드(1장) + 순서 카드(RecipeStep 1개당 1장, 최대 15장)로 분리하고,
 * 꺼져있으면(기본값) 재료+순서를 통합 카드 1~2장으로 압축한다.
 */
export function buildBaseCards(project: CardNewsProject): CardNewsCard[] {
  const { recipe, style } = project;
  const tokens = getDarkModeTokens(style.mode);

  const cover = buildCoverCard(project);
  const middleCards = style.photoMode
    ? [buildIngredientsCard(recipe, tokens), ...buildStepCards(recipe, tokens)]
    : buildMergedCards(recipe, tokens);
  const outro = buildOutroCard(project, tokens);

  return [cover, ...middleCards, outro];
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

/** 표지 카드의 이미지 출처를 바꾼다 (유튜브 썸네일 / 이미지 없음 / 직접 업로드) */
export function setCoverImageMode(
  cards: CardNewsCard[],
  mode: CoverImageMode,
  recipeThumbnailUrl: string | undefined,
  uploadedUrl?: string
): CardNewsCard[] {
  return cards.map((card) => {
    if (card.kind !== "cover") return card;
    if (mode === "youtube") return { ...card, coverImageMode: mode, imageUrl: recipeThumbnailUrl };
    if (mode === "upload") return { ...card, coverImageMode: mode, imageUrl: uploadedUrl ?? card.imageUrl };
    return { ...card, coverImageMode: mode, imageUrl: undefined };
  });
}

/** 표지 이외 카드에 사용자가 사진을 업로드했을 때 사용 (기본 레이아웃은 배경형) */
export function setCardPhoto(cards: CardNewsCard[], cardId: string, dataUrl: string): CardNewsCard[] {
  return cards.map((card) =>
    card.id === cardId ? { ...card, imageUrl: dataUrl, photoLayout: card.photoLayout ?? "background" } : card
  );
}

/** 표지 이외 카드에서 업로드한 사진을 제거 */
export function removeCardPhoto(cards: CardNewsCard[], cardId: string): CardNewsCard[] {
  return cards.map((card) => (card.id === cardId ? { ...card, imageUrl: undefined, photoLayout: undefined } : card));
}

/** 사진이 있는 카드의 배치 방식(배경형 / 상단절반형)을 바꾼다 */
export function setCardPhotoLayout(cards: CardNewsCard[], cardId: string, layout: PhotoLayout): CardNewsCard[] {
  return cards.map((card) => (card.id === cardId ? { ...card, photoLayout: layout } : card));
}
