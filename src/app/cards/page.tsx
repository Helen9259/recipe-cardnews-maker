"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { CardRenderer } from "@/components/cards/CardRenderer";
import { useAppSession } from "@/context/AppSessionContext";
import { useRequireProject } from "@/lib/useRequireProject";
import {
  buildBaseCards,
  updateCardLine,
  setCoverImageMode,
  setCardPhoto,
  removeCardPhoto,
  setCardPhotoLayout,
} from "@/lib/cardEngine";
import { getCardLabel } from "@/lib/cardLabels";
import { LINE_MAX_LENGTH } from "@/lib/cardLineLimits";
import { CoverImageMode, PhotoLayout } from "@/types/card";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CardsEditPage() {
  const router = useRouter();
  const { state, updateProject, setCurrentStep } = useAppSession();
  const project = useRequireProject();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!project) return;
    if (!project.cards || project.cards.length === 0) {
      updateProject((prev) => ({ ...prev, cards: buildBaseCards(prev) }));
    }
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

  function handleCoverModeSelect(mode: CoverImageMode) {
    if (mode === "upload") {
      coverFileInputRef.current?.click();
      return;
    }
    updateProject((prev) => ({
      ...prev,
      cards: setCoverImageMode(prev.cards ?? [], mode, prev.recipe.thumbnailUrl),
    }));
  }

  async function handleCoverUpload(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    updateProject((prev) => ({
      ...prev,
      cards: setCoverImageMode(prev.cards ?? [], "upload", prev.recipe.thumbnailUrl, dataUrl),
    }));
  }

  async function handlePhotoUpload(cardId: string, file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    updateProject((prev) => ({
      ...prev,
      cards: setCardPhoto(prev.cards ?? [], cardId, dataUrl),
    }));
  }

  function handlePhotoRemove(cardId: string) {
    updateProject((prev) => ({
      ...prev,
      cards: removeCardPhoto(prev.cards ?? [], cardId),
    }));
  }

  function handlePhotoLayoutChange(cardId: string, layout: PhotoLayout) {
    updateProject((prev) => ({
      ...prev,
      cards: setCardPhotoLayout(prev.cards ?? [], cardId, layout),
    }));
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-800">카드뉴스 편집</h1>
          <p className="mt-1 text-sm text-neutral-500">카드를 선택해서 텍스트와 사진을 수정해주세요.</p>
        </div>
        <Button onClick={handleNext} disabled={cards.length === 0}>
          다음: 내보내기
        </Button>
      </div>

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

              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
                <span className="text-xs font-medium text-neutral-500">사진</span>

                {selectedCard.kind === "cover" ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {project.recipe.sourceType === "youtube" && project.recipe.thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => handleCoverModeSelect("youtube")}
                          className={[
                            "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            selectedCard.coverImageMode === "youtube"
                              ? "border-neutral-800 bg-neutral-50"
                              : "border-neutral-200 hover:border-neutral-400",
                          ].join(" ")}
                        >
                          유튜브 썸네일
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCoverModeSelect("none")}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          selectedCard.coverImageMode === "none"
                            ? "border-neutral-800 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-400",
                        ].join(" ")}
                      >
                        이미지 없음
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCoverModeSelect("upload")}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          selectedCard.coverImageMode === "upload"
                            ? "border-neutral-800 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-400",
                        ].join(" ")}
                      >
                        내 사진 업로드
                      </button>
                    </div>
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </>
                ) : selectedCard.imageUrl ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePhotoLayoutChange(selectedCard.id, "background")}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          selectedCard.photoLayout === "background"
                            ? "border-neutral-800 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-400",
                        ].join(" ")}
                      >
                        카드 전체 배경
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePhotoLayoutChange(selectedCard.id, "top-half")}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          selectedCard.photoLayout === "top-half"
                            ? "border-neutral-800 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-400",
                        ].join(" ")}
                      >
                        상단 절반만
                      </button>
                    </div>
                    <Button variant="secondary" onClick={() => handlePhotoRemove(selectedCard.id)}>
                      사진 삭제
                    </Button>
                  </div>
                ) : (
                  <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-800 hover:border-neutral-400">
                    사진 추가
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(selectedCard.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
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
                "block w-full overflow-hidden rounded-lg border-2 text-left transition-colors",
                card.id === selectedCard?.id ? "border-neutral-800" : "border-transparent hover:border-neutral-300",
              ].join(" ")}
            >
              <CardRenderer card={card} style={project.style} />
            </button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
