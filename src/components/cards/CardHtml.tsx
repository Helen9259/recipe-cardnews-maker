import type { CSSProperties, ReactNode } from "react";

interface CardHtmlProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: CSSProperties;
  children: ReactNode;
}

/** SVG 안에서 텍스트 줄바꿈/그리드 레이아웃이 필요한 부분을 foreignObject로 감싼다 */
export function CardHtml({ x, y, width, height, style, children }: CardHtmlProps) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<string, string>)}
        style={{ width: "100%", height: "100%", boxSizing: "border-box", ...style }}
      >
        {children}
      </div>
    </foreignObject>
  );
}
