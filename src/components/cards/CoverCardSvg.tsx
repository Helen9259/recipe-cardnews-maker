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

// 유튜브 썸네일은 대부분 16:9(maxresdefault)라서 이 비율로 박스를 잡는다.
// preserveAspectRatio="meet"이라 실제 이미지가 다른 비율이어도 잘리지 않고 레터박스로 들어간다.
const THUMBNAIL_ASPECT = 16 / 9;
const THUMBNAIL_HEIGHT = CARD_WIDTH / THUMBNAIL_ASPECT;
// 썸네일 상단이 카드 세로 35~40% 지점에 오도록 (중앙보다 살짝 위)
const THUMBNAIL_TOP = CARD_HEIGHT * 0.37;

export function CoverCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.font];
  // 제목이 길면 두 줄(CardLine 2개)로 나뉘어 있을 수 있다 — 첫 줄은 기본색, 둘째 줄부터는
  // 사용자가 편집 화면에서 바꿀 수 있는 실제 색을 그대로 쓴다(기본값 메인 컬러).
  const titleLines = getLines(card, "title").filter((l) => l.text);
  const subtitle = getLine(card, "subtitle");
  const watermark = getLine(card, "watermark");
  const hasImage = Boolean(card.imageUrl);
  const imageUrl = toProxiedImageUrl(card.imageUrl);

  const titleBlock = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {titleLines.map((titleLine) => (
        <div
          key={titleLine.id}
          style={{
            fontFamily,
            fontSize: autoFontSize(titleLine.text, TITLE_FONT_SIZE),
            fontWeight: 800,
            lineHeight: 1.3,
            wordBreak: "keep-all",
            color: titleLine.color,
          }}
        >
          {titleLine.text}
        </div>
      ))}
    </div>
  );

  const subtitleBlock = subtitle?.text && (
    <div
      style={{
        fontFamily,
        fontSize: autoFontSize(subtitle.text, SUBTITLE_FONT_SIZE),
        fontWeight: 400,
        color: subtitle.color,
      }}
    >
      {subtitle.text}
    </div>
  );

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {!hasImage && (
        <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill="var(--card-accent-color)" opacity={0.22} />
      )}

      {watermark?.text && (
        <CardHtml x={0} y={56} width={CARD_WIDTH} height={60}>
          <div style={{ textAlign: "center", fontFamily, fontSize: 28, fontWeight: 600, color: watermark.color }}>
            {watermark.text}
          </div>
        </CardHtml>
      )}

      {hasImage ? (
        <>
          {/* 썸네일 위: 제목 (사진 위 오버레이가 아니라 카드 배경 위에 놓이므로 잘림/가독성 문제 없음) */}
          <CardHtml x={64} y={140} width={CARD_WIDTH - 128} height={THUMBNAIL_TOP - 140 - 16}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end", height: "100%" }}>
              {titleBlock}
            </div>
          </CardHtml>

          {/* 가로폭을 카드와 정확히 맞추고(width:100%), 세로는 원본 비율 그대로(height:auto 격) 잘리지 않게 표시 */}
          <image
            href={imageUrl}
            x={0}
            y={THUMBNAIL_TOP}
            width={CARD_WIDTH}
            height={THUMBNAIL_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* 썸네일 아래: 출처 등 부제 */}
          <CardHtml x={64} y={THUMBNAIL_TOP + THUMBNAIL_HEIGHT + 24} width={CARD_WIDTH - 128} height={80}>
            {subtitleBlock}
          </CardHtml>
        </>
      ) : (
        <CardHtml x={64} y={CARD_HEIGHT - 360} width={CARD_WIDTH - 128} height={300}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end", height: "100%" }}>
            {titleBlock}
            {subtitleBlock}
          </div>
        </CardHtml>
      )}
    </CardCanvas>
  );
}
