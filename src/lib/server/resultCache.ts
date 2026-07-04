/**
 * 아주 단순한 in-memory 캐시. 같은 키로 들어온 요청이 아직 처리 중이면 새로 계산하지 않고
 * 진행 중인 Promise를 같이 기다리게 해서(더블클릭/중복 제출 방어), 이미 끝난 요청이면
 * 그 결과를 재사용해서(뒤로가기 후 같은 URL/영상 재선택 등) Gemini 호출 자체를 건너뛴다.
 * 같은 Node 프로세스 안에서만 유효한 상태라 서버리스 인스턴스가 새로 뜨면 초기화된다.
 */
const MAX_ENTRIES = 50;
const cache = new Map<string, Promise<unknown>>();

export function getOrCompute<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing as Promise<T>;

  const promise = compute().catch((err) => {
    // 실패한 요청은 캐시에 남겨두지 않아야 다음에 다시 시도할 수 있다
    cache.delete(key);
    throw err;
  });

  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, promise);

  return promise as Promise<T>;
}
