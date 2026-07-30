---
title: 'The Best Pull Request Deletes More Than It Adds'
description: 'How Ponytail became a useful cleanup stage in my Claude Code review workflow.'
pubDate: 2026-07-30
tags: [claude-code, code-review, refactoring]
---

A cleanup pass across three of my repositories removed **765 net source lines**. On [this site](https://github.com/kalinichenko88/kalinichenko88.github.io) alone, it removed 668 lines and three dependencies, while cutting the build from 4.65 seconds to roughly 580 milliseconds.

I have a simple rule for this: **the best pull request deletes more code than it adds without degrading functionality.**

One tool that helps me find those pull requests is [Ponytail](https://github.com/DietrichGebert/ponytail), a plugin for Claude Code. It pushes the agent to question complexity and look for the simplest sufficient solution. I use it as a cleanup stage in code review.

## Where it fits

I do not merge AI-generated changes straight from the first implementation pass.

Ponytail audits the repository for unnecessary abstractions, duplicated paths, dead code, unused extension points, and custom implementations already covered by the platform. Claude Code then traces callers, exports, tests, and configuration before changing anything, followed by a separate review pass over the diff.

I read the final diff myself. The repository provides the last layer: tests, type checking, linting, a production build, and a browser check when UI behavior changes.

## What it found

The clearest result came from this site. Its projects section made a GitHub API request at build time to render three repository URLs, one homepage, and two star counts.

That small output required `octokit`, a 94-line content loader, a `GITHUB_TOKEN` in local and CI environments, and a build that could fail because of network availability or rate limits.

I moved the data into project YAML and derived repository URLs from slugs. The rendered cards stayed the same. The build stopped touching GitHub, lost three dependencies, and went from 4.65 seconds to roughly 580 milliseconds.

The audit also found configuration that looked active but did nothing. A `tailwind.config.js` was ignored by the Tailwind 4 setup, while the PostCSS configuration duplicated work already handled by the toolchain. Every file looked plausible on its own. The problem became visible only after tracing what the build tools actually consumed and what data reached the rendered output.

The other repositories produced smaller changes.

[VaultMD](https://github.com/kalinichenko88/vaultmd) lost 37 net lines: a `countOccurrences` helper replaced with a standard-library expression, a hand-written delay duplicating `Bun.sleep`, and a wrapper that only renamed a property. Its public API stayed unchanged and all 268 tests remained green.

[Telegram Agent Kit](https://github.com/kalinichenko88/telegram-agent-kit) lost 60 net lines, mostly extension points with no consumers: lifecycle events nothing subscribed to and an injection seam no caller overrode. One deletion was a deliberate breaking change. "No internal callers" is not enough evidence when an export is public.

## What I rejected

The audit flagged `VideoPlayer.astro` as dead code. Technically, it was right: the component had no current usages and there was no video directory.

I kept it because it is intended for upcoming posts. I also documented that decision in `CLAUDE.md`, so the next cleanup pass has the missing context instead of rediscovering the same finding. Static evidence can prove that code is unused today. It cannot prove that the code is unwanted.

## What verification caught

Another change moved the site's scroll progress indicator from JavaScript to a CSS scroll-driven animation. The first implementation passed the build, lint, type checks, and formatting, but failed in the browser.

During minification, Lightning CSS folded `animation-timeline` into an `animation` shorthand that browsers rejected. An `@supports` wrapper was needed to preserve the declaration. Every automated layer passed. Only the browser disagreed.

## The principle

Ponytail did not "safely delete 765 lines for me." It made Claude Code more persistent about asking whether those lines needed to exist. Claude Code traced usages, implemented focused changes, and reviewed the resulting diffs.

The responsibility stayed with me: decide which suggestions matched the project, check compatibility costs, review the diff, and verify the result.

A one-line replacement is not automatically better than a clear ten-line function, and removing a compatibility layer can move costs onto users. What matters is whether unnecessary concepts, dependencies, and failure modes disappeared while the required behavior remained understandable and verified.
