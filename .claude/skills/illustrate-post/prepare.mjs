/* eslint-disable no-console */
/* global Buffer, console, process */
// The mechanical half of the illustrate-post skill: gate, normalize, compress
// and preview the variants one run produced. SKILL.md has the workflow.
//
//   node .claude/skills/illustrate-post/prepare.mjs <run-dir>
//
// Reads variant-N.png and writes variant-N.cover.png (the master to commit),
// variant-N.light.png and variant-N.dark.png (flattened, for viewing) and
// sheet.png (every accepted variant on both backgrounds). Exits 1 if none
// passed.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const WIDTH = 1536;
export const HEIGHT = 1024;
// The social image is a 1200x630 cover crop of the 3:2 master, which trims
// 10.6% from the top and bottom. The vertical margin keeps the drawing clear.
export const MARGIN_X = Math.round(WIDTH * 0.1);
export const MARGIN_Y = Math.round(HEIGHT * 0.14);
// Generated PNGs carry faint alpha noise (1 to 7) almost to the canvas edge;
// above this threshold the bounding box is the drawing.
const ALPHA_THRESHOLD = 16;
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

  const subject = await sharp(input)
    .extract(box)
    .resize({ width: WIDTH - 2 * MARGIN_X, height: HEIGHT - 2 * MARGIN_Y, fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  return sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: subject.data,
        left: Math.round((WIDTH - subject.info.width) / 2),
        top: Math.round((HEIGHT - subject.info.height) / 2),
      },
    ])
    .png({ palette: true, quality: 90 })
    .toBuffer();
}

export function flatten(cover, background) {
  return sharp(cover).flatten({ background }).png().toBuffer();
}

const TILE_W = 480;
const TILE_H = 320;
const GAP = 16;
const LABEL = 28;
// The band a 1200x630 crop keeps of a 3:2 tile, outlined on the light tile.
const OG_INSET = Math.round((TILE_H - TILE_W * (630 / 1200)) / 2);

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
        input: await sharp(cover).resize(TILE_W, TILE_H).flatten({ background }).png().toBuffer(),
        left,
        top: LABEL + row * (TILE_H + GAP),
      });
    }
    layers.push({
      input: Buffer.from(
        `<svg width="${TILE_W}" height="${TILE_H}"><rect x="1" y="${OG_INSET}" width="${TILE_W - 2}" height="${TILE_H - 2 * OG_INSET}" fill="none" stroke="#c25a34" stroke-width="2" stroke-dasharray="8 6"/></svg>`
      ),
      left,
      top: LABEL,
    });
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
