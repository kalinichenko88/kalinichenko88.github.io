// A computed color carries its alpha in one of two shapes: the legacy
// `rgba(r, g, b, a)`, or `/ a)` in every modern function. Tailwind's
// `bg-x/85` is a color-mix, which Chrome computes to `oklab(l a b / 0.85)`.
// The serialized color omits an alpha of 1, so any alpha means translucent.
export function isOpaque(color: string): boolean {
  return !/(?:^rgba\(.*,|\/)\s*[\d.]+\)$/.test(color);
}

// An opaque fill already covers the glow, so text on top of one cannot be
// tinted and there is nothing to suppress. Without this, a card's full-bleed
// overlay link darkens the glow across the whole card and the gutters around
// it. Anything translucent (a /85 section) still lets the field through.
// The walk starts above the text element: its own fill (inline code, a tag, a
// button) sits inside a text flow, and the glow around it still lies under the
// words. A card's fill is on an ancestor of its text, so the card still counts.
export function onOpaqueFill(el: Element | null): boolean {
  for (let node = el?.parentElement; node && node !== document.body; node = node.parentElement) {
    if (isOpaque(getComputedStyle(node).backgroundColor)) return true;
  }
  return false;
}
