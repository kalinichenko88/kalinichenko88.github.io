---
title: 'Turning off the Co-Authored-By trailer in Claude Code'
description: 'The attribution setting controls the Claude Code commit trailer and PR footer, and replaces the deprecated includeCoAuthoredBy flag.'
pubDate: 2026-08-11
tags: [claude-code, git]
---

Claude Code signs its work. Every commit it writes gets a trailer:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

And every PR body ends with a "Generated with Claude Code" line. I don't want either one. A co-author trailer for a tool is noise in `git log`, and it shows up in every blame view forever.

Most answers you'll find point at `includeCoAuthoredBy`:

```json
{
  "includeCoAuthoredBy": false
}
```

It still works, but it's deprecated. The current key is `attribution`:

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```

An empty string hides that attribution. `commit` is the git trailer, `pr` is the pull request description. Set one and leave the other alone if you only care about half of it.

These are strings, not booleans, so you can also put your own text there:

```json
{
  "attribution": {
    "commit": "Assisted-by: Claude"
  }
}
```

That's what I'd reach for on a team that wants the provenance recorded, just in its own format.

## Where to put it

There's no toggle for this in `/config`, so it's the settings file or nothing. Three places to choose from:

- `~/.claude/settings.json` for all your projects
- `.claude/settings.json` in the repo, committed, so the whole team gets it
- `.claude/settings.local.json` for this repo and only you, gitignored

Later ones win, so a repo can turn the trailer back on for everybody and you can still override it for yourself.

Mine lives in the user settings. Set it once, forget it exists.

One gotcha: open a new session after you edit the file. In the session I already had running, Claude kept appending the trailer.
