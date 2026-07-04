"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { AiLoadingIndicator } from "@/components/layout/AiLoadingIndicator";
import { Button } from "@/components/ui/Button";
import { CardRenderer } from "@/components/cards/CardRenderer";
import { useAppSession } from "@/context/AppSessionContext";
import { useRequireProject } from "@/lib/useRequireProject";
import { buildBaseCards, generateStepIllustrations, updateCardLine } from "@/lib/cardEngine";
import { getCardLabel } from "@/lib/cardLabels";
import { LINE_MAX_LENGTH } from "@/lib/cardLineLimits";

export default function CardsEditPage() {
  const router = useRouter();
  const { state, updateProject, setCurrentStep } = useAppSession();
  const project = useRequireProject();
  const [generating, setGenerating] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const generationStarted = useRef(false);

  useEffect(() => {
    if (!project || generationStarted.current) return;
    generationStarted.current = true;

    async function ensureCards() {
      const base = project!.cards && project!.cards.length > 0 ? project!.cards : buildBaseCards(project!);
      const needsIllustrations = base.some((c) => c.kind === "steps" && !c.imageUrl);

      if (needsIllustrations) {
        setGenerating(true);
        updateProject((prev) => ({ ...prev, cards: base }));
        const withIllustrations = await generateStepIllustrations(base);
        updateProject((prev) => ({ ...prev, cards: withIllustrations }));
        setGenerating(false);
      } else if (!project!.cards) {
        updateProject((prev) => ({ ...prev, cards: base }));
      }
    }
    ensureCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  useEffect(() => {
    if (project?.cards && project.cards.length > 0 && !selectedCardId) {
      setSelectedCardId(project.cards[0].id);
    }
  }, [project?.cards, selectedCardId]);

  if (!project) return null;

  const cards = project.cards ?? [];
  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? cards[0];

  function handleLineChange(lineId: string, patch: { text?: string; color?: string }) {
    if (!selectedCard) return;
    updateProject((prev) => ({
      ...prev,
      cards: updateCardLine(prev.cards ?? [], selectedCard.id, lineId, patch),
    }));
  }

  function handleNext() {
    setCurrentStep(5);
    router.push("/export");
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-800">카드뉴스 편집</h1>
          <p className="mt-1 text-sm text-neutral-500">카드를 선택해서 텍스트와 색상을 수정해주세요.</p>
        </div>
        <Button onClick={handleNext} disabled={generating || cards.length === 0}>
          다음: 내보내기
        </Button>
      </div>

      {generating ? (
        <div className="flex justify-center">
          <AiLoadingIndicator label="카드별 삽화를 그리고 있어요" estimatedSeconds={15 * Math.max(1, cards.filter((c) => c.kind === "steps").length)} />
        </div>
      ) : (
        <div className="grid grid-cols-[360px_1fr] gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    card.id === selectedCard?.id
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                  ].join(" ")}
                >
                  {getCardLabel(cards, card)}
                </button>
              ))}
            </div>

            {selectedCard && (
              <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4">
                {selectedCard.lines.map((l) => {
                  const max = LINE_MAX_LENGTH[l.role];
                  return (
                    <div key={l.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500">{l.role}</span>
                        <span className="text-xs text-neutral-500">
                          {l.text.length}/{max}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <textarea
                          value={l.text}
                          onChange={(e) => handleLineChange(l.id, { text: e.target.value })}
                          rows={l.role === "body" ? 3 : 1}
                          className="flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-800"
                        />
                        <input
                          type="color"
                          value={l.color}
                          onChange={(e) => handleLineChange(l.id, { color: e.target.value })}
                          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-200"
                          title="줄 색상"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={[
                  "overflow-hidden rounded-lg border-2 text-left transition-colors",
                  card.id === selectedCard?.id ? "border-neutral-800" : "border-transparent hover:border-neutral-300",
                ].join(" ")}
              >
                <CardRenderer card={card} style={project.style} />
              </button>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
