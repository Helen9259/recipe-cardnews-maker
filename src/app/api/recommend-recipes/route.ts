import { NextResponse } from "next/server";
import { searchPopularCookingVideos } from "@/lib/server/youtube";
import { classifyRecipeCategory } from "@/lib/server/gemini";
import { structureRecipeFromYoutubeDetails, youtubeWatchUrl } from "@/lib/server/extractRecipe";
import { RecommendedRecipe } from "@/types/recipe";

const RESULT_COUNT = 5;

// "다시 리서치" 버튼을 눌렀을 때 검색어를 바꿔서 다른 결과가 나오도록 여러 쿼리 중 랜덤 선택
const QUERY_POOL = [
  "집밥 레시피 만드는법",
  "자취 요리 레시피",
  "초간단 레시피",
  "오늘 뭐 먹지 레시피",
  "홈쿠킹 레시피",
  "간단 요리 레시피",
];

export async function GET() {
  try {
    const query = QUERY_POOL[Math.floor(Math.random() * QUERY_POOL.length)];
    const candidates = await searchPopularCookingVideos(query, 15);
    const top = candidates.slice(0, RESULT_COUNT);

    if (top.length === 0) {
      return NextResponse.json({ error: "추천할 만한 영상을 찾지 못했습니다." }, { status: 404 });
    }

    const recommendations = await Promise.all(
      top.map(async (video): Promise<RecommendedRecipe> => {
        const sourceUrl = youtubeWatchUrl(video.videoId);
        const [recipe, category] = await Promise.all([
          structureRecipeFromYoutubeDetails(video, sourceUrl),
          classifyRecipeCategory(video.title, video.description),
        ]);

        return {
          ...recipe,
          category,
          viewCount: video.viewCount,
          publishedAt: video.publishedAt,
        };
      })
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
