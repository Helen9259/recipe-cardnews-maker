import { AppSessionState } from "@/types/recipe";

export const STEP_LABELS = ["레시피", "정보", "스타일", "편집", "다운로드"] as const;

export const ROUTE_STEP: Record<string, AppSessionState["currentStep"]> = {
  "/": 1,
  "/recommend": 1,
  "/edit": 2,
  "/style": 3,
  "/cards": 4,
  "/export": 5,
};

/**
 * 현재 경로의 "← 이전 단계로" 대상 경로.
 * '/edit'는 추천 화면을 거쳐 왔는지에 따라 되돌아갈 곳이 갈린다.
 */
export function getPrevRoute(pathname: string, hasRecommendation: boolean): string | null {
  switch (pathname) {
    case "/recommend":
      return "/";
    case "/edit":
      return hasRecommendation ? "/recommend" : "/";
    case "/style":
      return "/edit";
    case "/cards":
      return "/style";
    case "/export":
      return "/cards";
    default:
      return null;
  }
}
