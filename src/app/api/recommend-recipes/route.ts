import { NextResponse } from "next/server";
import { searchPopularCookingVideos } from "@/lib/server/youtube";
import { classifyRecipeCategories } from "@/lib/server/gemini";
import { structureRecipeFromYoutubeDetails, youtubeWatchUrl } from "@/lib/server/extractRecipe";
import { RecommendedRecipe } from "@/types/recipe";

// Gemini 요청 큐(최소 12~15초 간격) 때문에 이 라우트는 오래 걸릴 수 있어 넉넉하게 잡는다.
// Vercel Hobby 플랜은 60초로 강제 상한되니 README의 "알려진 제한사항" 참고.
export const maxDuration = 120;

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

    // 영상마다 따로 분류하지 않고 한 번의 Gemini 호출로 전체 카테고리를 매긴다
    const categories = await classifyRecipeCategories(
      top.map((video) => ({ title: video.title, description: video.description }))
    );

    // structureRecipeFromYoutubeDetails 안의 Gemini 호출은 모두 같은 요청 큐를 거치므로
    // Promise.all로 동시에 시작해도 실제로는 최소 간격을 두고 순서대로 나간다
    const recommendations = await Promise.all(
      top.map(async (video, idx): Promise<RecommendedRecipe> => {
        const sourceUrl = youtubeWatchUrl(video.videoId);
        const recipe = await structureRecipeFromYoutubeDetails(video, sourceUrl);

        return {
          ...recipe,
          category: categories[idx] || "기타",
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
