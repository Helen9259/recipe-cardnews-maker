import { v4 as uuid } from "uuid";
import { CardNewsCard, CardLine } from "@/types/card";
import { CardNewsProject } from "@/types/recipe";
import { getDarkModeTokens } from "@/lib/darkMode";

function line(role: CardLine["role"], text: string, color: string): CardLine {
  return { id: uuid(), role, text, color };
}

/**
 * Recipe + CardStyle로 카드 배열의 뼈대를 만든다 (텍스트/레이아웃 데이터만, 삽화는 아직 없음).
 * 순서 카드는 RecipeStep 1개당 1장 (추출 단계에서 이미 최대 15개로 그룹핑되어 있음).
 */
export function buildBaseCards(project: CardNewsProject): CardNewsCard[] {
  const { recipe, style, instaAccountName, promoText } = project;
  const tokens = getDarkModeTokens(style.mode);
  const cards: CardNewsCard[] = [];

  cards.push({
    id: "cover",
    kind: "cover",
    selected: true,
    imageUrl: recipe.thumbnailUrl,
    lines: [
      line("title", recipe.title, tokens.text),
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
export async function generateStepIllustrations(cards: CardNewsCard[]): Promise<CardNewsCard[]> {
  const results = await Promise.all(
    cards.map(async (card) => {
      if (card.kind !== "steps" || card.imageUrl) return card;
      const bodyLine = card.lines.find((l) => l.role === "body");
      try {
        const res = await fetch("/api/generate-illustration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepText: bodyLine?.text || "" }),
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
