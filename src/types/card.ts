export type CardKind = "cover" | "ingredients" | "steps" | "ingredientsSteps" | "stepsList" | "outro";

export type CardLineRole = "title" | "subtitle" | "body" | "tip" | "watermark" | "ingredient" | "step";

/** 표지 카드 전용: 이미지를 어디서 가져올지 3가지 중 하나 */
export type CoverImageMode = "youtube" | "upload" | "none";

/** 사진이 있는 카드의 레이아웃: 카드 전체 배경 vs 상단 절반만 */
export type PhotoLayout = "background" | "top-half";

export interface CardLine {
  id: string;
  role: CardLineRole;
  text: string;
  /** 줄 단위 색상 오버라이드 (hex). 화면5 편집 패널에서 수정 가능 */
  color: string;
}

export interface CardNewsCard {
  id: string;
  kind: CardKind;
  lines: CardLine[];
  /** 유튜브 썸네일(표지) 또는 사용자가 직접 업로드한 사진(모든 카드 공통) */
  imageUrl?: string;
  /** 원본 RecipeStep id 목록 (steps/ingredientsSteps 카드 추적용) */
  stepIds?: string[];
  /** 표지 카드 전용: 이미지 출처 선택 상태 */
  coverImageMode?: CoverImageMode;
  /** imageUrl이 있는 표지 이외 카드에서 사진 배치 방식 */
  photoLayout?: PhotoLayout;
  /** 화면6 내보내기에서 선택 해제 시 false */
  selected: boolean;
}
