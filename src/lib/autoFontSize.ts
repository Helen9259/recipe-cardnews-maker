interface AutoFontSizeOptions {
  /** 텍스트가 아무리 길어져도 이보다 작아지지 않는다 */
  min: number;
  /** 텍스트가 idealChars 이하로 짧으면 이 크기를 그대로 쓴다 */
  max: number;
  /** 이 글자수까지는 max 크기를 유지하고, 넘어가면 비례해서 줄인다 */
  idealChars: number;
}

/**
 * 텍스트 길이에 따라 폰트 크기를 min~max 범위 안에서 자동 조절한다.
 * 카드 한 장에 내용이 항상 적절한 밀도로 들어가야 하므로, 문구가 짧으면 크게,
 * 길면 작게 보여준다.
 */
export function autoFontSize(text: string, { min, max, idealChars }: AutoFontSizeOptions): number {
  const length = Math.max(1, text.trim().length);
  if (length <= idealChars) return max;

  const size = Math.round(max * (idealChars / length));
  return Math.max(min, Math.min(max, size));
}

interface FitMultilineOptions {
  maxFontSize: number;
  minFontSize: number;
  availableWidth: number;
  availableHeight: number;
  /** 줄 높이 배수 (예: 1.4) */
  lineHeightRatio: number;
  /** 항목 사이 간격(px) */
  gapPx: number;
  /** 폰트 크기 대비 평균 글자 폭 비율의 대략치(한글 기준) */
  charWidthRatio: number;
}

/**
 * 여러 항목(순서 설명 등)의 텍스트 전체가 정해진 박스 안에 들어가도록, 모든 항목에
 * 공통으로 적용할 폰트 크기 하나를 계산한다. 항목 하나하나의 길이가 아니라 전체 콘텐츠
 * 양을 기준으로 하므로, 같은 카드 안의 모든 설명 텍스트가 동일한 고정 크기를 쓰면서도
 * (요구사항) 카드 밖으로 넘치지 않게 맞출 수 있다.
 */
export function fitMultilineFontSize(texts: string[], options: FitMultilineOptions): number {
  const { maxFontSize, minFontSize, availableWidth, availableHeight, lineHeightRatio, gapPx, charWidthRatio } = options;
  if (texts.length === 0) return maxFontSize;

  for (let size = maxFontSize; size >= minFontSize; size -= 2) {
    const charsPerLine = Math.max(1, Math.floor(availableWidth / (size * charWidthRatio)));
    const totalLines = texts.reduce((sum, t) => sum + Math.max(1, Math.ceil(t.length / charsPerLine)), 0);
    const neededHeight = totalLines * size * lineHeightRatio + (texts.length - 1) * gapPx;
    if (neededHeight <= availableHeight) return size;
  }
  return minFontSize;
}
