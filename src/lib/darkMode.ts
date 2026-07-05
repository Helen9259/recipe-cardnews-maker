import { ColorMode } from "@/types/recipe";

export interface DarkModeTokens {
  background: string;
  text: string;
  subtext: string;
  watermark: string;
  cardBorder: string;
}

/**
 * mode가 dark일 때 텍스트/워터마크 색을 밝은 톤으로 반전 처리한다.
 * 삽화는 이제 컬러 일러스트라 반전이 필요 없어 별도 처리하지 않고 재료 고유색 그대로 보여준다.
 * 카드뉴스 렌더링 컴포넌트에서만 사용 (사이트 UI는 별도 뉴트럴 고정값 사용).
 */
export function getDarkModeTokens(mode: ColorMode): DarkModeTokens {
  if (mode === "dark") {
    return {
      background: "#1c1c1c",
      text: "#f5f5f5",
      subtext: "#d4d4d4",
      watermark: "#f5f5f5",
      cardBorder: "#333333",
    };
  }
  return {
    background: "#ffffff",
    text: "#262626",
    subtext: "#525252",
    watermark: "#262626",
    cardBorder: "#e5e5e5",
  };
}
