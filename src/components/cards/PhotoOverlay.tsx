import { toProxiedImageUrl } from "@/lib/imageProxy";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

/** 카드 전체를 사진 배경으로 채우고 아래쪽에 어두운 그라디언트를 얹어 텍스트 가독성을 확보한다 */
export function PhotoBackgroundOverlay({ imageUrl, gradientId }: { imageUrl: string; gradientId: string }) {
  const src = toProxiedImageUrl(imageUrl);
  return (
    <>
      <image href={src} x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} preserveAspectRatio="xMidYMid slice" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="35%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.78" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${gradientId})`} />
    </>
  );
}

/** 카드 상단 절반만 사진, 하단은 카드 배경색 위에 텍스트를 얹는다 */
export function PhotoTopHalf({ imageUrl }: { imageUrl: string }) {
  const src = toProxiedImageUrl(imageUrl);
  return (
    <image href={src} x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT / 2} preserveAspectRatio="xMidYMid slice" />
  );
}

export const TOP_HALF_CONTENT_Y_OFFSET = CARD_HEIGHT / 2 + 40;
