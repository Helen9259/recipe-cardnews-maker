import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { PhotoBackgroundOverlay, PhotoTopHalf, TOP_HALF_CONTENT_Y_OFFSET } from "./PhotoOverlay";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { getPaleMainColor, getMainColorHex } from "@/lib/cardColors";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

const ITEM_FONT_SIZE = { min: 38, max: 50, idealChars: 8 };
const MIN_ITEM_FONT = 18;
// 폰트크기 대비 한 행이 차지하는 대략적인 높이 배수(줄간격/행간격 포함 어림값)
const ROW_HEIGHT_FACTOR = 1.7;
const HEADER_HEIGHT = 100;

function columnCount(itemCount: number): number {
  if (itemCount <= 6) return 1;
  if (itemCount <= 14) return 2;
  if (itemCount <= 28) return 3;
  return 4;
}

/**
 * 재료가 많아 그리드가 세로로 넘칠 것 같으면, 카드를 더 만들지 않고 이 안에서
 * 최소 폰트 크기까지 계속 줄여서 욱여넣는다.
 */
function fitItemFontSize(itemCount: number, cols: number, availableHeight: number, byLength: number): number {
  if (itemCount === 0) return byLength;
  const rows = Math.ceil(itemCount / cols);
  const maxByRows = Math.floor(availableHeight / (rows * ROW_HEIGHT_FACTOR));
  return Math.max(MIN_ITEM_FONT, Math.min(byLength, maxByRows));
}

export function IngredientsCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.mainFont];
  // 재료 카드는 포인트 컬러를 옅게 희석한 색을 배경으로, 원래 포인트 컬러는 불릿 같은 텍스트류에 쓴다
  const background = getPaleMainColor(style.mainColor);
  const accent = getMainColorHex(style.mainColor);
  const title = getLine(card, "title");
  const subtitle = getLine(card, "subtitle");
  const items = getLines(card, "body");
  const cols = columnCount(items.length);
  // 항목 하나하나가 아니라 가장 긴 재료 기준으로 통일된 크기를 써야 그리드가 들쭉날쭉하지 않는다
  const longestItem = items.reduce((longest, item) => (item.text.length > longest.length ? item.text : longest), "");
  const byLength = autoFontSize(longestItem, ITEM_FONT_SIZE);

  const hasPhoto = Boolean(card.imageUrl) && Boolean(card.photoLayout);
  const isBackground = hasPhoto && card.photoLayout === "background";
  const isTopHalf = hasPhoto && card.photoLayout === "top-half";
  const boxY = isTopHalf ? TOP_HALF_CONTENT_Y_OFFSET : 80;
  const boxHeight = isTopHalf ? CARD_HEIGHT - TOP_HALF_CONTENT_Y_OFFSET - 40 : CARD_HEIGHT - 160;
  const textColor = (fallback: string) => (isBackground ? "#ffffff" : fallback);
  const subtextColor = (fallback: string) => (isBackground ? "#f5f5f5" : fallback);

  const gridAvailableHeight = Math.max(0, boxHeight - HEADER_HEIGHT);
  const itemFontSize = fitItemFontSize(items.length, cols, gridAvailableHeight, byLength);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor} background={background}>
      {isBackground && card.imageUrl && <PhotoBackgroundOverlay imageUrl={card.imageUrl} gradientId="ingredients-gradient" />}
      {isTopHalf && card.imageUrl && <PhotoTopHalf imageUrl={card.imageUrl} />}

      <CardHtml x={64} y={boxY} width={CARD_WIDTH - 128} height={boxHeight}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            {title?.text && (
              <span style={{ fontSize: 58, fontWeight: 800, color: textColor(title.color) }}>{title.text}</span>
            )}
            {subtitle?.text && (
              <span style={{ fontSize: 34, fontWeight: 400, color: subtextColor(subtitle.color) }}>{subtitle.text}</span>
            )}
          </div>

          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              columnGap: 24,
              rowGap: 20,
              alignContent: "start",
              overflow: "hidden",
            }}
          >
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: accent,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: itemFontSize, fontWeight: 300, color: textColor(item.color), wordBreak: "keep-all" }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
