import type { CSSProperties, ReactNode } from "react";

interface CardHtmlProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * SVG 안에서 텍스트 줄바꿈/그리드 레이아웃이 필요한 부분을 foreignObject로 감싼다.
 * 카드는 항상 고정 크기(CARD_WIDTH x CARD_HEIGHT)를 유지해야 하므로, 콘텐츠가 넘치더라도
 * 카드 밖으로 스크롤/오버플로우되지 않도록 overflow: hidden을 기본값으로 강제한다.
 */
export function CardHtml({ x, y, width, height, style, children }: CardHtmlProps) {
  return (
    <foreignObject x={x} y={y} width={width} height={height} style={{ overflow: "hidden" }}>
      <div
        {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<string, string>)}
        style={{ width: "100%", height: "100%", boxSizing: "border-box", overflow: "hidden", ...style }}
      >
        {children}
      </div>
    </foreignObject>
  );
}
