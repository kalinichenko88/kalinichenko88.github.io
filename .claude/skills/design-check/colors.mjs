// Colour helpers of the design-check script: read a theme's colour tokens from
// global.css, mix two colours, and measure WCAG contrast.
// tests/design-check.test.ts checks the math against known values.

// WCAG AA for small text and CTAs.
export const AA = 4.5;

// ---------- WCAG contrast ----------
function toRgb(hex) {
  const h = hex.replace('#', '').trim();
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => {
            return c + c;
          })
          .join('')
      : h;

  return [0, 2, 4].map((i) => {
    return parseInt(n.slice(i, i + 2), 16) / 255;
  });
}
function relLum(hex) {
  const [r, g, b] = toRgb(hex).map((c) => {
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => {
    return y - x;
  });

  return (l1 + 0.05) / (l2 + 0.05);
}
// `color-mix(in srgb, top weight, under)`; with `transparent` as `under` it is
// also `top` at that alpha painted over `under`.
export function mix(top, weight, under) {
  if (!top || !under) {
    return undefined;
  }
  const [a, b] = [toRgb(top), toRgb(under)];

  return (
    '#' +
    a
      .map((c, i) => {
        return Math.round((c * weight + b[i] * (1 - weight)) * 255)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}

// ---------- token parsing ----------
export function themeBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) {
    return {};
  }
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close);
  const tokens = {};
  for (const m of body.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]+)/g)) {
    tokens[m[1]] = m[2];
  }

  return tokens;
}
