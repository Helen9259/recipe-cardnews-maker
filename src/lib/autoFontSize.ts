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
