---
title: 'The Best Pull Request Deletes More Than It Adds'
description: 'How Ponytail became a useful cleanup stage in my Claude Code review workflow.'
pubDate: 2026-08-02
tags: [claude-code, ai, code-review, refactoring]
---

A cleanup pass across three of my repositories removed 765 net source lines. On [this site](https://github.com/kalinichenko88/kalinichenko88.github.io) alone it removed 668 lines and three dependencies, and the build dropped from 4.65 seconds to roughly 580 milliseconds.

My rule: **the best pull request deletes more code than it adds without degrading functionality.**

[Ponytail](https://github.com/DietrichGebert/ponytail), a plugin for Claude Code, helps me find those pull requests. It pushes the agent to question complexity and look for the simplest sufficient solution. I run it as a cleanup stage in review.

The cleanup merged on July 19. Six days later I merged a second pull request to fix what it broke.

## Where it fits

I don't merge AI-generated changes straight from the first implementation pass.

Ponytail audits the repository for unnecessary abstractions, duplicated paths, dead code, unused extension points, and custom implementations the platform already covers. Claude Code then traces callers, exports, tests, and configuration before touching anything, and reviews the diff in a separate pass.

Then I read the diff myself. The repo gets the last word: tests, type checking, linting, a production build, and a browser check when UI behavior changes.

## What it found

The clearest result came from this site. Its projects section made a GitHub API request at build time to render three repository URLs, one homepage, and two star counts.

That output required `octokit`, a 94-line content loader, a `GITHUB_TOKEN` in local and CI environments, and a build that could fail on network availability or rate limits.

I moved the data into project YAML and derived repository URLs from slugs. The rendered cards stayed identical. The build stopped touching GitHub, lost three dependencies, and got eight times faster.

The audit also found configuration that looked active but did nothing. Tailwind 4 loads through `@tailwindcss/vite`, which ignores `tailwind.config.js` unless an `@config` directive points at it, so `max-w-prose` had been compiling to Tailwind's default 65ch instead of the 768px the file specified. That config wasn't inert. It was wrong, and it looked authoritative. The PostCSS setup next to it duplicated prefixing and minification the toolchain already did. Four unused utility classes, a shortcuts toast, and a console easter egg went out in the same pass.

The other two repositories gave up less.

[VaultMD](https://github.com/kalinichenko88/vaultmd) lost 37 net lines: a `countOccurrences` helper replaced with a standard-library expression, a hand-written delay duplicating `Bun.sleep`, and a wrapper that only renamed a property. The public API didn't change and all 268 tests stayed green.

[Telegram Agent Kit](https://github.com/kalinichenko88/telegram-agent-kit) lost 60 net lines, mostly extension points with no consumers: lifecycle events nothing subscribed to, an injection seam no caller overrode. One deletion was a deliberate breaking change. "No internal callers" is not enough evidence when an export is public.

## The one I put back

The audit flagged `VideoPlayer.astro` as dead code. Technically it was right: nothing imported it, and there was no video directory.

So I deleted it. Then I put it back in the next commit, before the pull request merged. The audit was right about usage and had no way to know I had video posts queued behind it. I wrote that context into `CLAUDE.md` so the next cleanup pass starts with it instead of rediscovering the same finding.

Static evidence can prove code is unused today. It can't prove the code is unwanted.

## What only the browser caught

Another change moved the site's scroll progress indicator from JavaScript to a CSS scroll-driven animation. The first implementation passed the build, lint, type checks, and formatting, then failed in the browser.

During minification, Lightning CSS folded `animation-timeline` into an `animation` shorthand that browsers rejected outright, silently killing the animation. I wrapped the declaration in `@supports` to preserve it. Every automated layer passed; only the browser disagreed.

## Six days later

Three defects went out with the cleanup anyway.

`isMobileMenuOpen()` reported the menu as open whenever `#mobile-menu` was missing from the page, because `!undefined` is `true`. The inline anti-flash script had theme ids baked in as string literals, so renaming a theme would have broken first paint without a single error. And collapsing `url` and `homepage` into one field cost the featured cards their link to the repository.

None of that is Ponytail's fault. The audit found real dead weight. I moved too fast turning findings into commits.

The follow-up taught me something I didn't expect. Fixing those three defects produced a pull request bigger than the problem it solved, and reviewing my own fix, I cut it back in three places:

- The repo-link fix had grown into a card restructure with a `.stretched-link` utility and reworked markup, for the one project that has a separate homepage. An optional `homepage` field and `homepage ?? url` covered the actual finding.
- The theme ids went through a `JSON.stringify` and `JSON.parse` round trip to move two strings into an attribute. Two data attributes did the same job.
- The audit had called a `$` alias for `getElementById` a pointless wrapper, and I'd deleted it. That made six call sites longer and grew one to three lines. I restored it without the generic parameter nobody had ever supplied.

## Who did what

Ponytail didn't "safely delete 765 lines for me." It made Claude Code more persistent about asking whether those lines needed to exist. Deciding which suggestions fit the project, weighing compatibility costs, reading the diff and verifying the result: that part stayed with me.

I'd install it, with one condition. The fix needs the same skepticism as the finding.

An audit that questions complexity hands you changes, and those changes are new code, written under the assumption that deleting is the virtuous move. Nothing downstream questions their complexity unless you do. Every over-built fix in my follow-up survived the tool, the tests, and the type checker. It died in a self-review.

That changed where I point it. In Telegram Agent Kit I've run the pass four times between July 16 and August 1, and the last two trimmed code from the same branch that had just introduced it: an over-built conditional-rollback path, then a 429 backoff branch carrying more structure than the retry needed. Fresh code is where the audit earns the most. Nobody has rationalized it yet, nothing depends on it, and the person who wrote it still remembers which parts were guesses.

A one-line replacement isn't automatically better than a clear ten-line function, and dropping a compatibility layer can push the cost onto users. The number I care about isn't 765. It's how many concepts, dependencies, and failure modes stopped existing while the behavior I need stayed understandable and verified.
