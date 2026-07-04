import { NextResponse } from "next/server";
import { detectSourceType, extractYoutubeVideoId } from "@/lib/server/sourceDetect";
import { fetchVideoDetails, isTextTooThin } from "@/lib/server/youtube";
import { fetchBlogText } from "@/lib/server/blog";
import { structureRecipeFromText } from "@/lib/server/gemini";
import { structureRecipeFromYoutubeDetails } from "@/lib/server/extractRecipe";
import { getOrCompute } from "@/lib/server/resultCache";

// 429 재시도 대기 때문에 오래 걸릴 수 있어 넉넉하게 잡는다. (Vercel Hobby 플랜은 60초 강제 상한)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url이 필요합니다." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "올바른 URL이 아닙니다." }, { status: 400 });
    }

    const sourceType = detectSourceType(parsedUrl.toString());

    if (sourceType === "youtube") {
      const videoId = extractYoutubeVideoId(parsedUrl.toString());
      if (!videoId) {
        return NextResponse.json({ error: "유튜브 영상 URL에서 videoId를 찾지 못했습니다." }, { status: 400 });
      }

      const details = await fetchVideoDetails(videoId);
      if (!details) {
        return NextResponse.json({ error: "해당 유튜브 영상을 찾을 수 없습니다." }, { status: 404 });
      }

      // 같은 영상을 다시 제출하거나(뒤로가기 후 재시도) 더블클릭으로 중복 제출해도
      // Gemini를 다시 부르지 않고 진행 중이거나 끝난 결과를 재사용한다
      const recipe = await getOrCompute(`extract:youtube:${videoId}`, () =>
        structureRecipeFromYoutubeDetails(details, parsedUrl.toString())
      );
      return NextResponse.json(recipe);
    }

    // 블로그 (네이버블로그는 모바일 버전으로 우회, 일반 블로그는 그대로 fetch)
    const { text, blogName } = await fetchBlogText(parsedUrl.toString());
    if (isTextTooThin(text)) {
      return NextResponse.json(
        { error: "블로그 본문을 추출하지 못했습니다. 다른 URL을 시도해주세요." },
        { status: 422 }
      );
    }

    const recipe = await getOrCompute(`extract:blog:${parsedUrl.toString()}`, () =>
      structureRecipeFromText(text, {
        sourceType: "blog",
        sourceUrl: parsedUrl.toString(),
        sourceName: blogName,
      })
    );

    return NextResponse.json(recipe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
