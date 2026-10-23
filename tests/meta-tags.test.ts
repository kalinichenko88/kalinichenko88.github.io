import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

import { SITE_DESCRIPTION } from '../src/consts.ts';

// Social previews show about 125 characters of a description and cut the rest.
const MAX_DESCRIPTION = 125;

test('the site description fits in a social preview', () => {
  assert.ok(
    SITE_DESCRIPTION.length <= MAX_DESCRIPTION,
    `SITE_DESCRIPTION is ${SITE_DESCRIPTION.length} characters`
  );
});

test('every post description fits in a social preview', async () => {
  const dir = new URL('../content/posts/', import.meta.url);
  for (const file of await readdir(dir)) {
    const source = await readFile(new URL(file, dir), 'utf8');
    const description = source.match(/^description:\s*'?(.*?)'?$/m)?.[1] ?? '';
    assert.ok(description.length <= MAX_DESCRIPTION, `${file}: ${description.length} characters`);
  }
});

// Discord and Slack show og:site_name above the title of a link card.
test('every page names the site in og:site_name', async () => {
  const head = await readFile(new URL('../src/components/Head.astro', import.meta.url), 'utf8');
  assert.match(head, /<meta property="og:site_name" content=\{SITE_NAME\} \/>/);
});
