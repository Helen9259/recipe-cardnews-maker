import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { PhotoBackgroundOverlay, PhotoTopHalf, TOP_HALF_CONTENT_Y_OFFSET } from "./PhotoOverlay";
import { getLine } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

const ACCOUNT_FONT_SIZE = { min: 42, max: 58, idealChars: 12 };
const PROMO_FONT_SIZE = { min: 36, max: 46, idealChars: 20 };

export function OutroCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.mainFont];
  const account = getLine(card, "title");
  const promo = getLine(card, "body");

  const hasPhoto = Boolean(card.imageUrl) && Boolean(card.photoLayout);
  const isBackground = hasPhoto && card.photoLayout === "background";
  const isTopHalf = hasPhoto && card.photoLayout === "top-half";
  const textColor = (fallback: string) => (isBackground ? "#ffffff" : fallback);
  const subtextColor = (fallback: string) => (isBackground ? "#f5f5f5" : fallback);

  const contentY = isTopHalf ? TOP_HALF_CONTENT_Y_OFFSET + 40 : CARD_HEIGHT / 2 - 60;
  const contentHeight = isTopHalf ? CARD_HEIGHT - contentY - 40 : 260;

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {isBackground && card.imageUrl && <PhotoBackgroundOverlay imageUrl={card.imageUrl} gradientId="outro-gradient" />}
      {isTopHalf && card.imageUrl && <PhotoTopHalf imageUrl={card.imageUrl} />}
      {!hasPhoto && (
        <circle cx={CARD_WIDTH / 2} cy={CARD_HEIGHT / 2 - 120} r={140} fill="var(--card-accent-color)" opacity={0.25} />
      )}

      <CardHtml x={80} y={contentY} width={CARD_WIDTH - 160} height={contentHeight}>
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
            <span style={{ fontSize: autoFontSize(account.text, ACCOUNT_FONT_SIZE), fontWeight: 800, color: textColor(account.color) }}>
              {account.text}
            </span>
          )}
          {promo?.text && (
            <span
              style={{
                fontSize: autoFontSize(promo.text, PROMO_FONT_SIZE),
                fontWeight: 300,
                lineHeight: 1.5,
                color: subtextColor(promo.color),
                wordBreak: "keep-all",
              }}
            >
              {promo.text}
            </span>
          )}
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
