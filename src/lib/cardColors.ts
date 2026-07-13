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

/** 메인 컬러의 순수 hex 값. 재료/순서 카드에서는 불릿·구분선·라벨 같은 포인트 텍스트 요소에 쓰인다 */
export function getMainColorHex(mainColor: MainColor): string {
  return MAIN_COLOR_HEX[mainColor].hex;
}

/** CardCanvas의 기본 배경값 (개별 카드가 background override를 안 줄 때의 안전한 기본값) */
export function getCardBackgroundColor(mainColor: MainColor): string {
  return getMainColorHex(mainColor);
}

const PALE_WHITE_RATIO = 0.78;

function mixWithWhite(hex: string, whiteRatio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (channel: number) => Math.round(channel * (1 - whiteRatio) + 255 * whiteRatio);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/** 재료/순서 카드 배경으로 쓰는, 메인 컬러를 하얗게 옅게 희석한 파스텔 톤 */
export function getPaleMainColor(mainColor: MainColor): string {
  return mixWithWhite(getMainColorHex(mainColor), PALE_WHITE_RATIO);
}
