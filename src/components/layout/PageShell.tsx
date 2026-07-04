import type { ReactNode } from "react";
import { DesktopOnlyGate } from "./DesktopOnlyGate";
import { StepProgressBar } from "./StepProgressBar";
import { BackNavigation } from "./BackNavigation";
import { AppSessionState } from "@/types/recipe";

interface PageShellProps {
  step: AppSessionState["currentStep"];
  children: ReactNode;
}

export function PageShell({ step, children }: PageShellProps) {
  return (
    <DesktopOnlyGate>
      <div className="mx-auto min-h-screen w-full max-w-[1440px] px-10 py-6">
        <header className="mb-8 flex items-center gap-6">
          <BackNavigation />
          <StepProgressBar currentStep={step} />
        </header>
        <main>{children}</main>
      </div>
    </DesktopOnlyGate>
  );
}
