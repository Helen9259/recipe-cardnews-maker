import { NextResponse } from "next/server";
import sharp from "sharp";

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";
// flux-1-schnell 입력 스키마는 prompt/steps/seed만 지원하고 negative_prompt·width·height가 없다
// (SDXL과 달리). steps는 최대 8(기본 4) — 속도 대비 품질을 위해 최대치를 쓴다.
const STEPS = 8;

// negative_prompt 필드가 없는 모델이라 제외하고 싶은 요소는 프롬프트 문장 안에 "no X" 형태로 넣는다.
const NEGATIVE_PHRASE =
  "not photorealistic, no 3D render, no complex shading, no watermark, no text, " +
  "no cooking utensils, no pan, no knife, no cutting board";

/** 그 단계의 핵심 재료 자체를 귀엽고 따뜻한 톤의 손그림 크레용 스타일로 그린다 */
function buildPrompt(keyIngredient: string | undefined, stepText: string): string {
  const subject = keyIngredient || `the single key ingredient involved in "${stepText}"`;
  return (
    `Cute hand-drawn illustration of ${subject}, soft crayon texture with visible pencil strokes, ` +
    "colored outlines matching the fill color (no black outlines), vivid warm color palette, " +
    "simple white background, minimal flat shading, slightly imperfect wobbly linework, " +
    `single object centered, no text. ${NEGATIVE_PHRASE}.`
  );
}

async function fetchCloudflareImageBuffer(res: Response): Promise<Buffer> {
  const contentType = res.headers.get("content-type") || "";

  // Cloudflare AI 게이트웨이 설정에 따라 raw 이미지 바이너리 또는 JSON({result:{image: base64}})
  // 두 가지 응답 형태가 있을 수 있어 모두 처리한다.
  if (contentType.includes("application/json")) {
    const data = await res.json();
    const base64 = data?.result?.image;
    if (!base64) {
      throw new Error("이미지 생성 결과를 찾을 수 없습니다.");
    }
    return Buffer.from(base64, "base64");
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 흰 배경 판정 기준. HIGH 이상은 완전 투명, LOW 이하는 완전 불투명, 그 사이는 부드럽게 보간해서
// 가장자리가 계단현상 없이 자연스럽게 잘리도록 한다.
const WHITE_HIGH = 250;
const WHITE_LOW = 225;

/**
 * "simple white background"로 생성된 이미지의 흰 배경을 투명하게 만든다.
 * 별도 배경 제거 API 없이, 흰색에 가까운 픽셀일수록 알파를 낮추는 방식으로 처리한다.
 */
async function removeWhiteBackground(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const whiteness = Math.min(r, g, b);

    let alphaScale: number;
    if (whiteness >= WHITE_HIGH) {
      alphaScale = 0;
    } else if (whiteness <= WHITE_LOW) {
      alphaScale = 1;
    } else {
      alphaScale = (WHITE_HIGH - whiteness) / (WHITE_HIGH - WHITE_LOW);
    }

    data[i + 3] = Math.round(data[i + 3] * alphaScale);
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

export async function POST(request: Request) {
  try {
    const { stepText, keyIngredient } = (await request.json()) as {
      stepText?: string;
      keyIngredient?: string;
    };
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
          prompt: buildPrompt(keyIngredient, stepText),
          steps: STEPS,
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

    const rawBuffer = await fetchCloudflareImageBuffer(res);
    const transparentBuffer = await removeWhiteBackground(rawBuffer);

    return NextResponse.json({ imageUrl: `data:image/png;base64,${transparentBuffer.toString("base64")}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
