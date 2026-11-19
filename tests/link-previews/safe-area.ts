import assert from 'node:assert/strict';
import sharp from 'sharp';

import { ACCENT_BAR_HEIGHT, SAFE_MARGIN } from '../../src/lib/link-previews/og-image.ts';

/**
 * Fails when a link-preview image draws past its safe area. Platforms crop the
 * edges, so the right margin and the bottom margin above the accent bar, where
 * text that does not fit would spill, must stay the background colour, and the
 * accent bar the accent colour. Satori always fills the canvas, so only the
 * pixels can tell. The post, project and site image tests all check it here.
 */
export async function assertSafeArea(
  png: Buffer,
  colors: { background: string; accent: string },
  where: string
): Promise<void> {
  const { width = 0, height = 0 } = await sharp(png).metadata();
  const bar = height - ACCENT_BAR_HEIGHT;
  const regions = [
    {
      name: 'right margin',
      hex: colors.background,
      region: { left: width - SAFE_MARGIN.x, top: 0, width: SAFE_MARGIN.x, height: bar },
    },
    {
      name: 'bottom margin',
      hex: colors.background,
      region: {
        left: 0,
        top: height - SAFE_MARGIN.y,
        width,
        height: SAFE_MARGIN.y - ACCENT_BAR_HEIGHT,
      },
    },
    {
      name: 'accent bar',
      hex: colors.accent,
      region: { left: 0, top: bar, width, height: ACCENT_BAR_HEIGHT },
    },
  ];
  for (const { name, hex, region } of regions) {
    const color = Buffer.from(hex.slice(1), 'hex');
    // Raw pixels: sharp's stats() reads the whole input and ignores extract().
    const { data, info } = await sharp(png)
      .extract(region)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      assert.ok(data.subarray(i, i + 3).equals(color), `${where}: another colour in the ${name}`);
    }
  }
}
