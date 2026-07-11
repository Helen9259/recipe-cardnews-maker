import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { PhotoBackgroundOverlay } from "./PhotoOverlay";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

const TITLE_FONT_SIZE = { min: 36, max: 64, idealChars: 10 };
const SUBTITLE_FONT_SIZE = { min: 20, max: 26, idealChars: 16 };

/**
 * 표지 카드는 3가지 버전 중 하나로 렌더링된다 (card.coverImageMode):
 * - "youtube" / "upload": 사진을 카드 전체 배경으로 깔고 그라디언트 오버레이 위에 텍스트
 * - "none": 이미지 없이 텍스트+출처만
 */
export function CoverCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.mainFont];
  // 제목이 길면 두 줄(CardLine 2개)로 나뉘어 있을 수 있다 — 첫 줄은 기본색(사진 위에서는 흰색으로
  // 보정), 둘째 줄부터는 사용자가 편집 화면에서 바꿀 수 있는 실제 색을 그대로 쓴다(기본값 메인 컬러).
  const titleLines = getLines(card, "title").filter((l) => l.text);
  const subtitle = getLine(card, "subtitle");
  const watermark = getLine(card, "watermark");
  const hasImage = card.coverImageMode !== "none" && Boolean(card.imageUrl);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {hasImage ? (
        <PhotoBackgroundOverlay imageUrl={card.imageUrl!} gradientId="cover-gradient" />
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
