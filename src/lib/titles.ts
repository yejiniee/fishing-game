export interface TitleTier {
  minCatches: number;
  title: string;
}

// 잡은 마릿수(catchCount) 기준 칭호. 낮은 임계값부터 순서대로 정의한다.
export const TITLE_TIERS: readonly TitleTier[] = [
  { minCatches: 0, title: "방어잡다 번아웃 온 사장님" },
  { minCatches: 20, title: "그물 처음 쥐어본 신입 어부" },
  { minCatches: 40, title: "손맛 알아가는 중인 어부" },
  { minCatches: 70, title: "방어 좀 잡아본 베테랑 어부" },
  { minCatches: 100, title: "동네에서 소문난 손 빠른 어부" },
  { minCatches: 150, title: "전설의 그물손" },
  { minCatches: 200, title: "방어잡기의 신" },
];

export function titleForCatches(catchCount: number): string {
  let title = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) {
    if (catchCount >= tier.minCatches) title = tier.title;
  }
  return title;
}

// 다음 칭호까지 남은 마릿수. 이미 최고 칭호면 null.
export function nextTitleGap(
  catchCount: number,
): { title: string; remaining: number } | null {
  const next = TITLE_TIERS.find((tier) => catchCount < tier.minCatches);
  if (!next) return null;
  return { title: next.title, remaining: next.minCatches - catchCount };
}
