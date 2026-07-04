"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { AiLoadingIndicator } from "@/components/layout/AiLoadingIndicator";
import { Button } from "@/components/ui/Button";
import { useAppSession } from "@/context/AppSessionContext";
import { Recipe, CardNewsProject } from "@/types/recipe";

function buildDefaultProject(recipe: Recipe): CardNewsProject {
  return {
    recipe,
    style: { mode: "light", mainColor: "butter", font: "bmcucuric" },
    instaAccountName: "",
    promoText: "",
  };
}

export default function HomePage() {
  const router = useRouter();
  const { state, setInputUrl, setProject, setSelectedRecommendation, setCurrentStep } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function handleExtract() {
    if (!state.inputUrl.trim()) {
      setError("유튜브 또는 블로그 URL을 입력해주세요.");
      return;
    }
    // setLoading은 비동기 렌더라 같은 틱에 두 번 클릭되면 통과될 수 있어 ref로 한 번 더 막는다
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/detect-and-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.inputUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "레시피 정보를 가져오지 못했습니다.");
      }
      setSelectedRecommendation(null);
      setProject(buildDefaultProject(data as Recipe));
      setCurrentStep(2);
      router.push("/edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-10 pt-16 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">레시피 카드뉴스 메이커</h1>
          <p className="mt-2 text-sm text-neutral-500">
            유튜브 영상이나 레시피 블로그 URL을 넣으면 인스타그램용 카드뉴스를 만들어드려요.
          </p>
        </div>

        {loading ? (
          <AiLoadingIndicator label="레시피 정보를 분석하고 있어요" estimatedSeconds={25} />
        ) : (
          <>
            <div className="w-full">
              <Button
                variant="secondary"
                className="w-full py-3 text-base"
                onClick={() => router.push("/recommend")}
              >
                AI 추천 레시피 확인하기
              </Button>
            </div>

            <div className="flex w-full items-center gap-3 text-xs text-neutral-500">
              <span className="h-px flex-1 bg-neutral-100" />
              또는 직접 URL 입력
              <span className="h-px flex-1 bg-neutral-100" />
            </div>

            <div className="flex w-full flex-col gap-3">
              <input
                type="url"
                value={state.inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                placeholder="유튜브 또는 블로그 URL을 붙여넣으세요"
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-800 outline-none focus:border-neutral-800"
              />
              {error && <p className="text-left text-xs text-red-500">{error}</p>}
              <Button className="w-full py-3 text-base" onClick={handleExtract}>
                레시피 불러오기
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
