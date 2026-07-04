import { Recipe } from "@/types/recipe";
import { fetchTopComments, isTextTooThin, YoutubeVideoDetails } from "./youtube";
import {
  RecipeSourceMeta,
  structureRecipeFromText,
  structureRecipeFromYoutubeVideo,
  structureRecipeWithCategoryFromText,
  structureRecipeWithCategoryFromYoutubeVideo,
} from "./gemini";

/**
 * 1차: 설명란 → 2차: 댓글 보강 → 3차: 그래도 부실하면 Gemini가 영상을 직접 분석.
 * 실제 구조화 호출(text/video)만 갈아끼울 수 있게 분리해서 카테고리 포함 버전과 공유한다.
 */
async function withYoutubeFallback<T>(
  details: YoutubeVideoDetails,
  sourceUrl: string,
  structureText: (text: string, meta: RecipeSourceMeta) => Promise<T>,
  structureVideo: (url: string, meta: RecipeSourceMeta) => Promise<T>
): Promise<T> {
  const meta: RecipeSourceMeta = {
    sourceType: "youtube",
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
    return structureVideo(sourceUrl, meta);
  }
  return structureText(combinedText, meta);
}

/** 유튜브 영상 상세정보(설명란)로부터 Recipe를 구조화한다. (detect-and-extract에서 사용) */
export function structureRecipeFromYoutubeDetails(
  details: YoutubeVideoDetails,
  sourceUrl: string
): Promise<Recipe> {
  return withYoutubeFallback(details, sourceUrl, structureRecipeFromText, structureRecipeFromYoutubeVideo);
}

/**
 * 위와 동일한 폴백 로직이지만 카테고리 분류까지 한 번의 Gemini 호출에 같이 받는다.
 * (AI 추천 레시피 화면에서 사용 — 별도 분류 호출을 만들지 않기 위함)
 */
export function structureRecipeWithCategoryFromYoutubeDetails(
  details: YoutubeVideoDetails,
  sourceUrl: string
): Promise<Recipe & { category: string }> {
  return withYoutubeFallback(
    details,
    sourceUrl,
    structureRecipeWithCategoryFromText,
    structureRecipeWithCategoryFromYoutubeVideo
  );
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
