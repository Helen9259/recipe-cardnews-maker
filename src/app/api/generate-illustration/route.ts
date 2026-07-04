import { NextResponse } from "next/server";

const CF_MODEL = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
// 4:3 가로형 (spec 고정 비율)
const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 768;

const STYLE_SUFFIX =
  "minimalist single-line doodle illustration, thin uniform black line, coloring book style, " +
  "no fill, isolated on transparent background, no color, no shading, no gradient, single centered cooking scene";

const NEGATIVE_PROMPT =
  "photorealistic, 3D render, complex shading, gradient, colored background, watermark, text, " +
  "signature, blurry, low quality, multiple panels";

/**
 * "볶다"처럼 동작만 뭉뚱그리지 않고, 손/조리도구/재료가 그 동작을 하고 있는 장면을 명시해서
 * 삽화가 실제 조리 단계를 구체적으로 묘사하도록 유도한다.
 */
function buildPrompt(stepText: string): string {
  return (
    `A hand performing this specific cooking action, showing the hands, cooking tool, and ingredients ` +
    `clearly engaged in the action: "${stepText}". Style: ${STYLE_SUFFIX}.`
  );
}

export async function POST(request: Request) {
  try {
    const { stepText } = (await request.json()) as { stepText?: string };
    if (!stepText) {
      return NextResponse.json({ error: "stepText가 필요합니다." }, { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN이 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: buildPrompt(stepText),
          negative_prompt: NEGATIVE_PROMPT,
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Cloudflare Workers AI 호출 실패 (${res.status}): ${errText.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "";

    // Cloudflare AI 게이트웨이 설정에 따라 raw 이미지 바이너리 또는 JSON({result:{image: base64}})
    // 두 가지 응답 형태가 있을 수 있어 모두 처리한다.
    if (contentType.includes("application/json")) {
      const data = await res.json();
      const base64 = data?.result?.image;
      if (!base64) {
        return NextResponse.json({ error: "이미지 생성 결과를 찾을 수 없습니다." }, { status: 502 });
      }
      return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
