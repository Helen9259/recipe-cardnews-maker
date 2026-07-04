"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppSessionState, CardNewsProject, Recipe } from "@/types/recipe";

const STORAGE_KEY = "recipe-cardnews-session";

const DEFAULT_STATE: AppSessionState = {
  currentStep: 1,
  inputUrl: "",
  selectedRecommendation: null,
  project: null,
};

interface AppSessionContextValue {
  state: AppSessionState;
  /** sessionStorage 복원이 끝났는지 여부. 복원 전에는 기본값이 잠깐 보일 수 있어 화면에서 참고 */
  hydrated: boolean;
  setCurrentStep: (step: AppSessionState["currentStep"]) => void;
  setInputUrl: (url: string) => void;
  setSelectedRecommendation: (recipe: Recipe | null) => void;
  setProject: (project: CardNewsProject | null) => void;
  updateProject: (updater: (prev: CardNewsProject) => CardNewsProject) => void;
  resetSession: () => void;
}

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppSessionState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // 새로고침/뒤로가기 시 sessionStorage에서 복원 (탭 종료 시엔 자연 소멸)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      }
    } catch {
      // 손상된 값이면 기본값 유지
    }
    setHydrated(true);
  }, []);

  // 상태가 바뀔 때마다 sessionStorage에 동기화
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장 용량 초과 등은 무시 (세션 유지 실패해도 앱은 계속 동작)
    }
  }, [state, hydrated]);

  const setCurrentStep = useCallback((currentStep: AppSessionState["currentStep"]) => {
    setState((s) => ({ ...s, currentStep }));
  }, []);

  const setInputUrl = useCallback((inputUrl: string) => {
    setState((s) => ({ ...s, inputUrl }));
  }, []);

  const setSelectedRecommendation = useCallback((selectedRecommendation: Recipe | null) => {
    setState((s) => ({ ...s, selectedRecommendation }));
  }, []);

  const setProject = useCallback((project: CardNewsProject | null) => {
    setState((s) => ({ ...s, project }));
  }, []);

  const updateProject = useCallback((updater: (prev: CardNewsProject) => CardNewsProject) => {
    setState((s) => (s.project ? { ...s, project: updater(s.project) } : s));
  }, []);

  const resetSession = useCallback(() => {
    setState(DEFAULT_STATE);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      state,
      hydrated,
      setCurrentStep,
      setInputUrl,
      setSelectedRecommendation,
      setProject,
      updateProject,
      resetSession,
    }),
    [state, hydrated, setCurrentStep, setInputUrl, setSelectedRecommendation, setProject, updateProject, resetSession]
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const ctx = useContext(AppSessionContext);
  if (!ctx) {
    throw new Error("useAppSession은 AppSessionProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
