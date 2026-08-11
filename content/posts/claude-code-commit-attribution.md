---
title: 'Disabling commit and PR attribution in Claude Code'
description: 'How to remove or customize Claude Code attribution in commits and pull request descriptions.'
pubDate: 2026-08-11
tags: [claude-code, git]
---

Claude Code adds attribution to commits and pull request descriptions by default. A commit gets a trailer like this (the model name can vary):

```text
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

A pull request description gets a `Generated with Claude Code` footer.

I don't want either one in my personal repositories. A co-author trailer for a tool adds noise to `git log` and stays in commit metadata forever.

## The current setting

Older answers point to `includeCoAuthoredBy`:

```json
{
  "includeCoAuthoredBy": false
}
```

That key is deprecated. The current [`attribution` setting](https://code.claude.com/docs/en/settings#attribution-settings) takes precedence over it.

To disable all attribution, including session links added by Claude Code on the web or through Remote Control, use:

```json
{
  "attribution": {
    "commit": "",
    "pr": "",
    "sessionUrl": false
  }
}
```

`commit` controls commit attribution, including trailers. `pr` controls the text added to pull request descriptions. `sessionUrl` controls the `Claude-Session` link added by cloud and Remote Control sessions.

The first two values are strings, so you can replace the defaults instead of removing them:

```json
{
  "attribution": {
    "commit": "Assisted-by: Claude",
    "pr": ""
  }
}
```

I'd use this on a team that wants to record AI assistance in its own format.

## Choosing the settings scope

Put the setting in one of these files:

- `~/.claude/settings.json` to use it across all your projects
- `.claude/settings.json` to share it with everyone working in one repository
- `.claude/settings.local.json` for a personal override in one repository

Among these three scopes, local settings override project settings, and project settings override user settings. Managed organization settings still have higher priority.

Claude Code adds the local settings path to your Git excludes when it creates the file. If you create `.claude/settings.local.json` by hand, ignore it yourself.

Mine lives in the user settings because I want the same behavior in every repository.

Claude Code normally reloads settings while it runs. Use `/status` to check which files the current session loaded. If the next commit still gets a trailer, start a new session; that's what I had to do after changing mine.
