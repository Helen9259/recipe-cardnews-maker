import { NextResponse } from "next/server";
import { structureRecipeWithCategoryFromYoutubeDetails } from "@/lib/server/extractRecipe";
import { getOrCompute } from "@/lib/server/resultCache";
import { RecommendationCandidate } from "@/types/recommendation";
import { RecommendedRecipe } from "@/types/recipe";

// Gemini 요청 큐(최소 13초 간격) + 429 재시도 때문에 오래 걸릴 수 있다.
export const maxDuration = 60;

/**
 * 사용자가 추천 목록에서 후보 하나를 선택했을 때만 호출된다.
 * 카테고리 분류와 레시피 구조화를 별도 호출로 나누지 않고 한 번의 Gemini 호출로 같이 받는다
 * (structureRecipeWithCategoryFromYoutubeDetails). 선택하지 않은 나머지 후보는 Gemini를 전혀 타지 않고,
 * 같은 영상을 다시 선택해도 캐시된 결과를 재사용한다.
 */
export async function POST(request: Request) {
  try {
    const { candidate } = (await request.json()) as { candidate?: RecommendationCandidate };
    if (!candidate) {
      return NextResponse.json({ error: "candidate가 필요합니다." }, { status: 400 });
    }

    const recipe = await getOrCompute(`select:${candidate.videoId}`, () =>
      structureRecipeWithCategoryFromYoutubeDetails(
        {
          videoId: candidate.videoId,
          title: candidate.title,
          description: candidate.description,
          channelTitle: candidate.sourceName,
          thumbnailUrl: candidate.thumbnailUrl,
          viewCount: candidate.viewCount,
          publishedAt: candidate.publishedAt,
        },
        candidate.sourceUrl
      )
    );

    const result: RecommendedRecipe = {
      ...recipe,
      viewCount: candidate.viewCount,
      publishedAt: candidate.publishedAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
