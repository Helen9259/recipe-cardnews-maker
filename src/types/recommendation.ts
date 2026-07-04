/**
 * AI 추천 레시피 화면의 1차 목록에 쓰는 가벼운 후보 데이터.
 * 유튜브 검색 결과 메타데이터만 담고 있고, Gemini 분석(카테고리/재료/순서)은
 * 아직 하지 않은 상태 — 사용자가 실제로 선택했을 때만 서버에 분석을 요청한다.
 */
export interface RecommendationCandidate {
  videoId: string;
  sourceUrl: string;
  title: string;
  /** 카테고리 분류/레시피 구조화 시 재사용 (다시 유튜브 API를 호출하지 않기 위함) */
  description: string;
  sourceName: string;
  thumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
}
