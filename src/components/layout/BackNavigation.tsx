"use client";

import { useRouter, usePathname } from "next/navigation";
import { getPrevRoute } from "@/lib/navigation";
import { useAppSession } from "@/context/AppSessionContext";

export function BackNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useAppSession();

  const prevRoute = getPrevRoute(pathname, state.selectedRecommendation !== null);
  if (!prevRoute) return <div className="h-9" aria-hidden />;

  return (
    <button
      type="button"
      onClick={() => router.push(prevRoute)}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
    >
      <span aria-hidden>←</span>
      이전 단계로
    </button>
  );
}
