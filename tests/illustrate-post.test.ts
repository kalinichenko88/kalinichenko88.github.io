import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';

import {
  HEIGHT,
  MARGIN_X,
  MARGIN_Y,
  WIDTH,
  contactSheet,
  normalize,
  subjectBox,
} from '../.claude/skills/illustrate-post/prepare.mjs';

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

const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) <= 2, `${actual} is not within 2px of ${expected}`);

test('finds the drawing, not the alpha noise around it', async () => {
  const box = { left: 40, top: 300, width: 600, height: 200 };
  assert.deepEqual(await subjectBox(await generated(box)), box);
});

test('centres a drawing the model pushed against the edge', async () => {
  // Touching the left edge and squeezed to the top, as the 3:2 probe framed it.
  const output = await normalize(await generated({ left: 0, top: 10, width: 900, height: 300 }));
  const { width, height } = await sharp(output).metadata();
  assert.deepEqual([width, height], [WIDTH, HEIGHT]);
  assert.equal((await sharp(output).stats()).isOpaque, false);

  const box = await subjectBox(output);
  assert.ok(box);
  // 900x300 fills the 1228x738 area by width: 1228x409, centred.
  near(box.left, MARGIN_X);
  near(box.left + box.width, WIDTH - MARGIN_X);
  near(box.top + box.height / 2, HEIGHT / 2);
});

test('keeps a tall drawing inside the band the OG crop keeps', async () => {
  const output = await normalize(
    await generated({ left: 700, top: 0, width: 100, height: HEIGHT })
  );
  const box = await subjectBox(output);
  assert.ok(box);
  // A 1200x630 cover crop of 1536x1024 keeps rows 109 to 915.
  near(box.top, MARGIN_Y);
  assert.ok(box.top >= 109 && box.top + box.height <= 915, JSON.stringify(box));
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

test('lays the variants out side by side on both backgrounds', async () => {
  const cover = await normalize(await generated({ left: 400, top: 300, width: 600, height: 400 }));
  const sheet = await contactSheet([1, 2, 3].map((n) => ({ n, cover })));
  const { width, height } = await sharp(sheet).metadata();
  assert.deepEqual([width, height], [1504, 700]);
});
