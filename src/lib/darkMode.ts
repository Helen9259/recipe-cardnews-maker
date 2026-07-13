import { ColorMode } from "@/types/recipe";

export interface DarkModeTokens {
  text: string;
  subtext: string;
  watermark: string;
  /** 구분선 등 저채도 장식 요소. 텍스트 색과 같은 계열의 반투명값 */
  divider: string;
}

/**
 * 카드뉴스 배경색은 이제 항상 메인 컬러이고, mode는 그 위에 얹히는 기본 텍스트 색상만 결정한다.
 * 화이트 모드 = 어두운 텍스트, 다크 모드 = 밝은 텍스트. 사용자가 고른 메인 컬러와의 조합이
 * 가독성이 떨어지더라도 자동으로 보정하지 않고 그대로 렌더링한다.
 * 카드뉴스 렌더링 컴포넌트에서만 사용 (사이트 UI는 별도 뉴트럴 고정값 사용).
 */
export function getDarkModeTokens(mode: ColorMode): DarkModeTokens {
  if (mode === "dark") {
    return {
      text: "#f5f5f5",
      subtext: "#d4d4d4",
      watermark: "#f5f5f5",
      divider: "rgba(245,245,245,0.35)",
    };
  }
  return {
    text: "#262626",
    subtext: "#525252",
    watermark: "#262626",
    divider: "rgba(38,38,38,0.25)",
  };
}
