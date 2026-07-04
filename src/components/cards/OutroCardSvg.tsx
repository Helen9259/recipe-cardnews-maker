import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { getLine } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

export function OutroCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.font];
  const account = getLine(card, "title");
  const promo = getLine(card, "body");

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      <circle cx={CARD_WIDTH / 2} cy={CARD_HEIGHT / 2 - 120} r={140} fill="var(--card-accent-color)" opacity={0.25} />

      <CardHtml x={80} y={CARD_HEIGHT / 2 - 60} width={CARD_WIDTH - 160} height={260}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            textAlign: "center",
            fontFamily,
          }}
        >
          {account?.text && (
            <span style={{ fontSize: 44, fontWeight: 800, color: account.color }}>{account.text}</span>
          )}
          {promo?.text && (
            <span style={{ fontSize: 28, fontWeight: 300, lineHeight: 1.5, color: promo.color, wordBreak: "keep-all" }}>
              {promo.text}
            </span>
          )}
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
