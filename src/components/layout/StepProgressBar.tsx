"use client";

import { STEP_LABELS } from "@/lib/navigation";
import { AppSessionState } from "@/types/recipe";

export function StepProgressBar({ currentStep }: { currentStep: AppSessionState["currentStep"] }) {
  return (
    <ol className="flex w-full items-center gap-2" aria-label="진행 단계">
      {STEP_LABELS.map((label, idx) => {
        const step = (idx + 1) as AppSessionState["currentStep"];
        const isDone = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isCurrent || isDone
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-100 text-neutral-500",
                ].join(" ")}
              >
                {isDone ? "✓" : step}
              </span>
              <span
                className={[
                  "whitespace-nowrap text-sm",
                  isCurrent ? "font-semibold text-neutral-800" : "text-neutral-500",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <span
                className={["h-px flex-1", isDone ? "bg-neutral-800" : "bg-neutral-100"].join(" ")}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
