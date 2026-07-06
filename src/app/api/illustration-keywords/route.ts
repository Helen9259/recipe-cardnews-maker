import { NextResponse } from "next/server";
import { extractIllustrationKeywords } from "@/lib/server/gemini";

// Gemini 요청 큐(최소 13초 간격) + 429 재시도 때문에 오래 걸릴 수 있다.
export const maxDuration = 60;

/**
 * 레시피 전체(재료 목록 + 전체 조리 단계)를 한 번에 받아서, 각 단계 삽화의 핵심
 * 오브젝트/재료를 영어 키워드로 뽑아 반환한다. 단계 개수와 상관없이 Gemini 호출은 1회.
 */
export async function POST(request: Request) {
  try {
    const { ingredients, steps } = (await request.json()) as {
      ingredients?: string[];
      steps?: string[];
    };

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "steps가 필요합니다." }, { status: 400 });
    }

    const keywords = await extractIllustrationKeywords(ingredients ?? [], steps);
    return NextResponse.json({ keywords });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
