import { NextResponse } from "next/server";
import { classifyRecipeCategories } from "@/lib/server/gemini";
import { structureRecipeFromYoutubeDetails } from "@/lib/server/extractRecipe";
import { RecommendationCandidate } from "@/types/recommendation";
import { RecommendedRecipe } from "@/types/recipe";

// Gemini 요청 큐(최소 13초 간격) + 429 재시도 때문에 오래 걸릴 수 있다.
export const maxDuration = 60;

/**
 * 사용자가 추천 목록에서 후보 하나를 선택했을 때만 호출된다.
 * 카테고리 분류(1개짜리 배열로 classifyRecipeCategories 재사용)와 레시피 구조화를
 * 이 후보 하나에 대해서만 수행한다 — 선택하지 않은 나머지 후보는 Gemini를 전혀 타지 않는다.
 */
export async function POST(request: Request) {
  try {
    const { candidate } = (await request.json()) as { candidate?: RecommendationCandidate };
    if (!candidate) {
      return NextResponse.json({ error: "candidate가 필요합니다." }, { status: 400 });
    }

    const [categories, recipe] = await Promise.all([
      classifyRecipeCategories([{ title: candidate.title, description: candidate.description }]),
      structureRecipeFromYoutubeDetails(
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
      ),
    ]);

    const result: RecommendedRecipe = {
      ...recipe,
      category: categories[0] || "기타",
      viewCount: candidate.viewCount,
      publishedAt: candidate.publishedAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
