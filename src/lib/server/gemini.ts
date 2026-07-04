import { Recipe, SourceType } from "@/types/recipe";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiPart = { text: string } | { fileData: { fileUri: string; mimeType?: string } };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// 요청 큐: 무료 티어 RPM 제한 때문에 Gemini 호출은 한 번에 하나씩, 최소 간격을
// 두고 순서대로 나간다. 같은 Node 프로세스 안에서만 유효한 in-memory 큐라서
// (서버리스 인스턴스가 새로 뜨면 초기화됨) 완벽한 전역 레이트리밋은 아니지만
// 개인용 도구에서 "한꺼번에 몰리는" 문제를 막기엔 충분하다.
// ---------------------------------------------------------------------------
const MIN_REQUEST_INTERVAL_MS = 13000; // 12~15초 사이 간격
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestStartedAt = 0;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = requestQueue.then(async () => {
    const wait = Math.max(0, lastRequestStartedAt + MIN_REQUEST_INTERVAL_MS - Date.now());
    if (wait > 0) await sleep(wait);
    lastRequestStartedAt = Date.now();
    return task();
  });
  // 큐 체인은 실패해도 끊기면 안 되므로 성공/실패 상관없이 다음 작업으로 이어지게 한다
  requestQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

// ---------------------------------------------------------------------------
// 429(RESOURCE_EXHAUSTED) 재시도: 에러 바디의 RetryInfo.retryDelay(예: "35s")를
// 읽어서 그만큼 기다렸다가 재시도한다. 값이 없으면 지수 백오프로 대체한다.
// ---------------------------------------------------------------------------
const MAX_RETRIES = 8;
const FALLBACK_BACKOFF_MS = 15000;
const MAX_BACKOFF_MS = 90000;

function parseRetryDelayMs(errorBodyText: string): number | null {
  try {
    const parsed = JSON.parse(errorBodyText);
    const details = parsed?.error?.details;
    if (Array.isArray(details)) {
      for (const detail of details) {
        if (typeof detail?.retryDelay === "string") {
          const match = detail.retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
          if (match) return Math.ceil(parseFloat(match[1]) * 1000);
        }
      }
    }
  } catch {
    // JSON 파싱 실패 시 아래 정규식 폴백으로
  }
  const match = errorBodyText.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
}

async function fetchGeminiWithRetry(body: object, apiKey: string): Promise<unknown> {
  let attempt = 0;
  while (true) {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) return res.json();

    const errText = await res.text();

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryMs = Math.min(
        MAX_BACKOFF_MS,
        parseRetryDelayMs(errText) ?? FALLBACK_BACKOFF_MS * 2 ** attempt
      );
      attempt++;
      console.warn(`[gemini] 429 응답, ${retryMs}ms 대기 후 재시도 (${attempt}/${MAX_RETRIES})`);
      await sleep(retryMs + 500);
      continue;
    }

    if (res.status === 429) {
      console.error(`[gemini] 429 재시도(${MAX_RETRIES}회) 모두 실패:`, errText.slice(0, 800));
      throw new Error(
        "Gemini 무료 티어 요청 한도를 초과했어요. 1~2분 정도 기다렸다가 다시 시도해주세요."
      );
    }

    throw new Error(`Gemini API 호출 실패 (${res.status}): ${errText.slice(0, 500)}`);
  }
}

async function callGeminiJSON(parts: GeminiPart[], schema: object): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local을 확인해주세요.");
  }

  return enqueue(async () => {
    const data = (await fetchGeminiWithRetry(
      {
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      },
      apiKey
    )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini 응답에서 결과 텍스트를 찾을 수 없습니다.");
    }
    return JSON.parse(text);
  });
}

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

const CATEGORIES_SCHEMA = {
  type: "object",
  properties: {
    categories: { type: "array", items: { type: "string" } },
  },
  required: ["categories"],
};

export interface VideoForClassification {
  title: string;
  description: string;
}

/**
 * 여러 영상의 카테고리를 한 번의 Gemini 호출로 한꺼번에 분류한다 (영상마다 따로 호출하지 않음).
 * 응답 categories 배열은 입력 순서와 1:1로 대응해야 한다.
 */
export async function classifyRecipeCategories(videos: VideoForClassification[]): Promise<string[]> {
  if (videos.length === 0) return [];

  const prompt = [
    "아래는 요리 영상 목록이야. 각 영상의 제목과 설명을 보고 어울리는 카테고리 태그를 한 단어로 붙여줘.",
    "예시 카테고리: 한식, 양식, 중식, 일식, 분식, 베이킹, 디저트, 안주, 다이어트, 간편식",
    `결과 categories 배열은 반드시 아래 목록과 같은 순서로 ${videos.length}개를 반환해줘.`,
    "",
    ...videos.map(
      (v, idx) => `[${idx}] 제목: ${v.title}\n설명: ${v.description.slice(0, 300)}`
    ),
  ].join("\n\n");

  const parsed = (await callGeminiJSON([{ text: prompt }], CATEGORIES_SCHEMA)) as { categories?: string[] };
  const categories = Array.isArray(parsed.categories) ? parsed.categories : [];

  return videos.map((_, idx) => categories[idx] || "기타");
}
