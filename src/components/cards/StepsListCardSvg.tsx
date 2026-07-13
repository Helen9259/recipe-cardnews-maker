import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { PhotoBackgroundOverlay, PhotoTopHalf, TOP_HALF_CONTENT_Y_OFFSET } from "./PhotoOverlay";
import { getLine, getLines } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { getPaleMainColor } from "@/lib/cardColors";
import { fitMultilineFontSize } from "@/lib/autoFontSize";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

// 순서 설명 텍스트는 개별 항목 길이가 아니라 전체 분량 기준으로 하나의 고정 크기를 쓴다.
// (모든 항목이 같은 크기 + 카드 밖으로 넘치지 않게)
const STEP_MAX_FONT = 44;
const STEP_MIN_FONT = 24;
const TITLE_BLOCK_HEIGHT = 90;

/** 재료+순서 통합 카드가 내용 초과로 분할될 때, 순서만 모아서 보여주는 카드 */
export function StepsListCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.mainFont];
  // 재료/순서 카드와 동일하게 포인트 컬러를 옅게 희석한 색을 배경으로 쓴다
  const background = getPaleMainColor(style.mainColor);
  const title = getLine(card, "title");
  const steps = getLines(card, "step");

  const hasPhoto = Boolean(card.imageUrl) && Boolean(card.photoLayout);
  const isBackground = hasPhoto && card.photoLayout === "background";
  const isTopHalf = hasPhoto && card.photoLayout === "top-half";
  const boxY = isTopHalf ? TOP_HALF_CONTENT_Y_OFFSET : 80;
  const boxHeight = isTopHalf ? CARD_HEIGHT - TOP_HALF_CONTENT_Y_OFFSET - 40 : CARD_HEIGHT - 160;
  const textColor = (fallback: string) => (isBackground ? "#ffffff" : fallback);

  const listAvailableHeight = boxHeight - (title?.text ? TITLE_BLOCK_HEIGHT : 0);
  const stepFontSize = fitMultilineFontSize(
    steps.map((s) => s.text),
    {
      maxFontSize: STEP_MAX_FONT,
      minFontSize: STEP_MIN_FONT,
      availableWidth: CARD_WIDTH - 128,
      availableHeight: listAvailableHeight,
      lineHeightRatio: 1.4,
      gapPx: 22,
      charWidthRatio: 0.85,
    }
  );

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor} background={background}>
      {isBackground && card.imageUrl && <PhotoBackgroundOverlay imageUrl={card.imageUrl} gradientId="stepslist-gradient" />}
      {isTopHalf && card.imageUrl && <PhotoTopHalf imageUrl={card.imageUrl} />}

      <CardHtml x={64} y={boxY} width={CARD_WIDTH - 128} height={boxHeight}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily, gap: 28 }}>
          {title?.text && (
            <span style={{ fontSize: 50, fontWeight: 800, color: textColor(title.color) }}>{title.text}</span>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, overflow: "hidden" }}>
            {steps.map((step) => (
              <span
                key={step.id}
                style={{
                  fontSize: stepFontSize,
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
