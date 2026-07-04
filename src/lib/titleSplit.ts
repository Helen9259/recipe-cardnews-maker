/**
 * 표지 카드 등에서 제목이 길면 두 줄로 나눠서 보여준다 (그렇지 않으면 단어 중간이
 * 아니라 브라우저가 임의로 줄바꿈해서 두 번째 줄 색상을 지정할 수 없다).
 * 띄어쓰기가 없거나 threshold 이하로 짧으면 한 줄 그대로 반환한다.
 */
export function splitTitleForTwoTone(title: string, threshold = 10): string[] {
  const trimmed = title.trim();
  if (trimmed.length <= threshold || !trimmed.includes(" ")) {
    return [trimmed];
  }

  const words = trimmed.split(" ");
  const mid = trimmed.length / 2;

  let bestIdx = 1;
  let bestDiff = Infinity;
  let acc = 0;
  for (let i = 0; i < words.length - 1; i++) {
    acc += words[i].length + 1;
    const diff = Math.abs(acc - mid);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i + 1;
    }
  }

  const first = words.slice(0, bestIdx).join(" ");
  const second = words.slice(bestIdx).join(" ");
  return [first, second];
}
