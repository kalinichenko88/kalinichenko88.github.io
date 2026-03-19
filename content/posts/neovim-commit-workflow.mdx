---
title: Generating commit messages with Copilot in Neovim
description: A Neovim setup that uses Copilot Chat to generate commit messages with the right format, branch name, and project rules.
pubDate: 2026-02-16
tags: [neovim, ai, git, tooling]
---

I use GitHub Copilot in Neovim for code completion, but I also built a commit message generator on top of [CopilotChat.nvim](https://github.com/CopilotC-Nvim/CopilotChat.nvim). It reads the staged diff, grabs the branch name, loads project-specific rules, and asks Copilot to write the message. I've been using it for a while and it gets the format right every time.

## What was wrong with other tools

I tried Cursor IDE and VS Code + Copilot for commit message generation before. Both had the same problem — they'd ignore the format I needed. At work, commit messages look like this:

```
fix: ABC-123 message about this commit
```

`ABC-123` is the ticket number from the task tracker, and it matches the branch name. Simple format, but these tools kept getting it wrong. They'd make up ticket numbers, skip the prefix, or just write "update files".

## Passing branch and rules into the prompt

The fix is simple — don't rely on the AI to figure out the context. Read the branch name, read the rules, and put both in the prompt.

From my [dotfiles](https://github.com/kalinichenko88/dotfiles/tree/main/nvim/lua/plugins/copilot-chat):

```lua
local staged_diff = vim.fn.system('git diff --cached')
local rules = utils.get_commit_rules()
local branch = utils.get_branch_name()

local prompt = 'Write a concise commit message for the following staged changes. '
  .. 'Return ONLY the commit message, no explanation or markdown formatting.\n\n'
  .. 'Current branch: '
  .. (branch or 'unknown')
  .. '\n\nRules:\n'
  .. rules
  .. '\n\n'
  .. diff_section
```

The branch name and rules are right there in the prompt. Copilot doesn't have to guess anything.

## Large diffs

If you stage a lot of files, the diff can get huge and blow up the context window. The setup handles this — when the diff is over 15,000 characters, it sends `git diff --cached --stat` (a summary of changed files and line counts) plus a truncated version of the diff instead of the full thing:

````lua
local max_diff_len = 15000
if #staged_diff > max_diff_len then
  local stat = vim.fn.system('git diff --cached --stat')
  diff_section = 'Diff stat (full diff too large):\n```\n'
    .. stat
    .. '```\n\nTruncated diff:\n```diff\n'
    .. staged_diff:sub(1, max_diff_len)
    .. '\n... (truncated)\n```'
end
````

Copilot still gets enough context from the stat and the first chunk of the diff to write a good message.

## Per-project commit rules

The setup looks for a `.commit-rules` file in the project root:

```lua
function M.get_commit_rules()
  local file = io.open(vim.fn.getcwd() .. '/.commit-rules', 'r')
  if file then
    local content = file:read('*all')
    file:close()
    return content
  end
  return [[
- Use conventional commits: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore
- Keep subject under 72 characters
- Use imperative mood
]]
end
```

No `.commit-rules` file — it falls back to conventional commits. For work projects I add a file like this:

```
- Format: type: TICKET-NUMBER description
- Extract TICKET-NUMBER from the branch name (e.g., feature/ABC-123-some-feature -> ABC-123)
- Types: feat, fix, docs, style, refactor, test, chore
- Keep subject under 72 characters
- Use imperative mood
```

## Confirmation window

After Copilot generates the message, a floating window shows the staged files and the result:

```
  Staged Files:
    src/components/Header.astro
    src/styles/global.css

  Commit Message:
    fix: ABC-123 update header styles for mobile breakpoint

  ─────────────────────────────────────
  <CR> Commit    <e> Edit    <q> Cancel
```

Enter to commit, `e` to edit, `q` to cancel. If I edit, it opens a small buffer — `Ctrl+S` to commit from there, `Esc` to cancel.

## Keybinding

```lua
keys = {
  { '<leader>cc', '<cmd>CopilotChat<cr>', desc = 'Copilot Chat' },
  { '<leader>cm', '<cmd>GitCommit<cr>', desc = 'Generate commit message' },
}
```

Stage changes, `<leader>cm`, review, Enter.

The full implementation is in my [dotfiles repo](https://github.com/kalinichenko88/dotfiles/tree/main/nvim/lua/plugins/copilot-chat).
