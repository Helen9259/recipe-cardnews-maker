import { FontOption } from "@/types/recipe";

export const FONT_OPTION_META: Record<FontOption, { label: string; className: string; cssVar: string }> = {
  pretendard: { label: "Pretendard", className: "font-pretendard", cssVar: "var(--font-pretendard)" },
  notosans: { label: "Noto Sans KR", className: "font-notosans", cssVar: "var(--font-notosans)" },
  okaydandan: { label: "오케이 딴딴체", className: "font-okaydandan", cssVar: "var(--font-okaydandan)" },
  ggubblim: { label: "꾸블림체", className: "font-ggubblim", cssVar: "var(--font-ggubblim)" },
  dosgothic: { label: "도스고딕", className: "font-dosgothic", cssVar: "var(--font-dosgothic)" },
};

export const FONT_OPTION_ORDER: FontOption[] = [
  "ggubblim",
  "pretendard",
  "notosans",
  "okaydandan",
  "dosgothic",
];

/**
 * 카드 SVG(foreignObject) 내부에서 쓰는 실제 font-family 문자열.
 * CSS 변수 대신 리터럴 스택을 써야 SVG를 파일로 내려받아 다른 곳에서 열어도
 * (폰트가 없을 때의 대체 폰트까지 포함해) 의도한 형태로 최대한 가깝게 보인다.
 */
export const FONT_FAMILY_STACK: Record<FontOption, string> = {
  pretendard: '"Pretendard Variable", Pretendard, -apple-system, sans-serif',
  notosans: '"Noto Sans KR", sans-serif',
  okaydandan: '"Okay Dandan", cursive',
  ggubblim: '"Ggubblim", cursive',
  dosgothic: '"DOSGothic", sans-serif',
};
