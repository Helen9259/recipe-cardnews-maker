import { MainColor } from "@/types/recipe";

/**
 * 카드뉴스 본문 배경색 팔레트. 사이트 UI(버튼/로딩바 등)는 절대 이 값을 참조하지 않고
 * neutral 고정값만 사용한다.
 */
export const MAIN_COLOR_HEX: Record<MainColor, { hex: string; label: string }> = {
  butter: { hex: "#FFF3B0", label: "버터" },
  yellow: { hex: "#FFD400", label: "옐로우" },
  mint: { hex: "#4fd1c5", label: "민트" },
  green: { hex: "#6fbf73", label: "그린" },
  lavender: { hex: "#a78bfa", label: "라벤더" },
  coralpink: { hex: "#ff8fa3", label: "코랄핑크" },
  blue: { hex: "#5b9bf5", label: "블루" },
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

/** 카드뉴스 본문 배경색으로 그대로 쓰인다 (모드와 무관, 사용자가 고른 색 그대로) */
export function getCardBackgroundColor(mainColor: MainColor): string {
  return MAIN_COLOR_HEX[mainColor].hex;
}
