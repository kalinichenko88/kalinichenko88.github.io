# 0002 Posts have one entry point

- Status: accepted
- Date: 2026-10-27

## Context

Eight routes read the posts with `getCollection('posts')`. Five of them
sorted the posts newest first, each with its own copy of the comparator.
Projects have one entry point, `getProjects()` in `src/lib/projects.ts`
(I-3). Posts had none, so a new page that lists posts wrote the sort again,
and a change to which posts show (a draft, a pinned post) needed an edit in
every route.

`src/lib/` runs under plain node in the tests, so I-5 lets only
`projects.ts` import a value from `astro:content`. A reader of the posts
collection has to import `getCollection`.

The copies pass the three conditions for shared code of the architecture
skill: they do one job and would change together, no caller needs a flag,
and the shared code goes to a lower layer.

## Options considered

- `getPosts()` in `src/lib/posts.ts`, called by every route that reads posts;
  I-5 lets the two collection readers import from `astro:content`: one new
  file, the same shape as `getProjects()`.
- Keep the copies in each page: no new file, but each new list repeats the
  sort, and a draft filter needs eight edits.
- Put the reader in a file outside `src/lib/`, so I-5 stays as it is: a new
  folder for one function, with no layer in the Layers section for it.

## Decision

We will read posts only through `getPosts()` in `src/lib/posts.ts`, which
returns every post newest first. A page that needs another order or a subset
filters or sorts that list. `posts.ts` joins `projects.ts` as a file in
`src/lib/` that may import a value from `astro:*`.

## Consequences

Good: the order and any later filter of the posts are in one function. Posts
and projects have the same kind of entry point.

Bad: `src/lib/` holds a second file that plain node cannot load, so
`getPosts()` has no unit test; the build is its test. `src/lib/` grows to 12
code files, past the limit of I-9 (10); it is already on the `debt` list,
and #98 plans its split.

## Invariants

I-5, amended: `src/lib/posts.ts` joins its `except` list. I-13, added.

## Confirmation

The `Check:` lines of I-5 and I-13.
