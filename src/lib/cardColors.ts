import type { CSSProperties } from "react";
import { MainColor } from "@/types/recipe";

/**
 * 카드뉴스 렌더링 전용 포인트 컬러 팔레트.
 * 사이트 UI(버튼/로딩바 등)는 절대 이 값을 참조하지 않고 neutral 고정값만 사용한다.
 */
export const MAIN_COLOR_HEX: Record<MainColor, { light: string; dark: string; label: string }> = {
  butter: { light: "#f5c94d", dark: "#f7d878", label: "버터" },
  yellow: { light: "#f6c445", dark: "#f9d874", label: "옐로우" },
  mint: { light: "#4fd1c5", dark: "#6ee0d5", label: "민트" },
  green: { light: "#6fbf73", dark: "#8fd694", label: "그린" },
  lavender: { light: "#a78bfa", dark: "#bfa8fc", label: "라벤더" },
  coralpink: { light: "#ff8fa3", dark: "#ff9fb2", label: "코랄핑크" },
  blue: { light: "#5b9bf5", dark: "#7bb0ff", label: "블루" },
};

export const MAIN_COLOR_ORDER: MainColor[] = [
  "butter",
  "yellow",
  "mint",
  "green",
  "lavender",
  "coralpink",
  "blue",
];

export function getCardAccentColor(mainColor: MainColor, mode: "light" | "dark"): string {
  return MAIN_COLOR_HEX[mainColor][mode];
}

/** 카드 컴포넌트 루트에 주입할 CSS 변수 스타일 객체 */
export function getCardAccentStyle(mainColor: MainColor, mode: "light" | "dark"): CSSProperties {
  return { "--card-accent-color": getCardAccentColor(mainColor, mode) } as CSSProperties;
}
