"use client";

import { useEffect, useState } from "react";

interface AiLoadingIndicatorProps {
  label: string;
  /** 예상 소요 시간(초). 실제 응답이 오면 즉시 사라지므로 대략적인 값으로 충분 */
  estimatedSeconds?: number;
}

/**
 * AI 응답을 기다리는 동안 보여주는 로딩 상태. 진행바는 estimatedSeconds에 맞춰
 * 90%까지만 서서히 채워지고(무한 대기 대비), 응답이 오면 부모가 언마운트한다.
 */
export function AiLoadingIndicator({ label, estimatedSeconds = 20 }: AiLoadingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
    return () => clearInterval(timer);
  }, []);

  const progress = Math.min(90, (elapsed / estimatedSeconds) * 90);
  const remaining = Math.max(0, Math.ceil(estimatedSeconds - elapsed));

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 py-10 text-center">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-800 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm font-medium text-neutral-800">{label}</p>
      <p className="text-xs text-neutral-500">
        {remaining > 0 ? `약 ${remaining}초 남았어요` : "거의 다 됐어요..."}
      </p>
    </div>
  );
}
