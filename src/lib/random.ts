export function pickRandom<T>(items: readonly T[], rng: () => number = Math.random): T {
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index];
}
