"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/context/AppSessionContext";

/** project 없이 직접 진입한 경우(새 탭 등) 첫 화면으로 되돌린다 */
export function useRequireProject() {
  const router = useRouter();
  const { state, hydrated } = useAppSession();

  useEffect(() => {
    if (hydrated && !state.project) {
      router.replace("/");
    }
  }, [hydrated, state.project, router]);

  return state.project;
}
