import type { ReactNode } from "react";
import { ColorMode, MainColor } from "@/types/recipe";
import { getDarkModeTokens } from "@/lib/darkMode";
import { getCardAccentColor } from "@/lib/cardColors";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

interface CardCanvasProps {
  mode: ColorMode;
  mainColor: MainColor;
  children: ReactNode;
}

/**
 * 모든 카드 컴포넌트의 SVG 루트. --card-accent-color는 이 svg 내부 <style>에만
 * 정의되어 있어 SVG 파일을 단독으로 내려받아도(사이트 CSS 없이) 그대로 렌더링된다.
 */
export function CardCanvas({ mode, mainColor, children }: CardCanvasProps) {
  const tokens = getDarkModeTokens(mode);
  const accent = getCardAccentColor(mainColor, mode);

  return (
    <svg
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className="block h-auto w-full"
    >
      <style>{`:root { --card-accent-color: ${accent}; }`}</style>
      <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={tokens.background} />
      {children}
    </svg>
  );
}
