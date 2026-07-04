import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { getLine } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { getDarkModeTokens, getIllustrationFilter } from "@/lib/darkMode";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, ILLUSTRATION_ASPECT } from "@/lib/cardLayout";

const PADDING = 64;
const ILLUSTRATION_WIDTH = CARD_WIDTH - PADDING * 2;
const ILLUSTRATION_HEIGHT = ILLUSTRATION_WIDTH / ILLUSTRATION_ASPECT;

const BODY_FONT_SIZE = { min: 24, max: 36, idealChars: 20 };
const TIP_FONT_SIZE = { min: 18, max: 24, idealChars: 22 };

export function StepsCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.font];
  const tokens = getDarkModeTokens(style.mode);
  const stepNumber = getLine(card, "subtitle");
  const body = getLine(card, "body");
  const tip = getLine(card, "tip");

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      <CardHtml x={PADDING} y={70} width={ILLUSTRATION_WIDTH} height={ILLUSTRATION_HEIGHT}>
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: getIllustrationFilter(style.mode),
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 24,
              border: `2px dashed var(--card-accent-color)`,
            }}
          />
        )}
      </CardHtml>

      <CardHtml
        x={PADDING}
        y={70 + ILLUSTRATION_HEIGHT + 48}
        width={ILLUSTRATION_WIDTH}
        height={420}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily }}>
          {stepNumber?.text && (
            <span
              style={{
                display: "inline-block",
                width: "fit-content",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--card-accent-color)",
                letterSpacing: 1,
              }}
            >
              {stepNumber.text}
            </span>
          )}
          {body?.text && (
            <span
              style={{
                fontSize: autoFontSize(body.text, BODY_FONT_SIZE),
                fontWeight: 300,
                lineHeight: 1.4,
                color: body.color,
                wordBreak: "keep-all",
              }}
            >
              {body.text}
            </span>
          )}
          {tip?.text && (
            <span
              style={{
                marginTop: 8,
                fontSize: autoFontSize(tip.text, TIP_FONT_SIZE),
                fontWeight: 400,
                color: tip.color,
                borderTop: `1px solid ${tokens.cardBorder}`,
                paddingTop: 12,
              }}
            >
              {tip.text}
            </span>
          )}
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
