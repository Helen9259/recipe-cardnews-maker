import { NextRequest, NextResponse } from "next/server";
import { searchPopularCookingVideos, searchCookingVideosByQuery } from "@/lib/server/youtube";
import { youtubeWatchUrl } from "@/lib/server/extractRecipe";
import { RecommendationCandidate } from "@/types/recommendation";

const RESULT_COUNT = 5;
const SEARCH_RESULT_COUNT = 8;

// "다시 리서치" 버튼을 눌렀을 때 검색어를 바꿔서 다른 결과가 나오도록 여러 쿼리 중 랜덤 선택
const QUERY_POOL = [
  "집밥 레시피 만드는법",
  "자취 요리 레시피",
  "초간단 레시피",
  "오늘 뭐 먹지 레시피",
  "홈쿠킹 레시피",
  "간단 요리 레시피",
];

/**
 * 유튜브 검색 결과 메타데이터만 반환한다. 여기서는 Gemini를 전혀 호출하지 않는다 —
 * 카테고리 분류/레시피 구조화는 사용자가 후보 중 하나를 선택했을 때
 * /api/recommend-recipes/select에서 지연 평가로 처리한다.
 *
 * ?q= 검색어가 있으면 AI 추천(인기+신선도 가중치) 대신 그 검색어로 직접 유튜브 검색을 실행한다.
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();

    const top = query
      ? await searchCookingVideosByQuery(query, SEARCH_RESULT_COUNT)
      : (await searchPopularCookingVideos(QUERY_POOL[Math.floor(Math.random() * QUERY_POOL.length)], 15)).slice(
          0,
          RESULT_COUNT
        );

    if (top.length === 0) {
      return NextResponse.json(
        { error: query ? "검색 결과가 없어요. 다른 검색어로 시도해보세요." : "추천할 만한 영상을 찾지 못했습니다." },
        { status: 404 }
      );
    }

    const result: RecommendationCandidate[] = top.map((video) => ({
      videoId: video.videoId,
      sourceUrl: youtubeWatchUrl(video.videoId),
      title: video.title,
      description: video.description,
      sourceName: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
