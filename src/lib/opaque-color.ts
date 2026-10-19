// A computed color carries its alpha in one of two shapes: the legacy
// `rgba(r, g, b, a)`, or `/ a)` in every modern function. Tailwind's
// `bg-x/85` is a color-mix, which Chrome computes to `oklab(l a b / 0.85)`.
// The serialized color omits an alpha of 1, so any alpha means translucent.
export function isOpaque(color: string): boolean {
  return !/(?:^rgba\(.*,|\/)\s*[\d.]+\)$/.test(color);
}
