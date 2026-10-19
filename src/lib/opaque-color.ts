// A computed color carries its alpha in one of two shapes: the legacy
// `rgba(r, g, b, a)`, or `/ a)` in every modern function. Tailwind's
// `bg-x/85` is a color-mix, which Chrome computes to `oklab(l a b / 0.85)`.
// The serialized color omits an alpha of 1, so any alpha means translucent.
export function isOpaque(color: string): boolean {
  return !/(?:^rgba\(.*,|\/)\s*[\d.]+\)$/.test(color);
}

// The elements PixelSpotlight treats as text.
export const TEXT =
  'p, h1, h2, h3, h4, h5, h6, li, a, button, code, pre, blockquote, figure, table';

// An opaque fill already covers the glow, so text on top of one cannot be
// tinted and there is nothing to suppress. Without this, a card's full-bleed
// overlay link darkens the glow across the whole card and the gutters around
// it. Anything translucent (a /85 section) still lets the field through.
// Only a fill on an element that is not text counts. A fill on text itself
// (inline code, a code block around its code, a button) sits in the text, and
// the glow around it still lies under the words. A card's fill is on its
// article, which is not text, so text on a card stays covered.
export function onOpaqueFill(el: Element | null): boolean {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (!node.matches(TEXT) && isOpaque(getComputedStyle(node).backgroundColor)) return true;
  }
  return false;
}
