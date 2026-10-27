# 0001 Types stay with their producer

- Status: accepted
- Date: 2026-10-27

## Context

The `kalinichenko:typescript-conventions` skill puts a type that two files
or more use in the `models/` folder of its area, the nearest folder that holds
every file that uses it. It puts a zod schema in a `schemas/` folder beside
it.

This project does not. Each shared type sits in the file that produces its
values, and the files that use it import it from there. This follows the
Modules rule in `docs/ARCHITECTURE.md`: a module's API is the exports of its
`src/lib/` files. The six shared types:

- `Project` in `src/lib/projects.ts`, inferred from `getProjects()`. Used by
  `ProjectCard.astro` and the project image route.
- `RepoNumbers` in `src/lib/github-repo.ts`. Used by `project-image.ts`.
- `OgElement` in `src/lib/og-image.ts`. Used by the three image layouts
  (`post-image.ts`, `project-image.ts`, `site-image.ts`) and
  `tests/site-image.test.ts`.
- `OgDrawing` in `src/lib/og-image.ts`. Used by `post-image.ts` and
  `site-image.ts`.
- `ImagePost` in `src/lib/post-image.ts`. Used by the post image route and
  `tests/post-images.test.ts`.
- `ImageTheme` in `src/lib/project-image.ts`, beside `IMAGE_THEMES`, the list
  of its values. Used by the project image route and
  `tests/project-images.test.ts`.

A type that one file uses, as `Job` in `src/config/resume.ts`, stays in that
file by both rules.

The zod schemas are in `src/content.config.ts`. Astro loads the collections
from that file, so the schemas must be there or be imported into it. A
collection's type comes from its schema through Astro's `CollectionEntry`.

By the convention, `Project` would go to `src/models/`, `RepoNumbers` and
`OgDrawing` to `src/lib/models/`, and `OgElement`, `ImagePost` and
`ImageTheme`, which tests also use, to a `models/` folder at the root. The schemas would go to
`schemas/`. `Project` and `ImageTheme` are derived from values, so their
model files would import back from `src/lib/`.

The convention itself says that a codebase that keeps another way everywhere
wins. The architecture skill says that only an accepted ADR overrides a
convention. This ADR is that record.

## Options considered

- Keep each type in the file that exports its values, and the schemas in
  `src/content.config.ts`: no move; the import names the file that makes the
  value.
- Move them as the convention says: eight moves into four new folders, and
  the derived types import back from `src/lib/`.
- A line in `CLAUDE.md` and no ADR: cheaper, but a line in `CLAUDE.md` does
  not override a conventions skill.

## Decision

We will keep a shared type in the file that exports its values, and export
it from there. We will keep the zod schemas in `src/content.config.ts`. This
replaces the `models/` and `schemas/` rule of
`kalinichenko:typescript-conventions` in this project. Its other rules on
types stay: a one-file type stays in its file, and a type with a schema comes
from the schema.

Look at this again when the values of a type are made in two files, or when
a file that uses the type may not import its producer by the Layers rule (a
file in `src/config/` that needs a type from `src/lib/`). For example, a dark
post image moves `ImageTheme` and `IMAGE_THEMES` together to `og-image.ts`.

## Consequences

Good: a type sits next to the code that makes its values, so a change to
both is one file. `Project` and `ImageTheme` are derived from values, so they
cannot drift from them. No folder holds only types.

Bad: a reader looks for a type in the file that exports its values, not in
one place. An agent that loads the convention and not this ADR will make a
`models/` folder.

## Invariants

I-12, added.

## Confirmation

I-12's `Check:` line finds an import from a `models/` or `schemas/` folder.
Review checks the rest: the import of a shared type names the file that
exports its values.
