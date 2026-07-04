import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CoverCardSvg } from "./CoverCardSvg";
import { IngredientsCardSvg } from "./IngredientsCardSvg";
import { StepsCardSvg } from "./StepsCardSvg";
import { OutroCardSvg } from "./OutroCardSvg";

export function CardRenderer({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  switch (card.kind) {
    case "cover":
      return <CoverCardSvg card={card} style={style} />;
    case "ingredients":
      return <IngredientsCardSvg card={card} style={style} />;
    case "steps":
      return <StepsCardSvg card={card} style={style} />;
    case "outro":
      return <OutroCardSvg card={card} style={style} />;
    default:
      return null;
  }
}
