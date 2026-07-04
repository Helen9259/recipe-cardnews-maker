/**
 * PNG 다운로드(canvas rasterize) 시 캔버스 오염을 막기 위해 외부 이미지를
 * 같은 출처의 /api/image-proxy로 우회시킨다. data: URL이나 이미 프록시된 값은 그대로 둔다.
 */
export function toProxiedImageUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("/api/image-proxy")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
