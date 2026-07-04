import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { toProxiedImageUrl } from "@/lib/imageProxy";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

const TITLE_FONT_SIZE = { min: 36, max: 64, idealChars: 10 };
const SUBTITLE_FONT_SIZE = { min: 20, max: 26, idealChars: 16 };

export function CoverCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.font];
  // 제목이 길면 두 줄(CardLine 2개)로 나뉘어 있을 수 있다 — 첫 줄은 기본색(사진 위에서는 흰색으로
  // 보정), 둘째 줄부터는 사용자가 편집 화면에서 바꿀 수 있는 실제 색을 그대로 쓴다(기본값 메인 컬러).
  const titleLines = getLines(card, "title").filter((l) => l.text);
  const subtitle = getLine(card, "subtitle");
  const watermark = getLine(card, "watermark");
  const hasImage = Boolean(card.imageUrl);
  const imageUrl = toProxiedImageUrl(card.imageUrl);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {imageUrl ? (
        <>
          <image
            href={imageUrl}
            x={0}
            y={0}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
          <defs>
            <linearGradient id="cover-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="40%" stopColor="black" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="0.78" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#cover-gradient)" />
        </>
      ) : (
        <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill="var(--card-accent-color)" opacity={0.22} />
      )}

      {watermark?.text && (
        <CardHtml x={0} y={56} width={CARD_WIDTH} height={60}>
          <div
            style={{
              textAlign: "center",
              fontFamily,
              fontSize: 28,
              fontWeight: 600,
              color: hasImage ? "#ffffff" : watermark.color,
            }}
          >
            {watermark.text}
          </div>
        </CardHtml>
      )}

      <CardHtml x={64} y={CARD_HEIGHT - 360} width={CARD_WIDTH - 128} height={300}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end", height: "100%" }}>
          {titleLines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {titleLines.map((titleLine, idx) => (
                <div
                  key={titleLine.id}
                  style={{
                    fontFamily,
                    fontSize: autoFontSize(titleLine.text, TITLE_FONT_SIZE),
                    fontWeight: 800,
                    lineHeight: 1.3,
                    wordBreak: "keep-all",
                    // 첫 줄만 사진 위 가독성을 위해 흰색으로 보정하고, 둘째 줄부터는 실제 지정된
                    // 색(기본값 메인 컬러)을 그대로 살린다
                    color: hasImage && idx === 0 ? "#ffffff" : titleLine.color,
                  }}
                >
                  {titleLine.text}
                </div>
              ))}
            </div>
          )}
          {subtitle?.text && (
            <div
              style={{
                fontFamily,
                fontSize: autoFontSize(subtitle.text, SUBTITLE_FONT_SIZE),
                fontWeight: 400,
                color: hasImage ? "#f5f5f5" : subtitle.color,
              }}
            >
              {subtitle.text}
            </div>
          )}
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
