"use client";

import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { useAppSession } from "@/context/AppSessionContext";
import { useRequireProject } from "@/lib/useRequireProject";
import { RecipeStep } from "@/types/recipe";

export default function EditInfoPage() {
  const router = useRouter();
  const { state, updateProject, setCurrentStep } = useAppSession();
  const project = useRequireProject();

  if (!project) return null;

  const { recipe } = project;

  function patchRecipe(patch: Partial<typeof recipe>) {
    updateProject((prev) => ({ ...prev, recipe: { ...prev.recipe, ...patch } }));
  }

  function updateIngredient(idx: number, value: string) {
    const next = [...recipe.ingredients];
    next[idx] = value;
    patchRecipe({ ingredients: next });
  }

  function removeIngredient(idx: number) {
    patchRecipe({ ingredients: recipe.ingredients.filter((_, i) => i !== idx) });
  }

  function addIngredient() {
    patchRecipe({ ingredients: [...recipe.ingredients, ""] });
  }

  function updateStep(idx: number, patch: Partial<RecipeStep>) {
    const next = [...recipe.steps];
    next[idx] = { ...next[idx], ...patch };
    patchRecipe({ steps: next });
  }

  function removeStep(idx: number) {
    patchRecipe({ steps: recipe.steps.filter((_, i) => i !== idx) });
  }

  function addStep() {
    if (recipe.steps.length >= 15) return;
    patchRecipe({ steps: [...recipe.steps, { id: uuid(), text: "" }] });
  }

  function handleNext() {
    setCurrentStep(3);
    router.push("/style");
  }

  return (
    <PageShell step={state.currentStep}>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-16">
        <div>
          <h1 className="text-lg font-semibold text-neutral-800">정보 확인 및 수정</h1>
          <p className="mt-1 text-sm text-neutral-500">
            AI가 추출한 레시피 내용이에요. 잘못된 부분이 있다면 직접 수정해주세요.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <label className="text-sm font-medium text-neutral-800">요리 이름</label>
          <input
            value={recipe.title}
            onChange={(e) => patchRecipe({ title: e.target.value })}
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-800"
          />
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-800">인분 수</label>
            <input
              value={recipe.servings}
              onChange={(e) => patchRecipe({ servings: e.target.value })}
              placeholder="예: 2인분"
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-800"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-800">출처 (채널명/블로그명)</label>
            <input
              value={recipe.sourceName}
              onChange={(e) => patchRecipe({ sourceName: e.target.value })}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-800"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-800">재료 ({recipe.ingredients.length})</label>
            <Button variant="ghost" onClick={addIngredient}>
              + 재료 추가
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {recipe.ingredients.map((ingredient, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={ingredient}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                  placeholder="예: 대파 1대"
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-neutral-800"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-800">조리 순서 ({recipe.steps.length}/15)</label>
            <Button variant="ghost" onClick={addStep} disabled={recipe.steps.length >= 15}>
              + 단계 추가
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {recipe.steps.map((step, idx) => (
              <div key={step.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">STEP {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  >
                    삭제
                  </button>
                </div>
                <textarea
                  value={step.text}
                  onChange={(e) => updateStep(idx, { text: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-800"
                />
                <input
                  value={step.tip || ""}
                  onChange={(e) => updateStep(idx, { tip: e.target.value || undefined })}
                  placeholder="팁 (선택, 있으면 카드 하단에 작게 표시돼요)"
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-800"
                />
              </div>
            ))}
          </div>
        </section>

        <Button className="self-end px-8 py-3 text-base" onClick={handleNext}>
          다음: 스타일 선택
        </Button>
      </div>
    </PageShell>
  );
}
