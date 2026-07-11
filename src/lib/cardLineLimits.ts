import { CardLineRole } from "@/types/card";

/** 카드 한 장에 모든 내용이 들어가야 하므로 글자수 카운터의 권장 상한선 (하드 제한은 아님) */
export const LINE_MAX_LENGTH: Record<CardLineRole, number> = {
  title: 40,
  subtitle: 24,
  body: 90,
  tip: 60,
  watermark: 20,
  ingredient: 24,
  step: 100,
};
