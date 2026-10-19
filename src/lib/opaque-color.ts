// A computed color carries its alpha in one of two shapes: the legacy
// `rgba(r, g, b, a)`, or `/ a)` in every modern function. Tailwind's
// `bg-x/85` is a color-mix, which Chrome computes to `oklab(l a b / 0.85)`.
// No alpha in the string means the color is opaque.
export function isOpaque(color: string): boolean {
  const alpha = /(?:^rgba\(.*,|\/)\s*([\d.]+)\)$/.exec(color)?.[1];
  return Boolean(color) && color !== 'transparent' && (alpha === undefined || Number(alpha) >= 1);
}
