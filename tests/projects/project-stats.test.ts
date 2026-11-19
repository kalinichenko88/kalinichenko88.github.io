import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { projectStats, starLabel } from '../../src/lib/projects/project-stats.ts';

// Short enough that a growing count cannot push the site name off the image,
// and the same words on the text cards as on the image.
test('a count is written in compact form', () => {
  const labels = projectStats({ stars: 12345, issues: 1, forks: 0 }).map(({ label }) => {
    return label;
  });
  assert.deepEqual(labels, ['12K stars', '1 issue']);
  assert.deepEqual([0, 1, 11, 12345].map(starLabel), [null, '1 star', '11 stars', '12K stars']);
});

// "0 stars" says nothing, so the image drops a number at zero, as the card
// already did for stars.
test('the image shows only the numbers above zero', () => {
  const labels = (numbers: Parameters<typeof projectStats>[0]) => {
    return projectStats(numbers).map(({ label }) => {
      return label;
    });
  };
  assert.deepEqual(labels({ stars: 0, issues: 1, forks: 2 }), ['1 issue', '2 forks']);
  assert.deepEqual(labels({ stars: 2, issues: 2, forks: 1 }), ['2 stars', '2 issues', '1 fork']);
  assert.deepEqual(labels({ stars: 1, issues: 0, forks: 0 }), ['1 star']);
  assert.deepEqual(labels({ stars: 0, issues: 0, forks: 0 }), []);
});

// The homepage card and the project page write their star count the way the
// image does, so one project never shows two numbers. They read the count
// only through starLabel(): any other use of project.stars fails here.
test('every text surface reads the star count only through starLabel()', async () => {
  for (const file of ['src/components/ProjectCard.astro', 'src/pages/projects/[slug].astro']) {
    const source = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
    const reads = source.match(/project\.stars\b/g) ?? [];
    const throughLabel = source.match(/starLabel\(project\.stars\)/g) ?? [];
    assert.ok(throughLabel.length > 0, `${file}: no starLabel(project.stars)`);
    assert.equal(reads.length, throughLabel.length, `${file}: project.stars read directly`);
  }
});
