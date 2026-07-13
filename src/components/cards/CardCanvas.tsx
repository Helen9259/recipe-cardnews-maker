import type { ReactNode } from "react";
import { ColorMode, MainColor } from "@/types/recipe";
import { getCardBackgroundColor } from "@/lib/cardColors";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

interface CardCanvasProps {
  mode: ColorMode;
  mainColor: MainColor;
  /** 지정하면 메인 컬러 대신 이 색을 배경으로 쓴다 (표지 카드는 화이트/다크 배경을 유지) */
  background?: string;
  children: ReactNode;
}

/**
 * 모든 카드 컴포넌트의 SVG 루트. 기본적으로 배경은 사용자가 고른 메인 컬러 그대로 채우고,
 * mode(화이트/다크)는 배경이 아니라 각 카드 컴포넌트가 텍스트 색 계산에 쓴다(getDarkModeTokens).
 * background prop을 넘기면 메인 컬러 대신 그 색으로 배경을 채운다.
 */
export function CardCanvas({ mainColor, background: backgroundOverride, children }: CardCanvasProps) {
  const background = backgroundOverride ?? getCardBackgroundColor(mainColor);

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
