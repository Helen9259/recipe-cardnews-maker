export type CardKind = "cover" | "ingredients" | "steps" | "outro";

export type CardLineRole = "title" | "subtitle" | "body" | "tip" | "watermark";

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
  /** 표지 카드의 유튜브 썸네일 또는 순서 카드의 삽화(Cloudflare Workers AI 생성 or 사용자 업로드) */
  imageUrl?: string;
  /** 원본 RecipeStep id 목록 (steps 카드 재생성/추적용) */
  stepIds?: string[];
  /** 이 단계에서 삽화의 주인공이 될 핵심 재료명 (steps 카드 전용, recipe.ingredients에서 매칭) */
  keyIngredient?: string;
  /** 화면6 내보내기에서 선택 해제 시 false */
  selected: boolean;
}
