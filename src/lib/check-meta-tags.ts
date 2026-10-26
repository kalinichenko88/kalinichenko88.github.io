import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import { AUTHOR_NAME, MAX_DESCRIPTION, MAX_TITLE, SITE_NAME } from '../consts.ts';

/**
 * Checks the tags a link preview reads on every HTML page that a build in
 * `dir` rendered, as `site` (with a trailing slash) serves it. `assets` is
 * the map the astro:build:done hook gets: output files by route. Returns one
 * line per broken rule, as `<page>: <problem>`; an empty list means every rule
 * holds. astro.config.js runs it after each build.
 */
export async function checkMetaTags(
  dir: URL,
  site: string,
  assets: Map<string, URL[]>
): Promise<string[]> {
  // Only rendered pages: HTML copied from public/ is not in `assets`. The 404
  // page answers every missing address, so it has no address of its own.
  const files = [...assets]
    .filter(([route]) => {
      return route !== '/404';
    })
    .flatMap(([, urls]) => {
      return urls;
    })
    .filter((file) => {
      return file.pathname.endsWith('.html');
    })
    .sort((a, b) => {
      return a.href < b.href ? -1 : 1;
    });
  const problems: string[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();

  // A filter that drops every page would let any tag pass.
  if (files.length === 0) {
    return ['the build has no pages to check'];
  }

  for (const file of files) {
    const path = file.href.slice(dir.href.length).replace(/index\.html$/, '');
    const page = `/${path}`;
    // ogp.me puts the tags in <head>; an SVG <title> in the body is not one.
    const [head] = (await readFile(file, 'utf8')).split('</head>');
    const tags = readTags(head);
    const found = [
      ...tagProblems(tags, new URL(path, site).href),
      ...(await imageProblems(tags, dir, site)),
      ...repeated(titles, tags.get('title')?.[0], page, '<title>'),
      ...repeated(descriptions, tags.get('description')?.[0], page, 'description'),
    ];
    problems.push(
      ...found.map((problem) => {
        return `${page}: ${problem}`;
      })
    );
  }

  return problems;
}

// X's limit for image alt text.
const MAX_ALT = 420;
// WhatsApp shows no image above about 300 KB.
const MAX_IMAGE_BYTES = 300 * 1024;
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

const REQUIRED = [
  'title',
  'description',
  'canonical',
  'og:type',
  'og:site_name',
  'og:url',
  'og:title',
  'og:description',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
  'twitter:image:alt',
];

type Tags = Map<string, string[]>;

/**
 * Every `<title>`, canonical link and named meta tag of a page, decoded, in
 * any attribute order. Astro writes each attribute as `name="value"`.
 */
function readTags(html: string): Tags {
  const tags: Tags = new Map();
  const add = (key: string, value: string): void => {
    tags.set(key, [...(tags.get(key) ?? []), decode(value)]);
  };

  for (const [, title] of html.matchAll(/<title>([^<]*)<\/title>/g)) {
    add('title', title);
  }
  for (const [tag] of html.matchAll(/<(?:meta|link)\s[^>]*>/g)) {
    const attribute = (name: string): string | undefined => {
      return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
    };
    const canonical = attribute('rel') === 'canonical' ? 'canonical' : undefined;
    const key = attribute('property') ?? attribute('name') ?? canonical;
    const value = attribute('content') ?? attribute('href');
    if (key !== undefined && value !== undefined) {
      add(key, value);
    }
  }

  return tags;
}

function tagProblems(tags: Tags, url: string): string[] {
  const problems: string[] = [];
  const value = (key: string): string => {
    return tags.get(key)?.[0] ?? '';
  };

  for (const key of REQUIRED) {
    const count = tags.get(key)?.length ?? 0;
    if (count !== 1) {
      problems.push(count === 0 ? `${key} is missing` : `${key} appears ${count} times`);
    }
  }

  // A missing tag has its line above, so the rules below skip it.
  const differ = (key: string, other: string): boolean => {
    return tags.has(key) && tags.has(other) && value(key) !== value(other);
  };
  const isNot = (key: string, expected: string): boolean => {
    return tags.has(key) && value(key) !== expected;
  };
  const title = value('title');
  const ogTitle = value('og:title');
  const description = value('description');
  const type = value('og:type');
  const alt = value('og:image:alt');

  if (title.length > MAX_TITLE) {
    problems.push(`<title> is ${title.length} characters, ${MAX_TITLE} at most`);
  }
  if (ogTitle.length > MAX_TITLE) {
    problems.push(`og:title is ${ogTitle.length} characters, ${MAX_TITLE} at most`);
  }
  // Facebook asks for og:title without branding; og:site_name names the site.
  // Branding is a name after " - ", as in "<post> - Ivan Kalinichenko - Senior
  // Frontend Engineer"; a post about the site may still name it as its topic.
  const branded = [AUTHOR_NAME, SITE_NAME].some((name) => {
    return ogTitle.includes(` - ${name}`);
  });
  if (branded) {
    problems.push('og:title names the site, which og:site_name does');
  }
  if (description.length > MAX_DESCRIPTION) {
    problems.push(`description is ${description.length} characters, ${MAX_DESCRIPTION} at most`);
  }
  if (differ('og:description', 'description')) {
    problems.push('og:description is not the description');
  }
  for (const key of ['canonical', 'og:url']) {
    if (isNot(key, url)) {
      problems.push(`${key} is ${value(key)}, not the page's address ${url}`);
    }
  }
  if (tags.has('og:type') && type !== 'website' && type !== 'article') {
    problems.push(`og:type is "${type}", not website or article`);
  }
  const publishedTimes = tags.get('article:published_time') ?? [];
  const onePublishedTime =
    publishedTimes.length === 1 && !Number.isNaN(Date.parse(publishedTimes[0]));
  if (type === 'article' && !onePublishedTime) {
    problems.push('an article needs one valid article:published_time');
  }
  if (isNot('og:site_name', SITE_NAME)) {
    problems.push(`og:site_name is not ${SITE_NAME}`);
  }
  if (alt.length > MAX_ALT) {
    problems.push(`og:image:alt is ${alt.length} characters, ${MAX_ALT} at most`);
  }
  if (differ('twitter:image:alt', 'og:image:alt')) {
    problems.push('twitter:image:alt is not og:image:alt');
  }
  if (isNot('twitter:card', 'summary_large_image')) {
    problems.push('twitter:card is not summary_large_image');
  }

  return problems;
}

/**
 * The og:image file must be on the site and in the build, 1200x630 as its
 * tags say, and small enough for WhatsApp. tagProblems() reports a missing tag.
 */
async function imageProblems(tags: Tags, dir: URL, site: string): Promise<string[]> {
  const src = tags.get('og:image')?.[0];
  const size = `${IMAGE_WIDTH}x${IMAGE_HEIGHT}`;
  const declared = `${tags.get('og:image:width')?.[0]}x${tags.get('og:image:height')?.[0]}`;
  const declaresSize = tags.has('og:image:width') && tags.has('og:image:height');
  const problems: string[] = [];

  if (declaresSize && declared !== size) {
    problems.push(`og:image:width and og:image:height say ${declared}, not ${size}`);
  }
  if (!src) {
    return problems;
  }
  if (!src.startsWith(site)) {
    return [...problems, `og:image is not an absolute URL on ${site}: ${src}`];
  }

  // "./" keeps even a "//x" path inside the build. The path stays encoded, as
  // a file URL wants it.
  const data = await readFile(new URL(`.${new URL(src).pathname}`, dir)).catch(() => {
    return undefined;
  });
  if (!data) {
    return [...problems, `og:image ${src} is not in the build`];
  }

  const image = await sharp(data)
    .metadata()
    .catch(() => {
      return undefined;
    });
  if (!image) {
    return [...problems, `og:image ${src} is not an image`];
  }

  const { width, height } = image;
  if (`${width}x${height}` !== size) {
    problems.push(`og:image is ${width}x${height}, not ${size}`);
  }
  if (data.length > MAX_IMAGE_BYTES) {
    problems.push(
      `og:image is ${Math.round(data.length / 1024)} KB, ${MAX_IMAGE_BYTES / 1024} KB at most`
    );
  }

  return problems;
}

/** Google wants a distinct title and description on every page. */
function repeated(
  seen: Map<string, string>,
  value: string | undefined,
  page: string,
  name: string
): string[] {
  // A missing tag has its own line from tagProblems().
  if (value === undefined) {
    return [];
  }

  const first = seen.get(value);
  if (first) {
    return [`same ${name} as ${first}`];
  }
  seen.set(value, page);

  return [];
}

// The only entities Astro writes: escapeHTML() in its runtime.
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

function decode(text: string): string {
  return text.replace(/&#?\w+;/g, (entity) => {
    return ENTITIES[entity] ?? entity;
  });
}
