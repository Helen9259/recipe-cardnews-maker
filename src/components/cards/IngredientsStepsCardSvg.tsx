import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { PhotoBackgroundOverlay, PhotoTopHalf, TOP_HALF_CONTENT_Y_OFFSET } from "./PhotoOverlay";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

// 재료+순서가 한 카드에 다 들어가야 해서(사진 모드 꺼짐), 각각 단독 카드보다 밀도를 높인다
const ITEM_FONT_SIZE = { min: 20, max: 28, idealChars: 8 };
const STEP_FONT_SIZE = { min: 22, max: 32, idealChars: 26 };

function columnCount(itemCount: number): number {
  if (itemCount <= 4) return 1;
  if (itemCount <= 12) return 2;
  return 3;
}

/** 사진 모드가 꺼져있을 때(기본값) 재료+순서를 한 장에 압축해서 보여주는 카드 */
export function IngredientsStepsCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.mainFont];
  const title = getLine(card, "title");
  const ingredients = getLines(card, "ingredient");
  const steps = getLines(card, "step");
  const cols = columnCount(ingredients.length);
  const longestIngredient = ingredients.reduce((longest, item) => (item.text.length > longest.length ? item.text : longest), "");
  const ingredientFontSize = autoFontSize(longestIngredient, ITEM_FONT_SIZE);

  const hasPhoto = Boolean(card.imageUrl) && Boolean(card.photoLayout);
  const isBackground = hasPhoto && card.photoLayout === "background";
  const isTopHalf = hasPhoto && card.photoLayout === "top-half";
  const boxY = isTopHalf ? TOP_HALF_CONTENT_Y_OFFSET : 72;
  const boxHeight = isTopHalf ? CARD_HEIGHT - TOP_HALF_CONTENT_Y_OFFSET - 40 : CARD_HEIGHT - 144;
  const textColor = (fallback: string) => (isBackground ? "#ffffff" : fallback);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {isBackground && card.imageUrl && <PhotoBackgroundOverlay imageUrl={card.imageUrl} gradientId="merged-gradient" />}
      {isTopHalf && card.imageUrl && <PhotoTopHalf imageUrl={card.imageUrl} />}

      <CardHtml x={64} y={boxY} width={CARD_WIDTH - 128} height={boxHeight}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily, gap: 28 }}>
          {title?.text && (
            <span style={{ fontSize: 40, fontWeight: 800, color: textColor(title.color) }}>{title.text}</span>
          )}

          {ingredients.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                columnGap: 20,
                rowGap: 14,
                alignContent: "start",
                paddingBottom: 16,
                borderBottom: `1px solid ${isBackground ? "rgba(255,255,255,0.35)" : "var(--card-accent-color)"}`,
              }}
            >
              {ingredients.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{ width: 8, height: 8, borderRadius: 999, background: "var(--card-accent-color)", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: ingredientFontSize, fontWeight: 300, color: textColor(item.color), wordBreak: "keep-all" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {steps.map((step) => (
              <span
                key={step.id}
                style={{
                  fontSize: autoFontSize(step.text, STEP_FONT_SIZE),
                  fontWeight: 300,
                  lineHeight: 1.4,
                  color: textColor(step.color),
                  wordBreak: "keep-all",
                }}
              >
                {step.text}
              </span>
            ))}
          </div>
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
