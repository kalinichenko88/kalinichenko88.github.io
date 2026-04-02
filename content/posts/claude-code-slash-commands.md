---
title: 'Automating monorepo tasks with Claude Code slash commands'
description: 'Using Claude Code custom commands to replace manual dependency updates and tool upgrades in a monorepo.'
pubDate: 2026-04-02
tags: [claude-code, ai, tooling, automation]
---

I work in a monorepo at my day job. There are always maintenance tasks — updating dependencies, upgrading internal tools, syncing configs across packages. None of it is hard, but it's tedious enough that I'd either put it off or spend an afternoon writing a bash script that I'd need to fix next month.

Claude Code has [custom slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands). You put a markdown file in `.claude/commands/`, and it becomes a `/command` you can run from the prompt. The file is a set of instructions that Claude follows interactively — steps, rules, edge cases, all in plain English. I've been writing these for routine tasks and it covers a lot of what I'd otherwise script by hand.

## Dependency updates

The first command I wrote handles dependency updates across the monorepo. It lives at `.claude/commands/app.update-dependencies.md` and supports three modes depending on what you type:

- No arguments — overview of everything outdated
- A package name — deep analysis of that specific package
- A question — "can we update typescript to 6?"

Claude detects the mode from your input:

```markdown
## Detect Mode

Parse the user input to determine one of three modes:

1. **Overview mode** — input is empty or blank → go to "Mode 1"
2. **Single package mode** — input is a single package name → go to "Mode 2"
3. **Question mode** — input contains a question or version reference → go to "Mode 3"
```

For the overview, Claude runs `pnpm outdated --recursive`, classifies each package by risk level (patch/minor/major), checks peer dependency constraints and ecosystem group rules (all `@nestjs/*` packages must be on the same major, for example), and prints a report. Then it asks what to apply and runs `pnpm update` for the selected packages. After that — `make typecheck` to make sure nothing broke.

The single-package mode goes deeper. It checks peer dependency ceilings, group constraints, and looks up changelogs for breaking changes.

The command frontmatter lets you pick the model and add a description:

```yaml
---
description: Check and update project dependencies.
model: claude-sonnet-4-6
---
```

Sonnet is fast enough for this and cheaper than Opus. The `description` shows up when you list available commands.

## Updating Spec-Kit

The second command updates [Spec-Kit](https://github.com/github/spec-kit), a project specification tool from GitHub. This one is trickier because I've customized some of the files Spec-Kit ships — added extra steps to commands, tweaked scripts for our workflow. A simple file copy would overwrite my changes.

The slash command handles this by classifying files into two groups:

```markdown
**Archive files** (come from the zip):

- `.claude/commands/speckit.*.md` — core spec-kit commands
- `.specify/scripts/bash/*.sh` — helper shell scripts
- `.specify/templates/*.md` — document templates

**Local-only files** (NOT in the archive — DO NOT TOUCH):

- `.claude/commands/app.*.md` — project commands
- `.specify/extensions/` — extension directory
- `.specify/memory/` — project memory
```

For files that exist in both the archive and locally, it does an intelligent merge:

```markdown
a. **Identify upstream changes**: What did spec-kit change?
b. **Identify local customizations**: What did we add/modify?
c. **Merge intelligently**:

- Start with the NEW upstream version as the base
- Re-apply our local customizations on top
- If a conflict exists, keep both and ask the user
```

Writing this as a bash script would mean implementing a three-way merge with interactive conflict resolution. That's a whole project. In a slash command, I describe the rules and Claude handles it.

## Slash commands vs. scripts

A bash script for the dependency updater would be hundreds of lines of `jq` pipes and conditionals. It would also break whenever `pnpm outdated` changes its output format.

Slash commands don't have that problem. Claude reads the actual output and adapts. If a tool changes its JSON structure, the command still works. If I need to handle a new edge case, I add a sentence to the markdown file.

It's slower than a script and costs tokens. For tasks I run once a week, I don't care.
