import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

import { DARK_THEME, LIGHT_THEME } from '../src/config/themes.ts';
import { offlineNumbers } from '../src/lib/github-repo.ts';
import { renderOgImage } from '../src/lib/og-image.ts';
import {
  IMAGE_PALETTES,
  IMAGE_THEMES,
  projectImage,
  projectImageSrc,
  projectStats,
  starLabel,
  type ImageTheme,
} from '../src/lib/project-image.ts';

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
// 10% right margin (x 1080 on), above the accent bar that runs the full width.
// The case: the longest name and tagline, every count at its widest compact
// form, and languages from short to far too long. Satori always fills the
// canvas, so only pixels can tell a row that runs off it.
test('the widest numbers row stays inside the safe area', async () => {
  const project = {
    name: 'Obsidian Budget Planner Plugin',
    tagline:
      "Turns an AI agent's Markdown into HTML that Telegram accepts and streams its reply into a live draft.",
    url: 'https://github.com/kalinichenko88/obsidian-budget-planner-plugin',
    stars: 987654,
    issues: 987654,
    forks: 987654,
  };
  const languages = ['TypeScript', 'Jupyter Notebook', 'A Language Name Far Longer Than Any'];
  for (const language of languages) {
    for (const theme of IMAGE_THEMES) {
      const palette = IMAGE_PALETTES[theme];
      const png = await renderOgImage(projectImage({ ...project, language }, theme));
      // Raw pixels: sharp's stats() reads the whole input and ignores extract().
      const { data, info } = await sharp(png)
        .extract({ left: 1080, top: 0, width: 120, height: 616 })
        .raw()
        .toBuffer({ resolveWithObject: true });
      const surface = Buffer.from(palette.surface.slice(1), 'hex');
      for (let i = 0; i < data.length; i += info.channels) {
        const pixel = data.subarray(i, i + 3);
        assert.ok(pixel.equals(surface), `${language}, ${theme}: drawn in the right margin`);
      }
    }
  }
});

// The fonts carry the latin subset only, and Satori draws a glyph outside it
// as nothing, with no error. So the text the image draws must stay inside it.
test('every project name and tagline is in the image font subset', async () => {
  for (const { file, name, tagline } of await projects()) {
    assert.match(
      `${name}${tagline}`,
      /^[\u0020-\u007e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2026]*$/,
      file
    );
  }
});

// Browsers and link previews cache an image by its URL, so the URL changes
// with the image's bytes and stays when they do not.
test('the image URL changes with the image', async () => {
  const [project] = (await projects()).sort((a, b) => a.file.localeCompare(b.file));
  const src = await projectImageSrc(project, 'light');
  assert.match(src, /^\/projects\/[\w-]+\/light\.png\?v=[0-9a-f]{8}$/);
  // The same project gives the same URL, so an unchanged image keeps its cache.
  assert.equal(await projectImageSrc({ ...project }, 'light'), src);
  const changed = await projectImageSrc({ ...project, tagline: `${project.tagline}!` }, 'light');
  assert.notEqual(changed, src);
  // The numbers change between builds with no commit at all.
  const oneStar = await projectImageSrc({ ...project, stars: 1 }, 'light');
  assert.notEqual(await projectImageSrc({ ...project, stars: 2 }, 'light'), oneStar);
});

// A full set of numbers, and the ones dev and a failed GitHub call give: the YAML stars,
// no other count and no language, so the numbers row can be all but empty.
test('every project renders a 1200x630 PNG in both themes, with or without GitHub', async () => {
  for (const project of await projects()) {
    assert.ok(project.name && project.slug && project.tagline, `${project.file}: frontmatter`);
    const variants = { full: {}, offline: offlineNumbers(project.stars) };
    for (const [variant, numbers] of Object.entries(variants)) {
      for (const theme of IMAGE_THEMES) {
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
  const block = (id: string) => css.split(`[data-theme='${id}'] {`)[1]?.split('}')[0] ?? '';
  const blocks: Record<ImageTheme, string> = {
    light: block(LIGHT_THEME),
    dark: block(DARK_THEME),
  };
  for (const theme of IMAGE_THEMES) {
    assert.ok(blocks[theme], `${theme}: no theme block in global.css`);
    for (const [token, value] of Object.entries(IMAGE_PALETTES[theme])) {
      const declaration = `--color-${token}: ${value};`;
      const declared = blocks[theme]
        .split('\n')
        .some((line) => line.trim().startsWith(declaration));
      assert.ok(declared, `${theme}: ${declaration} is not in global.css`);
    }
  }
});

// A failed render must not stay in the memo, or dev would serve the failure
// until a restart. A broken data: image fails with no network.
test('a failed render is tried again', async () => {
  const broken = {
    type: 'img',
    props: { src: 'data:image/png;base64,not-a-png', width: 10, height: 10 },
  };
  const first = renderOgImage(broken);
  await assert.rejects(first);
  const second = renderOgImage(broken);
  assert.notEqual(second, first, 'the failed render came back from the memo');
  await assert.rejects(second);
});

test('a project page passes its light image to og:image', async () => {
  const page = await readFile(
    new URL('../src/pages/projects/[slug].astro', import.meta.url),
    'utf8'
  );
  assert.match(page, /image=\{/);
  assert.match(page, /projectImageSrc\(project, 'light'\)/);
});

// A card that linked the bare path would keep a browser's cached old image.
test('the /projects card links each image by its versioned URL', async () => {
  const card = await readFile(
    new URL('../src/components/ProjectCard.astro', import.meta.url),
    'utf8'
  );
  assert.match(card, /projectImageSrc\(project, theme\)/);
  assert.doesNotMatch(card, /\.png['"`]/, 'a bare image path in the card');
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
