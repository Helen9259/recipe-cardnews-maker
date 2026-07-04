import { Recipe, SourceType } from "@/types/recipe";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiPart = { text: string } | { fileData: { fileUri: string; mimeType?: string } };

const RECIPE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    servings: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          tip: { type: "string" },
        },
        required: ["text"],
      },
    },
  },
  required: ["title", "servings", "ingredients", "steps"],
};

async function callGeminiJSON(parts: GeminiPart[], schema: object): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local을 확인해주세요.");
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 호출 실패 (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini 응답에서 결과 텍스트를 찾을 수 없습니다.");
  }
  return JSON.parse(text);
}

interface RecipeSourceMeta {
  sourceType: SourceType;
  sourceUrl: string;
  sourceName: string;
  thumbnailUrl?: string;
}

function buildStructurePrompt(rawText: string): string {
  return [
    "너는 요리 레시피 정리 전문가야. 아래 텍스트에서 레시피 정보를 추출해서 JSON으로 구조화해줘.",
    "",
    "규칙:",
    "- servings는 '2인분'처럼 사람이 읽기 좋은 형태로 정리",
    "- ingredients는 재료명과 분량을 한 줄로 (예: '대파 1대')",
    "- steps는 조리 순서를 의미 단위로 묶어서 최대 15개 이내로 정리 (사소한 동작은 한 단계로 합치기)",
    "- 각 step의 text는 카드 한 장에 들어갈 만큼 간결하게, tip은 있을 때만 채우기",
    "- 텍스트에 없는 내용은 추측하지 말고 비워두기",
    "",
    "원본 텍스트:",
    "---",
    rawText.slice(0, 20000),
  ].join("\n");
}

interface RawStep {
  text?: string;
  tip?: string;
}

interface RawRecipeJson {
  title?: string;
  servings?: string;
  ingredients?: string[];
  steps?: RawStep[];
}

function toRecipe(parsed: RawRecipeJson, meta: RecipeSourceMeta): Recipe {
  return {
    title: parsed.title || "제목 없음",
    sourceType: meta.sourceType,
    sourceUrl: meta.sourceUrl,
    sourceName: meta.sourceName,
    thumbnailUrl: meta.thumbnailUrl,
    servings: parsed.servings || "",
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
    steps: Array.isArray(parsed.steps)
      ? parsed.steps.slice(0, 15).map((s, idx) => ({
          id: `step-${idx + 1}`,
          text: s.text || "",
          tip: s.tip || undefined,
        }))
      : [],
  };
}

export async function structureRecipeFromText(rawText: string, meta: RecipeSourceMeta): Promise<Recipe> {
  const parsed = (await callGeminiJSON([{ text: buildStructurePrompt(rawText) }], RECIPE_JSON_SCHEMA)) as RawRecipeJson;
  return toRecipe(parsed, meta);
}

/** 설명란/댓글이 부실한 유튜브 영상을 Gemini에게 직접 보여주고 재료/순서를 추론시킨다 */
export async function structureRecipeFromYoutubeVideo(youtubeUrl: string, meta: RecipeSourceMeta): Promise<Recipe> {
  const prompt = [
    "이 요리 영상을 보고 레시피 정보를 JSON으로 구조화해줘.",
    "",
    "규칙:",
    "- servings는 '2인분'처럼 사람이 읽기 좋은 형태로 정리",
    "- ingredients는 영상에 등장하는 재료명과 분량을 한 줄로",
    "- steps는 조리 순서를 의미 단위로 묶어서 최대 15개 이내로 정리",
    "- 각 step의 text는 카드 한 장에 들어갈 만큼 간결하게, tip은 영상 속 팁이 있을 때만 채우기",
  ].join("\n");

  const parsed = (await callGeminiJSON(
    [{ fileData: { fileUri: youtubeUrl } }, { text: prompt }],
    RECIPE_JSON_SCHEMA
  )) as RawRecipeJson;
  return toRecipe(parsed, meta);
}

const CATEGORY_SCHEMA = {
  type: "object",
  properties: { category: { type: "string" } },
  required: ["category"],
};

/** 유튜브 검색 결과 제목/설명을 보고 요리 카테고리 태그 하나를 붙인다 (예: '한식', '베이킹', '분식') */
export async function classifyRecipeCategory(title: string, description: string): Promise<string> {
  const prompt = [
    "다음 요리 영상의 제목과 설명을 보고 어울리는 카테고리 태그를 한 단어로 골라줘.",
    "예시 카테고리: 한식, 양식, 중식, 일식, 분식, 베이킹, 디저트, 안주, 다이어트, 간편식",
    "",
    `제목: ${title}`,
    `설명: ${description.slice(0, 500)}`,
  ].join("\n");

  const parsed = (await callGeminiJSON([{ text: prompt }], CATEGORY_SCHEMA)) as { category: string };
  return parsed.category || "기타";
}
