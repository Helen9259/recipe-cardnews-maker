import { NextResponse } from "next/server";
import { searchPopularCookingVideos } from "@/lib/server/youtube";
import { youtubeWatchUrl } from "@/lib/server/extractRecipe";
import { RecommendationCandidate } from "@/types/recommendation";

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

/**
 * 유튜브 검색 결과 메타데이터만 반환한다. 여기서는 Gemini를 전혀 호출하지 않는다 —
 * 카테고리 분류/레시피 구조화는 사용자가 후보 중 하나를 선택했을 때
 * /api/recommend-recipes/select에서 지연 평가로 처리한다.
 */
export async function GET() {
  try {
    const query = QUERY_POOL[Math.floor(Math.random() * QUERY_POOL.length)];
    const candidates = await searchPopularCookingVideos(query, 15);
    const top = candidates.slice(0, RESULT_COUNT);

    if (top.length === 0) {
      return NextResponse.json({ error: "추천할 만한 영상을 찾지 못했습니다." }, { status: 404 });
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
