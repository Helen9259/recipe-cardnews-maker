"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { AiLoadingIndicator } from "@/components/layout/AiLoadingIndicator";
import { Button } from "@/components/ui/Button";
import { useAppSession } from "@/context/AppSessionContext";
import { CardNewsProject, RecommendedRecipe } from "@/types/recipe";

function buildDefaultProject(recipe: RecommendedRecipe): CardNewsProject {
  const { title, sourceType, sourceUrl, sourceName, thumbnailUrl, servings, ingredients, steps } = recipe;
  return {
    recipe: { title, sourceType, sourceUrl, sourceName, thumbnailUrl, servings, ingredients, steps },
    style: { mode: "light", mainColor: "butter", font: "bmcucuric" },
    instaAccountName: "",
    promoText: "",
  };
}

export default function RecommendPage() {
  const router = useRouter();
  const { state, setSelectedRecommendation, setProject, setCurrentStep } = useAppSession();
  const [recommendations, setRecommendations] = useState<RecommendedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedIdx(null);
    try {
      const res = await fetch("/api/recommend-recipes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "추천 레시피를 가져오지 못했습니다.");
      setRecommendations(data as RecommendedRecipe[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const selected = selectedIdx !== null ? recommendations[selectedIdx] : null;

  function handleStart() {
    if (!selected) return;
    setSelectedRecommendation(selected);
    setProject(buildDefaultProject(selected));
    setCurrentStep(2);
    router.push("/edit");
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-lg font-semibold text-neutral-800">AI 추천 레시피</h1>
        {!loading && (
          <Button variant="secondary" onClick={fetchRecommendations}>
            다시 리서치
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center">
          <AiLoadingIndicator label="인기 레시피를 리서치하고 있어요" estimatedSeconds={90} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" onClick={fetchRecommendations}>
            다시 시도
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[360px_1fr] gap-8">
          <ul className="flex flex-col gap-3">
            {recommendations.map((recipe, idx) => (
              <li key={recipe.sourceUrl}>
                <button
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={[
                    "flex w-full gap-3 rounded-xl border p-3 text-left transition-colors",
                    idx === selectedIdx
                      ? "border-neutral-800 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400",
                  ].join(" ")}
                >
                  {recipe.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.thumbnailUrl}
                      alt={recipe.title}
                      className="h-16 w-24 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-neutral-800">{recipe.title}</p>
                    <p className="mt-1 truncate text-xs text-neutral-500">{recipe.sourceName}</p>
                    <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                      {recipe.category}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-neutral-200 p-6">
            {selected ? (
              <div className="flex flex-col gap-4">
                {selected.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.thumbnailUrl}
                    alt={selected.title}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800">{selected.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {selected.sourceName} · {selected.servings}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-500">재료 {selected.ingredients.length}개</p>
                  <p className="line-clamp-2 text-sm text-neutral-800">{selected.ingredients.join(", ")}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-500">조리 순서 {selected.steps.length}단계</p>
                </div>
                <Button className="mt-2" onClick={handleStart}>
                  이 레시피로 시작하기
                </Button>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-neutral-500">
                왼쪽 목록에서 레시피를 선택하면 미리보기가 표시돼요.
              </p>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
