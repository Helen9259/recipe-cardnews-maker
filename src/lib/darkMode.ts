import { ColorMode } from "@/types/recipe";

export interface DarkModeTokens {
  background: string;
  text: string;
  subtext: string;
  watermark: string;
  /** 손그림 삽화의 SVG stroke 색. 다크모드에서는 밝은 톤으로 반전한다 */
  illustrationStroke: string;
  cardBorder: string;
}

/**
 * mode가 dark일 때 텍스트/워터마크/삽화 라인 색을 밝은 톤으로 반전 처리한다.
 * 카드뉴스 렌더링 컴포넌트에서만 사용 (사이트 UI는 별도 뉴트럴 고정값 사용).
 */
export function getDarkModeTokens(mode: ColorMode): DarkModeTokens {
  if (mode === "dark") {
    return {
      background: "#1c1c1c",
      text: "#f5f5f5",
      subtext: "#d4d4d4",
      watermark: "#f5f5f5",
      illustrationStroke: "#f5f5f5",
      cardBorder: "#333333",
    };
  }
  return {
    background: "#ffffff",
    text: "#262626",
    subtext: "#525252",
    watermark: "#262626",
    illustrationStroke: "#1a1a1a",
    cardBorder: "#e5e5e5",
  };
}

/**
 * 삽화는 항상 "검은 얇은 라인, 투명 배경" 고정 스타일로 생성되므로(생성 프롬프트 자체는 불변),
 * 다크모드에서는 CSS filter로 라인 색만 밝은 톤으로 반전해서 보여준다.
 */
export function getIllustrationFilter(mode: ColorMode): string {
  return mode === "dark" ? "invert(1) brightness(1.15)" : "none";
}
