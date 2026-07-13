import type { ReactNode } from "react";
import { ColorMode, MainColor } from "@/types/recipe";
import { getCardBackgroundColor } from "@/lib/cardColors";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

interface CardCanvasProps {
  mode: ColorMode;
  mainColor: MainColor;
  children: ReactNode;
}

/**
 * 모든 카드 컴포넌트의 SVG 루트. 배경은 사용자가 고른 메인 컬러 그대로 채운다.
 * mode(화이트/다크)는 배경이 아니라 각 카드 컴포넌트가 텍스트 색 계산에 쓴다(getDarkModeTokens).
 */
export function CardCanvas({ mainColor, children }: CardCanvasProps) {
  const background = getCardBackgroundColor(mainColor);

  return (
    <svg
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className="block h-auto w-full"
      style={{ overflow: "hidden" }}
    >
      <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={background} />
      {children}
    </svg>
  );
}
