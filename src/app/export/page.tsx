"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CardRenderer } from "@/components/cards/CardRenderer";
import { useAppSession } from "@/context/AppSessionContext";
import { useRequireProject } from "@/lib/useRequireProject";
import { toggleCardSelected } from "@/lib/cardEngine";
import { getCardLabel } from "@/lib/cardLabels";
import { FONT_FAMILY_NAME } from "@/lib/fontOptions";
import { buildFontEmbedCSS } from "@/lib/fontEmbedCss";

type ExportFormat = "png" | "svg";

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ExportPage() {
  const { state, updateProject } = useAppSession();
  const project = useRequireProject();
  const [format, setFormat] = useState<ExportFormat>("png");
  const [downloading, setDownloading] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fontEmbedCSSRef = useRef<string | null>(null);

  if (!project) return null;

  const cards = project.cards ?? [];

  /** 프로젝트에서 실제로 쓰는 폰트만 base64로 내장한 CSS를 만든다 (다운로드 세션 동안 한 번만 계산해 재사용) */
  async function getFontEmbedCSS(): Promise<string> {
    if (fontEmbedCSSRef.current !== null) return fontEmbedCSSRef.current;
    const familyNames = Array.from(
      new Set([FONT_FAMILY_NAME[project!.style.mainFont], FONT_FAMILY_NAME[project!.style.tipFont]])
    );
    const css = await buildFontEmbedCSS(familyNames);
    fontEmbedCSSRef.current = css;
    return css;
  }

  function handleToggle(cardId: string) {
    updateProject((prev) => ({ ...prev, cards: toggleCardSelected(prev.cards ?? [], cardId) }));
  }

  function handleSelectAll(selected: boolean) {
    updateProject((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).map((c) => ({ ...c, selected })),
    }));
  }

  async function downloadCard(cardId: string, index: number, kind: string) {
    const node = cardRefs.current[cardId];
    if (!node) return;
    const filename = `${String(index + 1).padStart(2, "0")}-${kind}.${format}`;

    if (format === "png") {
      const fontEmbedCSS = await getFontEmbedCSS();
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, fontEmbedCSS });
      triggerDownload(dataUrl, filename);
      return;
    }

    const svgEl = node.querySelector("svg");
    if (!svgEl) return;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleDownloadAll() {
    setDownloading(true);
    const selectedCards = cards
      .map((card, idx) => ({ card, idx }))
      .filter(({ card }) => card.selected);

    for (const { card, idx } of selectedCards) {
      await downloadCard(card.id, idx, card.kind);
      await wait(250);
    }
    setDownloading(false);
  }

  const selectedCount = cards.filter((c) => c.selected).length;

  return (
    <PageShell step={state.currentStep}>
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-800">내보내기</h1>
          <p className="mt-1 text-sm text-neutral-500">
            인스타그램에 올릴 카드를 선택하고 다운로드하세요. ({selectedCount}/{cards.length}개 선택됨)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-neutral-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setFormat("png")}
              className={["rounded-md px-4 py-1.5", format === "png" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500"].join(" ")}
            >
              PNG
            </button>
            <button
              type="button"
              onClick={() => setFormat("svg")}
              className={["rounded-md px-4 py-1.5", format === "svg" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500"].join(" ")}
            >
              SVG
            </button>
          </div>
          <Button variant="secondary" onClick={() => handleSelectAll(true)}>
            전체선택
          </Button>
          <Button variant="secondary" onClick={() => handleSelectAll(false)}>
            전체해제
          </Button>
          <Button onClick={handleDownloadAll} disabled={downloading || selectedCount === 0}>
            {downloading ? "다운로드 중..." : `선택 다운로드 (${selectedCount})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <div key={card.id} className="flex flex-col gap-2">
            <div
              className="relative overflow-hidden rounded-lg border border-neutral-200 transition-opacity"
              style={{ opacity: card.selected ? 1 : 0.35 }}
            >
              <div ref={(el) => { cardRefs.current[card.id] = el; }}>
                <CardRenderer card={card} style={project.style} />
              </div>
              <div className="absolute left-2 top-2 rounded-md bg-white/90 p-1">
                <Checkbox checked={card.selected} onChange={() => handleToggle(card.id)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{getCardLabel(cards, card)}</span>
              <button
                type="button"
                onClick={() => downloadCard(card.id, idx, card.kind)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                개별 다운로드
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
