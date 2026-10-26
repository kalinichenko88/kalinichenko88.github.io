import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

import { offlineNumbers } from '../src/lib/github-repo.ts';
import { renderOgImage } from '../src/lib/og-image.ts';
import { IMAGE_PALETTES, projectImage, projectStats, starLabel } from '../src/lib/project-image.ts';

// Every project gets a 1200x630 image per theme, rendered at build time by
// src/pages/projects/[slug]/[theme].png.ts: the light one is its og:image, and
// /projects shows the one that matches the theme.
const projectsDir = new URL('../content/projects/', import.meta.url);

async function projects() {
  const found = [];
  for (const file of await readdir(projectsDir)) {
    const source = await readFile(new URL(file, projectsDir), 'utf8');
    const field = (name: string) => {
      return source.match(new RegExp(`^${name}: *(['"]?)(.*)\\1$`, 'm'))?.[2] ?? '';
    };
    found.push({
      file,
      name: field('name'),
      slug: field('slug'),
      tagline: field('tagline'),
      url: `https://github.com/kalinichenko88/${field('slug')}`,
      stars: Number(field('stars') || 0),
      issues: 8,
      forks: 1,
      language: 'TypeScript',
    });
  }
  return found;
}

// Platforms crop the edges of a link preview, so nothing may be drawn in the
// 10% right margin, above the accent bar that runs the full width. The case:
// the longest name and tagline, every count at its widest compact form, and a
// ten-letter language. Satori always fills the canvas, so only pixels can tell
// a row that runs off it.
test('the widest numbers row stays inside the safe area', async () => {
  const project = {
    name: 'Obsidian Budget Planner Plugin',
    tagline:
      "Turns an AI agent's Markdown into HTML that Telegram accepts and streams its reply into a live draft.",
    url: 'https://github.com/kalinichenko88/obsidian-budget-planner-plugin',
    stars: 1234,
    issues: 1234,
    forks: 1234,
    language: 'TypeScript',
  };
  for (const theme of Object.keys(IMAGE_PALETTES) as (keyof typeof IMAGE_PALETTES)[]) {
    // Raw pixels: sharp's stats() reads the whole input and ignores extract().
    const { data, info } = await sharp(await renderOgImage(projectImage(project, theme)))
      .extract({ left: 1081, top: 0, width: 119, height: 616 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const background = data.subarray(0, info.channels);
    for (let i = 0; i < data.length; i += info.channels) {
      const pixel = data.subarray(i, i + info.channels);
      assert.ok(pixel.equals(background), `${theme}: something is drawn in the right margin`);
    }
  }
});

// A full set of numbers, and the ones dev and a failed GitHub call give: the YAML stars,
// no other count and no language, so the numbers row can be all but empty.
test('every project renders a 1200x630 PNG in both themes, with or without GitHub', async () => {
  for (const project of await projects()) {
    assert.ok(project.name && project.slug && project.tagline, `${project.file}: frontmatter`);
    const variants = { full: {}, offline: offlineNumbers(project.stars) };
    for (const [variant, numbers] of Object.entries(variants)) {
      for (const theme of Object.keys(IMAGE_PALETTES) as (keyof typeof IMAGE_PALETTES)[]) {
        const png = await renderOgImage(projectImage({ ...project, ...numbers }, theme));
        const { format, width, height, isPalette } = await sharp(png).metadata();
        const where = `${project.file}: ${variant} numbers, ${theme}`;
        assert.deepEqual([format, width, height], ['png', 1200, 630], where);
        // A palette PNG is under half the size of a truecolour one here.
        assert.ok(isPalette, `${where}: not a palette PNG`);
      }
    }
  }
});

// Short enough that a growing count cannot push the site name off the image,
// and the same words on the text cards as on the image.
test('a count is written in compact form', () => {
  const labels = projectStats({ stars: 12345, issues: 1, forks: 0 }).map(({ label }) => label);
  assert.deepEqual(labels, ['12K stars', '1 issue']);
  assert.deepEqual([0, 1, 11, 12345].map(starLabel), [null, '1 star', '11 stars', '12K stars']);
});

// "0 stars" says nothing, so the image drops a number at zero, as the card
// already did for stars.
test('the image shows only the numbers above zero', () => {
  const labels = (numbers: Parameters<typeof projectStats>[0]) => {
    return projectStats(numbers).map(({ label }) => label);
  };
  assert.deepEqual(labels({ stars: 0, issues: 1, forks: 2 }), ['1 issue', '2 forks']);
  assert.deepEqual(labels({ stars: 2, issues: 2, forks: 1 }), ['2 stars', '2 issues', '1 fork']);
  assert.deepEqual(labels({ stars: 1, issues: 0, forks: 0 }), ['1 star']);
  assert.deepEqual(labels({ stars: 0, issues: 0, forks: 0 }), []);
});

// Satori cannot read CSS variables, so the image carries its own copy of the
// theme tokens. This keeps the copy in step with global.css.
test('the image palettes match the theme tokens', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  const blocks = {
    light: css.match(/\[data-theme='cloud'\] \{([^}]*)\}/)?.[1] ?? '',
    dark: css.match(/\[data-theme='cloud-dark'\] \{([^}]*)\}/)?.[1] ?? '',
  };
  for (const [theme, palette] of Object.entries(IMAGE_PALETTES)) {
    for (const [token, value] of Object.entries(palette)) {
      assert.match(
        blocks[theme as keyof typeof blocks],
        new RegExp(`--color-${token}: ${value};`),
        `${theme}: --color-${token}`
      );
    }
  }
});

test('a project page passes its light image to og:image', async () => {
  const page = await readFile(
    new URL('../src/pages/projects/[slug].astro', import.meta.url),
    'utf8'
  );
  assert.match(page, /image=\{/);
  assert.match(page, /`\/projects\/\$\{project\.slug\}\/light\.png\?v=\$\{imageVersion\}`/);
});

// The homepage card and the project page write their star count the way the
// image does, so one project never shows two numbers. They read the count
// only through starLabel(): any other use of project.stars fails here.
test('every text surface reads the star count only through starLabel()', async () => {
  for (const file of ['src/components/ProjectCard.astro', 'src/pages/projects/[slug].astro']) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const reads = source.match(/project\.stars\b/g) ?? [];
    const throughLabel = source.match(/starLabel\(project\.stars\)/g) ?? [];
    assert.ok(throughLabel.length > 0, `${file}: no starLabel(project.stars)`);
    assert.equal(reads.length, throughLabel.length, `${file}: project.stars read directly`);
  }
});
