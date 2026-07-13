import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { toProxiedImageUrl } from "@/lib/imageProxy";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { getMainColorHex } from "@/lib/cardColors";
import { getModeBackgroundColor } from "@/lib/darkMode";
import { autoFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

const TITLE_FONT_SIZE = { min: 66, max: 94, idealChars: 10 };
const SUBTITLE_FONT_SIZE = { min: 30, max: 36, idealChars: 16 };
const WATERMARK_FONT_SIZE = 38;
// 유튜브 썸네일은 16:9(맥스레스, 세로 약 608px)나 4:3(썸네일 API 폴백, 세로 810px)로 오는데
// 어느 쪽이든 가로 폭 100%로 꽉 차게 나오도록, 4:3 기준 필요 높이보다 넉넉하게 잡는다.
// 이 값을 넘는 세로로 긴 사진(주로 사용자 업로드)만 letterbox 처리되어 폭이 줄어든다.
const IMAGE_MAX_HEIGHT = 860;

/**
 * 표지 카드는 3가지 버전 중 하나로 렌더링된다 (card.coverImageMode):
 * - "youtube" / "upload": 사진을 카드 상단에 원본 비율 그대로(크롭/오버레이 없이) 배치하고,
 *   요리 이름/출처/워터마크는 사진 아래 남는 공간에 별도로 배치한다.
 * - "none": 이미지 없이 텍스트+출처만 (카드 하단에 배치, 기존 방식 유지)
 */
export function CoverCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.mainFont];
  const titleLines = getLines(card, "title").filter((l) => l.text);
  const subtitle = getLine(card, "subtitle");
  const watermark = getLine(card, "watermark");
  const hasImage = card.coverImageMode !== "none" && Boolean(card.imageUrl);
  // 표지는 배경을 메인 컬러로 채우지 않고 화이트/다크 모드 그대로 유지한다.
  // 포인트 컬러(메인 컬러)는 제목 등 텍스트와, 이미지 없는 버전의 옅은 배경 톤에만 쓰인다.
  const background = getModeBackgroundColor(style.mode);
  const accent = getMainColorHex(style.mainColor);

  if (!hasImage) {
    return (
      <CardCanvas mode={style.mode} mainColor={style.mainColor} background={background}>
        <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill={accent} opacity={0.22} />
        {watermark?.text && (
          <CardHtml x={0} y={56} width={CARD_WIDTH} height={60}>
            <div style={{ textAlign: "center", fontFamily, fontSize: WATERMARK_FONT_SIZE, fontWeight: 600, color: watermark.color }}>
              {watermark.text}
            </div>
          </CardHtml>
        )}

        <CardHtml x={64} y={CARD_HEIGHT - 360} width={CARD_WIDTH - 128} height={300}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end", height: "100%" }}>
            {titleLines.length > 0 && (
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
            )}
            {subtitle?.text && (
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
            )}
          </div>
        </CardHtml>
      </CardCanvas>
    );
  }

  const src = toProxiedImageUrl(card.imageUrl);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor} background={background}>
      <CardHtml x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: IMAGE_MAX_HEIGHT,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "32px 64px 40px",
              fontFamily,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {titleLines.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {titleLines.map((titleLine) => (
                    <div
                      key={titleLine.id}
                      style={{
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
              )}
              {subtitle?.text && (
                <div
                  style={{
                    fontSize: autoFontSize(subtitle.text, SUBTITLE_FONT_SIZE),
                    fontWeight: 400,
                    color: subtitle.color,
                  }}
                >
                  {subtitle.text}
                </div>
              )}
            </div>

            {watermark?.text && (
              <div style={{ fontSize: WATERMARK_FONT_SIZE, fontWeight: 600, color: watermark.color }}>
                {watermark.text}
              </div>
            )}
          </div>
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
