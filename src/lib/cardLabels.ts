import { CardNewsCard } from "@/types/card";
import { getLine } from "@/lib/cardLines";

const KIND_LABEL: Record<CardNewsCard["kind"], string> = {
  cover: "표지",
  ingredients: "재료",
  steps: "순서",
  ingredientsSteps: "재료+순서",
  outro: "마무리",
};

/** 좌측 탭/우측 그리드에서 카드를 구분해 보여줄 라벨 */
export function getCardLabel(cards: CardNewsCard[], card: CardNewsCard): string {
  if (card.kind === "steps") {
    const stepIdx = cards.filter((c) => c.kind === "steps").findIndex((c) => c.id === card.id);
    return `STEP ${stepIdx + 1}`;
  }
  if (card.kind === "ingredientsSteps") {
    // 분할된 경우 제목 라인 자체가 "재료+순서 1/2"처럼 되어 있어 그대로 쓴다
    return getLine(card, "title")?.text || KIND_LABEL[card.kind];
  }
  return KIND_LABEL[card.kind];
}
