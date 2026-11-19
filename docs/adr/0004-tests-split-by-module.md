# 0004 The tests split by module

- Status: accepted
- Date: 2026-11-19

## Context

`tests/` held 17 code files. I-9 allows 10 in one folder, so the folder was
on the `debt` list from the start, with 14 files. #87 added the sixteenth
and the seventeenth, and each new test added to the debt (#108).

ADR 0003 split `src/lib/` into one folder per module of the Modules table in
`docs/ARCHITECTURE.md`. Each test checks the code of one module, so the
same names fit `tests/`.

## Options considered

- One folder per module, with the names of the Logic column: `posts/` (3
  files), `projects/` (3), `link-previews/` (3), `shell/` (6), and
  `authoring/` (2) for the tests of the skills' scripts. Seventeen moves;
  no new concept. A new test goes where the code it tests is.
- One folder by kind: the text tests, which read `.astro` and `.css` files,
  apart from the tests that import `src/lib/`. Many tests do both, as
  `project-images`, `site-image` and `navigation`, so they have no one
  place.
- Move only enough files to get under the limit: `tests/` holds 10, and the
  next test puts it back on the `debt` list.

## Decision

We will keep each test in `tests/<folder>/`, where `<folder>` is the Logic
folder of the module whose code it tests: `posts/`, `projects/`,
`link-previews/` or `shell/`. The tests of the skills' scripts go into
`authoring/`. `tests/` holds no code file of its own.

A test that reads the markup of several modules goes to the module whose
rule it keeps. `reading-veil` and `motion-page-coverage` keep rules of the
pixel field and the reveal, so they go to `shell/`. `post-covers` checks the
covers that the posts declare and the surfaces that show them, so it goes to
`posts/`, not to `authoring/`, though the skill makes the files.

`safe-area.ts`, the shared pixel check, goes to `link-previews/`, with the
renderer whose margin it checks. The image tests in `posts/` and `projects/`
import it from there, as their lib files import `og-image.ts` (I-14).
`tests/fixtures/` keeps its place: fixtures are not code, and I-9 does not
count them.

The `test` script quotes its glob, `'tests/**/*.test.ts'`, so that node
expands it and reaches every folder. Without the quotes, `sh` expands it and
reads `**` as `*`.

## Consequences

Good: `tests/` leaves the `debt` list of I-9. The largest folder, `shell/`,
holds 6 files. The tests of one module sit together.

Bad: every path out of a test climbs one more level (`../../src/`). Two
tests read `../fixtures/`, outside their own folder. The first test of the
Home or the Profile module needs a new folder.

## Invariants

I-9: `tests/` leaves the `debt` list. I-10 and I-11 name the new paths.

## Confirmation

The `Check:` line of I-9, and `npm test`, which runs 79 tests, the same
count as before the move.
