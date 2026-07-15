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

  if (!isTextTooThin(combinedText)) {
    return structureText(combinedText, meta);
  }

  // 설명란/댓글이 부실하면 Gemini에게 영상을 직접 분석시킨다. 이때 넘기는 URL은 반드시
  // 정식 watch URL(https://www.youtube.com/watch?v=...)로 정규화해야 한다 — 사용자가
  // 붙여넣은 youtu.be 단축 링크나 공유 시 붙는 ?si= 트래킹 파라미터가 그대로 들어가면
  // Gemini가 영상을 못 찾아 추출 자체가 실패하는 경우가 있었다.
  const canonicalUrl = youtubeWatchUrl(details.videoId);
  try {
    return await structureVideo(canonicalUrl, meta);
  } catch (err) {
    // 영상 분석이 아예 실패하면(비공개/연령제한/영상 길이 제한 등) 완전히 실패하는 대신
    // 부실하더라도 있는 텍스트(제목 등)로 마지막 시도를 한다
    console.warn("[extractRecipe] 유튜브 영상 분석 실패, 텍스트 기반으로 재시도합니다:", err);
    return structureText(combinedText || details.title, meta);
  }
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
