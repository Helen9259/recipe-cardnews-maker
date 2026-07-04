import { CardNewsCard } from "@/types/card";

const KIND_LABEL: Record<CardNewsCard["kind"], string> = {
  cover: "표지",
  ingredients: "재료",
  steps: "순서",
  outro: "마무리",
};

/** 좌측 탭/우측 그리드에서 카드를 구분해 보여줄 라벨. steps는 등장 순서로 번호를 매긴다 */
export function getCardLabel(cards: CardNewsCard[], card: CardNewsCard): string {
  if (card.kind !== "steps") return KIND_LABEL[card.kind];
  const stepIdx = cards.filter((c) => c.kind === "steps").findIndex((c) => c.id === card.id);
  return `STEP ${stepIdx + 1}`;
}
