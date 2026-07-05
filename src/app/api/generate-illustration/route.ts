import { NextResponse } from "next/server";
import { MAIN_COLOR_PROMPT_LABEL } from "@/lib/cardColors";
import { MainColor } from "@/types/recipe";

const CF_MODEL = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
// 4:3 가로형 (spec 고정 비율)
const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 768;

// 조리 "동작"이 아니라 그 단계의 핵심 재료 자체를 단독 아이콘처럼 그린다.
// 도구/손을 배제하고, 손그림이 아닌 깔끔하고 균일한 두께의 아이콘 라인으로 표현한다.
const STYLE_SUFFIX =
  "minimalist single-line illustration, clean uniform thin black line, no shading, no background, " +
  "isolated object, simple flat icon style";

const NEGATIVE_PROMPT =
  "photorealistic, 3D render, complex shading, gradient, colored background, watermark, text, " +
  "signature, blurry, low quality, multiple panels, cooking utensils, pan, frying pan, knife, " +
  "cutting board, hands, human hand, fingers";

/**
 * 재료 자체를 정물처럼 단독으로 그리는 프롬프트. keyIngredient가 있으면 그 재료명을 주인공으로 쓰고,
 * 매칭되는 재료를 못 찾은 단계(예: "약한 불로 5분 끓이기")는 stepText에서 핵심 재료를 유추하게 한다.
 */
function buildPrompt(keyIngredient: string | undefined, stepText: string, colorLabel: string): string {
  const subject = keyIngredient || `the single key ingredient involved in "${stepText}"`;
  return `${subject} icon, ${STYLE_SUFFIX}, small accent of ${colorLabel} on one detail.`;
}

export async function POST(request: Request) {
  try {
    const { stepText, keyIngredient, mainColor } = (await request.json()) as {
      stepText?: string;
      keyIngredient?: string;
      mainColor?: MainColor;
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

    const colorLabel = MAIN_COLOR_PROMPT_LABEL[mainColor || "butter"];

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: buildPrompt(keyIngredient, stepText, colorLabel),
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
