import { Recipe } from "@/types/recipe";
import { fetchTopComments, isTextTooThin, YoutubeVideoDetails } from "./youtube";
import { structureRecipeFromText, structureRecipeFromYoutubeVideo } from "./gemini";

/**
 * 유튜브 영상 상세정보(설명란)로부터 Recipe를 구조화한다.
 * 1차: 설명란 → 2차: 댓글 보강 → 3차: 그래도 부실하면 Gemini가 영상을 직접 분석.
 * 이미 조회해둔 videoId 상세정보를 받아서 중복 API 호출을 피한다.
 */
export async function structureRecipeFromYoutubeDetails(
  details: YoutubeVideoDetails,
  sourceUrl: string
): Promise<Recipe> {
  const meta = {
    sourceType: "youtube" as const,
    sourceUrl,
    sourceName: details.channelTitle,
    thumbnailUrl: details.thumbnailUrl,
  };

  let combinedText = `${details.title}\n\n${details.description}`.trim();

  if (isTextTooThin(details.description)) {
    const comments = await fetchTopComments(details.videoId);
    combinedText = `${details.title}\n\n${details.description}\n\n[댓글]\n${comments}`.trim();
  }

  if (isTextTooThin(combinedText)) {
    return structureRecipeFromYoutubeVideo(sourceUrl, meta);
  }
  return structureRecipeFromText(combinedText, meta);
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
