import { SourceType } from "@/types/recipe";

const YOUTUBE_PATTERN = /(?:youtube\.com|youtu\.be)/i;

export function detectSourceType(url: string): SourceType {
  return YOUTUBE_PATTERN.test(url) ? "youtube" : "blog";
}

/** youtube.com/watch?v=, youtu.be/, shorts/, embed/ 등 다양한 형식에서 videoId 추출 */
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const match = parsed.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function isNaverBlogUrl(url: string): boolean {
  return /(^|\.)blog\.naver\.com/i.test(new URL(url).hostname);
}

/** 네이버블로그는 PC버전이 iframe 안에 본문을 렌더링해서 fetch로는 못 읽는다. 모바일 버전으로 우회 */
export function toNaverMobileUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hostname = "m.blog.naver.com";
  return parsed.toString();
}
