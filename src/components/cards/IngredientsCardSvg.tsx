import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

const ITEM_FONT_SIZE = { min: 20, max: 32, idealChars: 8 };

function columnCount(itemCount: number): number {
  if (itemCount <= 6) return 1;
  if (itemCount <= 14) return 2;
  return 3;
}

export function IngredientsCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.font];
  const title = getLine(card, "title");
  const subtitle = getLine(card, "subtitle");
  const items = getLines(card, "body");
  const cols = columnCount(items.length);
  // 항목 하나하나가 아니라 가장 긴 재료 기준으로 통일된 크기를 써야 그리드가 들쭉날쭉하지 않는다
  const longestItem = items.reduce((longest, item) => (item.text.length > longest.length ? item.text : longest), "");
  const itemFontSize = autoFontSize(longestItem, ITEM_FONT_SIZE);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      <CardHtml x={64} y={80} width={CARD_WIDTH - 128} height={CARD_HEIGHT - 160}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            {title?.text && (
              <span style={{ fontSize: 48, fontWeight: 800, color: title.color }}>{title.text}</span>
            )}
            {subtitle?.text && (
              <span style={{ fontSize: 24, fontWeight: 400, color: subtitle.color }}>{subtitle.text}</span>
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
            }}
          >
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "var(--card-accent-color)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: itemFontSize, fontWeight: 300, color: item.color, wordBreak: "keep-all" }}>
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
