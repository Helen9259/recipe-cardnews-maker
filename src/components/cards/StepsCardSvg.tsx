import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { PhotoBackgroundOverlay, PhotoTopHalf, TOP_HALF_CONTENT_Y_OFFSET } from "./PhotoOverlay";
import { getLine } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { getDarkModeTokens } from "@/lib/darkMode";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

// 순서 설명 텍스트는 길이와 무관하게 고정 크기: 넘치면 폰트를 줄이지 않고 줄바꿈한다
const BODY_FONT_SIZE = 52;
const TIP_FONT_SIZE = { min: 34, max: 40, idealChars: 22 };

export function StepsCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const mainFontFamily = FONT_FAMILY_STACK[style.mainFont];
  const tipFontFamily = FONT_FAMILY_STACK[style.tipFont];
  const tokens = getDarkModeTokens(style.mode);
  const stepNumber = getLine(card, "subtitle");
  const body = getLine(card, "body");
  const tip = getLine(card, "tip");

  const hasPhoto = Boolean(card.imageUrl) && Boolean(card.photoLayout);
  const isBackground = hasPhoto && card.photoLayout === "background";
  const isTopHalf = hasPhoto && card.photoLayout === "top-half";
  const boxY = isTopHalf ? TOP_HALF_CONTENT_Y_OFFSET : 80;
  const boxHeight = isTopHalf ? CARD_HEIGHT - TOP_HALF_CONTENT_Y_OFFSET - 40 : CARD_HEIGHT - 160;
  const textColor = (fallback: string) => (isBackground ? "#ffffff" : fallback);
  const dividerColor = isBackground ? "rgba(255,255,255,0.35)" : tokens.divider;

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {isBackground && card.imageUrl && <PhotoBackgroundOverlay imageUrl={card.imageUrl} gradientId="steps-gradient" />}
      {isTopHalf && card.imageUrl && <PhotoTopHalf imageUrl={card.imageUrl} />}

      <CardHtml x={64} y={boxY} width={CARD_WIDTH - 128} height={boxHeight}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", gap: 20 }}>
          {stepNumber?.text && (
            <span
              style={{
                display: "inline-block",
                width: "fit-content",
                fontFamily: mainFontFamily,
                fontSize: 36,
                fontWeight: 700,
                color: textColor(tokens.text),
                letterSpacing: 1,
              }}
            >
              {stepNumber.text}
            </span>
          )}
          {body?.text && (
            <span
              style={{
                fontFamily: mainFontFamily,
                fontSize: BODY_FONT_SIZE,
                fontWeight: 300,
                lineHeight: 1.4,
                color: textColor(body.color),
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
                fontFamily: tipFontFamily,
                fontSize: autoFontSize(tip.text, TIP_FONT_SIZE),
                fontWeight: 400,
                color: textColor(tip.color),
                borderTop: `1px solid ${dividerColor}`,
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
