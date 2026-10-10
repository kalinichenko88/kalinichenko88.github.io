import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';

import {
  PAD,
  contactSheet,
  normalize,
  socialImage,
  subjectBox,
} from '../.claude/skills/illustrate-post/prepare.mjs';

// image_gen answers a 3:2 request with 1536x1024.
const WIDTH = 1536;
const HEIGHT = 1024;

type Box = { left: number; top: number; width: number; height: number };

// Shaped like a real image_gen output, measured on a 2026-10-10 probe: most
// pixels are alpha 0 but still carry RGB, faint alpha 1-7 noise reaches almost
// to the canvas edge (59k pixels, 33px from the left), and the drawing sits
// wherever the model put it.
async function generated(subject?: Box): Promise<Buffer> {
  const data = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 120;
    data[i * 4 + 2] = 60;
    data[i * 4 + 3] = i % 97 === 0 ? 5 : 0;
  }
  if (subject) {
    for (let y = subject.top; y < subject.top + subject.height; y++) {
      for (let x = subject.left; x < subject.left + subject.width; x++) {
        const p = (y * WIDTH + x) * 4;
        data[p] = data[p + 1] = data[p + 2] = 255;
        data[p + 3] = 253;
      }
    }
  }
  return sharp(data, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } })
    .png()
    .toBuffer();
}

test('finds the drawing, not the alpha noise around it', async () => {
  const box = { left: 40, top: 300, width: 600, height: 200 };
  assert.deepEqual(await subjectBox(await generated(box)), box);
});

test('trims the cover to the drawing with an even margin', async () => {
  // Touching the left edge and squeezed to the top, as the 3:2 probe framed it.
  const output = await normalize(await generated({ left: 0, top: 10, width: 900, height: 300 }));
  const pad = Math.round(900 * PAD);
  const meta = await sharp(output).metadata();
  assert.deepEqual([meta.width, meta.height], [900 + 2 * pad, 300 + 2 * pad]);
  assert.ok(meta.isPalette, 'the cover is palette-compressed');
  assert.equal((await sharp(output).stats()).isOpaque, false);
  assert.deepEqual(await subjectBox(output), { left: pad, top: pad, width: 900, height: 300 });
});

test('fits the whole drawing inside a 1200x630 social image', async () => {
  // A tall drawing is the case a plain cover crop would cut.
  const cover = await normalize(await generated({ left: 700, top: 0, width: 100, height: HEIGHT }));
  const { data, info } = await sharp(await socialImage(cover))
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height], [1200, 630]);

  // The drawing is whatever differs from #f4f2ee, the light page colour.
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const p = (y * info.width + x) * info.channels;
      const off =
        Math.abs(data[p] - 0xf4) + Math.abs(data[p + 1] - 0xf2) + Math.abs(data[p + 2] - 0xee);
      if (off <= 24) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  // Scaled whole, the 100x1024 drawing keeps its proportions; a crop would not.
  const ratio = (right - left + 1) / (bottom - top + 1);
  assert.ok(Math.abs(ratio - 100 / 1024) < 0.01, `drawing ratio ${ratio}`);
  assert.ok(top > 0 && bottom < info.height - 1, `drawing touches an edge: ${top}..${bottom}`);
});

test('rejects an opaque image', async () => {
  const opaque = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer();
  await assert.rejects(normalize(opaque), /no transparency/);
});

test('rejects an image with nothing but noise', async () => {
  await assert.rejects(normalize(await generated()), /no subject/);
});

test('lays covers of any shape side by side on both backgrounds', async () => {
  const wide = await normalize(await generated({ left: 100, top: 400, width: 1200, height: 300 }));
  const tall = await normalize(await generated({ left: 700, top: 100, width: 200, height: 800 }));
  const sheet = await contactSheet([
    { n: 1, cover: wide },
    { n: 2, cover: tall },
    { n: 3, cover: wide },
  ]);
  const { width, height } = await sharp(sheet).metadata();
  assert.deepEqual([width, height], [1504, 700]);
});
