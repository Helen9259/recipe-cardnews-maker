import type { ReactNode } from "react";

/**
 * 데스크톱 전용 도구. 최소 너비(1024px) 미만에서는 안내 문구만 보여주고
 * 실제 화면은 렌더링하지 않는다. 순수 CSS 미디어쿼리 기반이라 하이드레이션
 * 전후 깜빡임이나 JS 의존성이 없다.
 */
export function DesktopOnlyGate({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center min-[1024px]:hidden">
        <p className="text-base font-semibold text-neutral-800">데스크톱 화면에서 이용해주세요</p>
        <p className="text-sm text-neutral-500">
          레시피 카드뉴스 메이커는 데스크톱 전용 도구예요. 화면 너비 1024px 이상의 PC/노트북 브라우저로
          다시 열어주세요.
        </p>
      </div>
      <div className="hidden min-[1024px]:block">{children}</div>
    </>
  );
}
