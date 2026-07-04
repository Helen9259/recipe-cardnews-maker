const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY가 설정되어 있지 않습니다. .env.local을 확인해주세요.");
  }
  return key;
}

interface YoutubeApiThumbnails {
  maxres?: { url: string };
  high?: { url: string };
  default?: { url: string };
}

interface YoutubeApiSnippet {
  title?: string;
  description?: string;
  channelTitle?: string;
  thumbnails?: YoutubeApiThumbnails;
  publishedAt?: string;
}

interface YoutubeApiVideoItem {
  id?: string;
  snippet?: YoutubeApiSnippet;
  statistics?: { viewCount?: string };
}

interface YoutubeApiSearchItem {
  id?: { videoId?: string };
}

interface YoutubeApiCommentItem {
  snippet?: { topLevelComment?: { snippet?: { textDisplay?: string } } };
}

function pickThumbnail(thumbnails?: YoutubeApiThumbnails): string {
  return thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.default?.url || "";
}

export interface YoutubeVideoDetails {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
}

export async function fetchVideoDetails(videoId: string): Promise<YoutubeVideoDetails | null> {
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics&id=${videoId}&key=${getApiKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube videos.list 실패 (${res.status})`);
  const data = (await res.json()) as { items?: YoutubeApiVideoItem[] };
  const item = data.items?.[0];
  if (!item) return null;

  return {
    videoId,
    title: item.snippet?.title || "",
    description: item.snippet?.description || "",
    channelTitle: item.snippet?.channelTitle || "",
    thumbnailUrl: pickThumbnail(item.snippet?.thumbnails),
    viewCount: Number(item.statistics?.viewCount || 0),
    publishedAt: item.snippet?.publishedAt || "",
  };
}

/** 설명란이 부실할 때 2차 폴백: 고정/상위 댓글에서 재료·순서 힌트를 모은다 */
export async function fetchTopComments(videoId: string, maxResults = 10): Promise<string> {
  const url = `${YOUTUBE_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=${maxResults}&key=${getApiKey()}`;
  const res = await fetch(url);
  if (!res.ok) {
    // 댓글이 막혀있는 영상 등은 조용히 빈 문자열 반환하고 다음 폴백으로 넘어가게 한다
    return "";
  }
  const data = (await res.json()) as { items?: YoutubeApiCommentItem[] };
  const texts: string[] =
    data.items?.map((item) => item.snippet?.topLevelComment?.snippet?.textDisplay || "") || [];
  return texts.join("\n");
}

/** 설명란/댓글 둘 다 부실한지 판단하는 대략적인 기준 */
export function isTextTooThin(text: string): boolean {
  return text.replace(/\s/g, "").length < 80;
}

export interface RecipeSearchResult extends YoutubeVideoDetails {
  score: number;
}

/**
 * 요리 카테고리 인기 영상을 조회수 + 최근성 조합 점수로 정렬해 추천한다.
 * publishedAfter로 최근 videos만 후보로 좁히고, 그 안에서 조회수*최근성 가중치로 재정렬.
 */
export async function searchPopularCookingVideos(
  query = "레시피 만드는법",
  candidateCount = 15
): Promise<RecipeSearchResult[]> {
  const publishedAfter = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(); // 최근 6개월
  const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=26&order=viewCount&maxResults=${candidateCount}&publishedAfter=${publishedAfter}&q=${encodeURIComponent(
    query
  )}&key=${getApiKey()}`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`YouTube search.list 실패 (${searchRes.status})`);
  const searchData = (await searchRes.json()) as { items?: YoutubeApiSearchItem[] };
  const videoIds: string[] = (searchData.items || [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) return [];

  const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics&id=${videoIds.join(
    ","
  )}&key=${getApiKey()}`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) throw new Error(`YouTube videos.list 실패 (${detailsRes.status})`);
  const detailsData = (await detailsRes.json()) as { items?: YoutubeApiVideoItem[] };

  const now = Date.now();
  const results: RecipeSearchResult[] = (detailsData.items || []).map((item) => {
    const viewCount = Number(item.statistics?.viewCount || 0);
    const publishedAt = item.snippet?.publishedAt || new Date().toISOString();
    const ageDays = Math.max(1, (now - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    // 최근성 가중치: 오래될수록 완만하게 감쇠. 조회수는 log 스케일로 완화해서 초대형 채널 쏠림 방지
    const recencyWeight = 1 / Math.log10(ageDays + 10);
    const score = Math.log10(viewCount + 1) * recencyWeight;

    return {
      videoId: item.id || "",
      title: item.snippet?.title || "",
      description: item.snippet?.description || "",
      channelTitle: item.snippet?.channelTitle || "",
      thumbnailUrl: pickThumbnail(item.snippet?.thumbnails),
      viewCount,
      publishedAt,
      score,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}
