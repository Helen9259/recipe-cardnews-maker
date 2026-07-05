import { CardNewsCard } from "./card";

export type SourceType = "youtube" | "blog";
export type ColorMode = "light" | "dark";
export type MainColor =
  | "butter"
  | "yellow"
  | "mint"
  | "green"
  | "lavender"
  | "coralpink"
  | "blue";
export type FontOption =
  | "pretendard"
  | "notosans"
  | "okaydandan"
  | "ggubulrim"
  | "dosgothic"
  | "cocochoitoon";

export interface RecipeStep {
  id: string;
  text: string;
  /** 있으면 카드 하단에 인라인 표시 */
  tip?: string;
  /** Cloudflare Workers AI 생성 결과(4:3 가로형) or 사용자 업로드 */
  illustrationUrl?: string;
}

export interface Recipe {
  title: string;
  sourceType: SourceType;
  sourceUrl: string;
  /** 유튜브 채널명 or 블로그명 */
  sourceName: string;
  /** 유튜브 썸네일 (표지 배경용) */
  thumbnailUrl?: string;
  /** 예: "2인분" */
  servings: string;
  ingredients: string[];
  /** 최대 15개 (분할 후 기준) */
  steps: RecipeStep[];
}

export interface CardStyle {
  mode: ColorMode;
  mainColor: MainColor;
  font: FontOption;
}

export interface CardNewsProject {
  recipe: Recipe;
  style: CardStyle;
  instaAccountName: string;
  /** 마무리 카드용 홍보문구 */
  promoText: string;
  /**
   * 생성된 카드뉴스 카드 배열 (화면5 편집 내용 포함).
   * 화면4→5로 넘어갈 때 채워지며, 세션 유지를 위해 project에 함께 저장한다.
   */
  cards?: CardNewsCard[];
}

/** 세션 유지용 전역 상태 (Context + sessionStorage 동기화) */
export interface AppSessionState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  inputUrl: string;
  selectedRecommendation: Recipe | null;
  project: CardNewsProject | null;
}

export interface RecommendedRecipe extends Recipe {
  category: string;
  viewCount: number;
  publishedAt: string;
}
