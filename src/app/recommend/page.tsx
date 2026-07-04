"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { AiLoadingIndicator } from "@/components/layout/AiLoadingIndicator";
import { Button } from "@/components/ui/Button";
import { useAppSession } from "@/context/AppSessionContext";
import { CardNewsProject, RecommendedRecipe } from "@/types/recipe";
import { RecommendationCandidate } from "@/types/recommendation";

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
  const [candidates, setCandidates] = useState<RecommendationCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // videoId -> 이미 분석된(Gemini 호출 완료) 결과 캐시. 같은 후보를 다시 클릭해도 재호출하지 않는다.
  const [analyzed, setAnalyzed] = useState<Record<string, RecommendedRecipe>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzeRequestId = useRef(0);
  const inFlightVideoId = useRef<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedIdx(null);
    setAnalyzed({});
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/recommend-recipes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "추천 레시피를 가져오지 못했습니다.");
      setCandidates(data as RecommendationCandidate[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // 후보를 고를 때만 Gemini 분석(카테고리 분류 + 레시피 구조화)을 지연 호출한다.
  async function handleSelect(idx: number) {
    setSelectedIdx(idx);
    const candidate = candidates[idx];
    // 이미 분석된 후보거나, 같은 후보를 향한 요청이 이미 진행 중이면 다시 부르지 않는다
    if (!candidate || analyzed[candidate.videoId] || inFlightVideoId.current === candidate.videoId) return;

    const requestId = ++analyzeRequestId.current;
    inFlightVideoId.current = candidate.videoId;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/recommend-recipes/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "레시피 분석에 실패했습니다.");
      // 응답이 늦게 와서 그 사이 다른 카드를 선택했다면 이 결과는 버린다
      if (requestId !== analyzeRequestId.current) return;
      setAnalyzed((prev) => ({ ...prev, [candidate.videoId]: data as RecommendedRecipe }));
    } catch (err) {
      if (requestId !== analyzeRequestId.current) return;
      setAnalyzeError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      if (inFlightVideoId.current === candidate.videoId) inFlightVideoId.current = null;
      if (requestId === analyzeRequestId.current) setAnalyzing(false);
    }
  }

  const selectedCandidate = selectedIdx !== null ? candidates[selectedIdx] : null;
  const selectedRecipe = selectedCandidate ? analyzed[selectedCandidate.videoId] : null;

  function handleStart() {
    if (!selectedRecipe) return;
    setSelectedRecommendation(selectedRecipe);
    setProject(buildDefaultProject(selectedRecipe));
    setCurrentStep(2);
    router.push("/edit");
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-lg font-semibold text-neutral-800">AI 추천 레시피</h1>
        {!loading && (
          <Button variant="secondary" onClick={fetchCandidates}>
            다시 리서치
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center">
          <AiLoadingIndicator label="인기 영상을 검색하고 있어요" estimatedSeconds={8} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" onClick={fetchCandidates}>
            다시 시도
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[360px_1fr] gap-8">
          <ul className="flex flex-col gap-3">
            {candidates.map((candidate, idx) => (
              <li key={candidate.videoId}>
                <button
                  type="button"
                  onClick={() => handleSelect(idx)}
                  className={[
                    "flex w-full gap-3 rounded-xl border p-3 text-left transition-colors",
                    idx === selectedIdx
                      ? "border-neutral-800 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400",
                  ].join(" ")}
                >
                  {candidate.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={candidate.thumbnailUrl}
                      alt={candidate.title}
                      className="h-16 w-24 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-neutral-800">{candidate.title}</p>
                    <p className="mt-1 truncate text-xs text-neutral-500">{candidate.sourceName}</p>
                    {analyzed[candidate.videoId] && (
                      <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                        {analyzed[candidate.videoId].category}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-neutral-200 p-6">
            {!selectedCandidate ? (
              <p className="py-16 text-center text-sm text-neutral-500">
                왼쪽 목록에서 레시피를 선택하면 AI가 그때 분석을 시작해요.
              </p>
            ) : analyzing && !selectedRecipe ? (
              <div className="flex justify-center py-10">
                <AiLoadingIndicator label="선택한 레시피를 분석하고 있어요" estimatedSeconds={25} />
              </div>
            ) : analyzeError && !selectedRecipe ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-red-500">{analyzeError}</p>
                <Button variant="secondary" onClick={() => handleSelect(selectedIdx!)}>
                  다시 시도
                </Button>
              </div>
            ) : selectedRecipe ? (
              <div className="flex flex-col gap-4">
                {selectedRecipe.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedRecipe.thumbnailUrl}
                    alt={selectedRecipe.title}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800">{selectedRecipe.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {selectedRecipe.sourceName} · {selectedRecipe.servings}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-500">
                    재료 {selectedRecipe.ingredients.length}개
                  </p>
                  <p className="line-clamp-2 text-sm text-neutral-800">{selectedRecipe.ingredients.join(", ")}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-500">
                    조리 순서 {selectedRecipe.steps.length}단계
                  </p>
                </div>
                <Button className="mt-2" onClick={handleStart}>
                  이 레시피로 시작하기
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </PageShell>
  );
}
