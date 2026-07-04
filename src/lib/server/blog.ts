import * as cheerio from "cheerio";
import { isNaverBlogUrl, toNaverMobileUrl } from "./sourceDetect";

const NAVER_CONTENT_SELECTORS = ["div.se-main-container", "#postViewArea", "#viewTypeSelector"];

/**
 * 블로그 URL의 본문 텍스트를 추출한다.
 * 네이버블로그는 PC버전이 본문을 iframe으로 렌더링해서 fetch로 못 읽기 때문에
 * m.blog.naver.com 모바일 주소로 변환해서 접근한다.
 */
export async function fetchBlogText(url: string): Promise<{ text: string; blogName: string }> {
  const targetUrl = isNaverBlogUrl(url) ? toNaverMobileUrl(url) : url;

  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`블로그 페이지를 불러오지 못했습니다 (${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, noscript, nav, header, footer").remove();

  let contentEl = null;
  for (const selector of NAVER_CONTENT_SELECTORS) {
    if ($(selector).length) {
      contentEl = $(selector);
      break;
    }
  }

  const text = (contentEl ?? $("article, main, body")).first().text().replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  const blogName =
    $('meta[property="og:site_name"]').attr("content") ||
    $("title").text().split(/[|\-·]/)[0]?.trim() ||
    new URL(url).hostname;

  return { text, blogName };
}
