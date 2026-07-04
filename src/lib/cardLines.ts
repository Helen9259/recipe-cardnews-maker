import { CardLine, CardLineRole, CardNewsCard } from "@/types/card";

export function getLine(card: CardNewsCard, role: CardLineRole): CardLine | undefined {
  return card.lines.find((l) => l.role === role);
}

export function getLines(card: CardNewsCard, role: CardLineRole): CardLine[] {
  return card.lines.filter((l) => l.role === role);
}
