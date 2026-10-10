/* eslint-disable no-console */
/* global Buffer, console, process */
// The mechanical half of the illustrate-post skill: gate, normalize, compress
// and preview the variants one run produced. SKILL.md has the workflow.
//
//   node .claude/skills/illustrate-post/prepare.mjs <run-dir>
//
// Reads variant-N.png and writes variant-N.cover.png (the cover to commit,
// trimmed to its drawing), variant-N.og.jpg (its 1200x630 social image),
// variant-N.light.png and variant-N.dark.png (flattened, for viewing) and
// sheet.png (every accepted variant on both backgrounds). Exits 1 if none
// passed.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// Even transparent margin around the drawing, as a share of its longer side.
// The cover keeps the drawing's own proportions, so a card can hug it.
export const PAD = 0.06;
// Generated PNGs carry faint alpha noise (1 to 7) almost to the canvas edge;
// above this threshold the bounding box is the drawing.
const ALPHA_THRESHOLD = 16;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const LIGHT = '#f4f2ee';
const DARK = '#1a1a1c';

export async function subjectBox(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + channels - 1] <= ALPHA_THRESHOLD) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export async function normalize(input) {
  if ((await sharp(input).stats()).isOpaque) {
    throw new Error('no transparency: the background is opaque');
  }
  const box = await subjectBox(input);
  if (!box) throw new Error('no subject: nothing above the alpha threshold');

  const pad = Math.round(Math.max(box.width, box.height) * PAD);
  return sharp(input)
    .extract(box)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: TRANSPARENT })
    .png({ palette: true, quality: 90 })
    .toBuffer();
}

// Social previews want 1200x630 and no transparency. The whole drawing sits
// inside a 10% margin on the light page colour, so no platform crop reaches it.
export async function socialImage(cover) {
  const width = 1200;
  const height = 630;
  const drawing = await sharp(cover)
    .resize({ width: width * 0.8, height: height * 0.8, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  return sharp({ create: { width, height, channels: 3, background: LIGHT } })
    .composite([
      {
        input: drawing.data,
        left: Math.round((width - drawing.info.width) / 2),
        top: Math.round((height - drawing.info.height) / 2),
      },
    ])
    .jpeg({ quality: 85 })
    .toBuffer();
}

export function flatten(cover, background) {
  return sharp(cover).flatten({ background }).png().toBuffer();
}

const TILE_W = 480;
const TILE_H = 320;
const GAP = 16;
const LABEL = 28;

export async function contactSheet(variants) {
  const layers = [];
  for (const [column, { n, cover }] of variants.entries()) {
    const left = GAP + column * (TILE_W + GAP);
    layers.push({
      input: Buffer.from(
        `<svg width="${TILE_W}" height="${LABEL}"><text x="0" y="22" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff">${n}</text></svg>`
      ),
      left,
      top: 0,
    });
    for (const [row, background] of [LIGHT, DARK].entries()) {
      layers.push({
        input: await sharp(cover)
          .resize(TILE_W, TILE_H, { fit: 'contain', background: TRANSPARENT })
          .flatten({ background })
          .png()
          .toBuffer(),
        left,
        top: LABEL + row * (TILE_H + GAP),
      });
    }
  }
  return sharp({
    create: {
      width: GAP + variants.length * (TILE_W + GAP),
      height: LABEL + 2 * TILE_H + 2 * GAP,
      channels: 3,
      background: '#808080',
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

if (import.meta.main) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node .claude/skills/illustrate-post/prepare.mjs <run-dir>');
    process.exit(2);
  }
  const accepted = [];
  const seen = new Map();
  const files = readdirSync(dir)
    .filter((file) => /^variant-\d+\.png$/.test(file))
    .sort();
  for (const file of files) {
    const n = Number(file.slice('variant-'.length, -'.png'.length));
    const raw = readFileSync(join(dir, file));
    // Two parallel runs that copied the same output look like two variants.
    const hash = createHash('sha256').update(raw).digest('hex');
    if (seen.has(hash)) {
      console.log(`variant ${n}: rejected, same file as variant ${seen.get(hash)}`);
      continue;
    }
    seen.set(hash, n);
    try {
      const cover = await normalize(raw);
      writeFileSync(join(dir, `variant-${n}.cover.png`), cover);
      writeFileSync(join(dir, `variant-${n}.og.jpg`), await socialImage(cover));
      writeFileSync(join(dir, `variant-${n}.light.png`), await flatten(cover, LIGHT));
      writeFileSync(join(dir, `variant-${n}.dark.png`), await flatten(cover, DARK));
      accepted.push({ n, cover });
      console.log(`variant ${n}: ok`);
    } catch (error) {
      console.log(`variant ${n}: rejected, ${error.message}`);
    }
  }
  if (accepted.length > 0) writeFileSync(join(dir, 'sheet.png'), await contactSheet(accepted));
  process.exitCode = accepted.length > 0 ? 0 : 1;
}
