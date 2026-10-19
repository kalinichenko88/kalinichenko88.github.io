import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

// The tag policy from CLAUDE.md (Content Structure > Tags). Add a tag here
// only once it groups more than one post.
const TOOL_TAGS = ['obsidian', 'neovim', 'claude-code'];
const TOPIC_TAGS = ['ai', 'git', 'personal-finance', 'meta', 'code-review'];

const postsDir = new URL('../content/posts/', import.meta.url);
const projectsDir = new URL('../content/projects/', import.meta.url);

test('every post follows the tag policy', async () => {
  for (const file of await readdir(postsDir)) {
    const source = await readFile(new URL(file, postsDir), 'utf8');
    const line = source.match(/^tags: \[(.*)\]$/m);
    assert.ok(line, `${file} has no flow-style tags line`);
    const tags = line[1].split(',').map((tag) => tag.trim());

    // A post about the site itself has no tool to name.
    if (tags.length === 1 && tags[0] === 'meta') continue;

    assert.ok(tags.length >= 2 && tags.length <= 3, `${file} has ${tags.length} tags`);
    for (const tag of tags) {
      assert.ok([...TOOL_TAGS, ...TOPIC_TAGS].includes(tag), `${file}: unknown tag ${tag}`);
    }
    assert.equal(
      tags.filter((tag) => TOOL_TAGS.includes(tag)).length,
      1,
      `${file} needs exactly one tool tag`
    );
  }
});

// /projects lists a project's posts by shared tag, so a typo here would
// silently give that project no posts at all.
test('every project tag comes from the post vocabulary', async () => {
  for (const file of await readdir(projectsDir)) {
    const source = await readFile(new URL(file, projectsDir), 'utf8');
    const line = source.match(/^tags: \[(.*)\]$/m);
    if (!line) continue;
    for (const tag of line[1].split(',').map((tag) => tag.trim().replace(/^'|'$/g, ''))) {
      assert.ok([...TOOL_TAGS, ...TOPIC_TAGS].includes(tag), `${file}: unknown tag ${tag}`);
    }
  }
});
