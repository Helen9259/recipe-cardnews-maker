import { NextResponse } from "next/server";

// PNG로 rasterize할 때 캔버스가 오염(tainted canvas)되지 않도록 외부 썸네일을
// 같은 출처로 프록시한다. SSRF 방지를 위해 유튜브 썸네일 호스트만 허용한다.
const ALLOWED_HOSTNAMES = new Set([
  "i.ytimg.com",
  "img.youtube.com",
  "yt3.ggpht.com",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "올바른 URL이 아닙니다." }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTNAMES.has(parsed.hostname)) {
    return NextResponse.json({ error: "허용되지 않은 이미지 호스트입니다." }, { status: 403 });
  }

  const res = await fetch(parsed.toString());
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "이미지를 불러오지 못했습니다." }, { status: 502 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
