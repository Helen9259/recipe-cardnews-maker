"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { CardRenderer } from "@/components/cards/CardRenderer";
import { useAppSession } from "@/context/AppSessionContext";
import { useRequireProject } from "@/lib/useRequireProject";
import { buildBaseCards } from "@/lib/cardEngine";
import { MAIN_COLOR_HEX, MAIN_COLOR_ORDER } from "@/lib/cardColors";
import { FONT_OPTION_META, FONT_OPTION_ORDER } from "@/lib/fontOptions";
import { CardStyle, ColorMode, FontOption, MainColor } from "@/types/recipe";

export default function StylePage() {
  const router = useRouter();
  const { state, updateProject, setCurrentStep } = useAppSession();
  const project = useRequireProject();

  const [mode, setMode] = useState<ColorMode>(project?.style.mode ?? "light");
  const [mainColor, setMainColor] = useState<MainColor>(project?.style.mainColor ?? "butter");
  const [font, setFont] = useState<FontOption>(project?.style.font ?? "pretendard");
  const [instaAccountName, setInstaAccountName] = useState(project?.instaAccountName ?? "");
  const [promoText, setPromoText] = useState(project?.promoText ?? "");

  if (!project) return null;

  const previewStyle: CardStyle = { mode, mainColor, font };
  const previewCard = buildBaseCards({
    ...project,
    style: previewStyle,
    instaAccountName,
    promoText,
  })[0];

  function handleNext() {
    const nextProject = {
      ...project!,
      style: previewStyle,
      instaAccountName,
      promoText,
    };
    const cards = buildBaseCards(nextProject);
    updateProject(() => ({ ...nextProject, cards }));
    setCurrentStep(4);
    router.push("/cards");
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="grid grid-cols-[1fr_420px] gap-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-lg font-semibold text-neutral-800">스타일 선택</h1>
            <p className="mt-1 text-sm text-neutral-500">카드뉴스에 적용할 모드/컬러/폰트를 골라주세요.</p>
          </div>

          <section className="flex flex-col gap-3">
            <label className="text-sm font-medium text-neutral-800">모드</label>
            <Toggle checked={mode === "dark"} onChange={(dark) => setMode(dark ? "dark" : "light")} labelOff="화이트" labelOn="다크" />
          </section>

          <section className="flex flex-col gap-3">
            <label className="text-sm font-medium text-neutral-800">메인 컬러</label>
            <div className="flex flex-wrap gap-3">
              {MAIN_COLOR_ORDER.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setMainColor(color)}
                  title={MAIN_COLOR_HEX[color].label}
                  className={[
                    "h-10 w-10 rounded-full border-2 transition-transform",
                    mainColor === color ? "scale-110 border-neutral-800" : "border-transparent",
                  ].join(" ")}
                  style={{ backgroundColor: MAIN_COLOR_HEX[color][mode] }}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <label className="text-sm font-medium text-neutral-800">폰트</label>
            <div className="flex flex-col gap-2">
              {FONT_OPTION_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFont(option)}
                  className={[
                    "rounded-lg border px-4 py-3 text-left text-base transition-colors",
                    FONT_OPTION_META[option].className,
                    font === option ? "border-neutral-800 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400",
                  ].join(" ")}
                >
                  {FONT_OPTION_META[option].label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-800">인스타 계정명</label>
              <input
                value={instaAccountName}
                onChange={(e) => setInstaAccountName(e.target.value)}
                placeholder="예: recipe.card"
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-800"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-800">홍보문구</label>
              <input
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                placeholder="예: 팔로우하고 매일 레시피 받아보세요"
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-800"
              />
            </div>
          </section>

          <Button className="self-end px-8 py-3 text-base" onClick={handleNext}>
            다음: 카드 생성
          </Button>
        </div>

        <div className="sticky top-6 self-start rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="mb-3 text-xs font-medium text-neutral-500">실시간 미리보기 (표지 카드)</p>
          <div className="mx-auto max-w-[300px] overflow-hidden rounded-lg shadow-sm">
            <CardRenderer card={previewCard} style={previewStyle} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
