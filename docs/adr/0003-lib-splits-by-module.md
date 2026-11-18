# 0003 The logic in src/lib/ splits by module

- Status: accepted
- Date: 2026-11-18

## Context

`src/lib/` held 12 code files. I-9 allows 10 in one folder, so the folder
was on the `debt` list, and each new file added to the debt. #87 wants to
move the numbers row of `project-image.ts` into a file of its own, and that
file had no folder to go to.

The Modules table in `docs/ARCHITECTURE.md` already gave each of the 12
files a module: Posts, Projects, Link previews and Shell. The folders of
`src/` are Astro's, by technology; the modules span them.

## Options considered

- One folder per module: `posts/` (4 files), `projects/` (3),
  `link-previews/` (3), `shell/` (2). Twelve moves; no new concept, since
  the table already holds the names. A new file goes where its module is.
- One folder by role, `images/`, for the four image files: four moves, but
  three modules share the folder, and `src/lib/` is back at 10 after two
  new files that are not images.
- Move only the two Shell files: `src/lib/` holds 10, at the limit, and the
  next file puts it back on the `debt` list.

## Decision

We will keep the logic of each module in one folder in `src/lib/`, named in
the Logic column of the Modules table: `posts/`, `projects/`,
`link-previews/` and `shell/`. `src/lib/` holds no file of its own. A file
keeps its name, so `posts/posts.ts` and `projects/projects.ts`; there is
still no `index.ts`. A new module that has logic gets a folder and a row in
the table. `posts/` and `projects/` import `link-previews/og-image.ts`; no
import goes the other way.

The move made the import of `og-image.ts` in `project-image.ts` longer, and
Prettier wrapped it, so the file grew from 221 to 227 lines while it was on
the `debt` list of I-8. With the folder decided, the split that #87 asks for
only moves code, so it goes into the same change: the numbers row
(`projectStats()`, `starLabel()` and the icons) moves to
`projects/project-stats.ts`, and `project-image.ts` drops to 136 lines.

## Consequences

Good: what changes together sits together. `src/lib/` leaves the `debt`
list of I-9, the largest folder holds 4 files, and each module has room to
grow.

Bad: imports are one level deeper (`../../consts.ts`), and two module names
repeat in their file names. An upward import from a lib file now starts with
`../../`, which the old pattern of I-2 did not match, so I-2 needed a wider
one.

## Invariants

I-2, amended: its pattern takes any number of `../`. I-14, added: the
direction between the module folders. I-1, I-3, I-4, I-5, I-8 and I-13 name
the new paths. I-8: `project-image.ts` leaves the `debt` list. I-9:
`src/lib/` leaves the `debt` list.

## Confirmation

The `Check:` lines of I-2, I-9 and I-14.
