export interface TitleTier {
  minCatches: number;
  title: string;
}

// 잡은 마릿수(catchCount) 기준 칭호. 낮은 임계값부터 순서대로 정의한다.
export const TITLE_TIERS: readonly TitleTier[] = [
  { minCatches: 0, title: "방어잡다 번아웃 온 사장님" },
  { minCatches: 60, title: "동네 횟집 사장님" },
  { minCatches: 170, title: "오마카세 사장님" },
  { minCatches: 220, title: "방어잡기의 신" },
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
