---
name: illustrate-post
description: Use when a blog post in this repo (kalinichenko.dev) needs a cover illustration - a new post from create-post, a post without `cover:` in its frontmatter, or a request to redo a post's cover.
---

# illustrate-post

## Overview

Every post has a hand-drawn cover: a loose pencil sketch of one metaphor
object, white-filled, greyscale with one terracotta accent, on a transparent
background. Codex generates three variants with its built-in `image_gen` tool,
`prepare.mjs` gates, normalizes and compresses them, and the author picks one.
The rules for how covers are shown live in `DESIGN.md` (Illustrations).

Input: one post id, the file name in `content/posts/` without the extension.

## Never look at a raw variant

Generated PNGs keep RGB data under fully transparent pixels. A viewer that
drops the alpha, including the Read tool, shows a black background with a
bright halo. Look only at the `*.light.png` / `*.dark.png` / `sheet.png` files
`prepare.mjs` writes, and attach only flattened images to Codex.

## Workflow

1. **Metaphors.** Read the post. Propose 3 distinct visual metaphors, one or
   two sentences each: concrete physical objects, no people, no text, no logos
   or brand marks (most posts are about named tools: show the idea, not the
   product).
2. **Run directory.** `RUN="<scratchpad>/illustrate-<post-id>-$(date +%s)"`,
   created fresh every run. Never reuse one.
3. **References.** For each reference cover listed under _References_ below,
   unless it is this post's own current cover, flatten it into the run
   directory:

   ```bash
   node -e "import('sharp').then(({default: s}) => s(process.argv[1]).flatten({ background: '#f4f2ee' }).toFile(process.argv[2]))" \
     src/assets/images/covers/<ref-id>.png "$RUN/ref-1.png"
   ```

4. **Generate.** Write each prompt (template below) to `$RUN/prompt-N.txt`,
   then run the 3 generations in parallel, each as its own background command
   with a timeout of at least 300000 ms:

   ```bash
   codex exec --skip-git-repo-check --ephemeral -C "$RUN" -s workspace-write \
     -i "$RUN/ref-1.png" -i "$RUN/ref-2.png" < "$RUN/prompt-N.txt"
   ```

   The prompt goes on stdin, never as an argument: `-i` takes several files,
   so a prompt after it is read as one more image path and Codex exits 1 with
   "No prompt provided via stdin". Drop the `-i` flags and the _Input images_
   line when there are no references. A variant is generated only if its
   command exited 0 and `$RUN/variant-N.png` exists.

5. **Partial failure.** Retry a failed variant once. If all three fail, use
   the fallback.
6. **Prepare.** `node .claude/skills/illustrate-post/prepare.mjs "$RUN"`. A
   variant rejected for transparency is regenerated once and dropped if it
   fails again. A duplicate is regenerated.
7. **Self-check by eye,** on `variant-N.light.png` and `variant-N.dark.png`:
   every object white-filled, terracotta is the only chromatic accent and
   covers one or two small elements, no text or letters, no logos or brand
   marks, no people, no glow or halo, nothing cut at the edges. A failure is a
   warning, not a gate: name it next to the variant.
8. **Pick.** `open "$RUN/sheet.png"`, list each variant's metaphor and
   warnings in chat, and ask the author for one of: a number, "3 new
   metaphors", or a revision ("2, but drop the gear").
9. **Revise.** Write the revision prompt to the next free number
   (`$RUN/prompt-4.txt`, ...) and run it as in step 4 with
   `-i "$RUN/variant-N.light.png"` as the only image, then go back to step 6.
   The sheet then shows the revision next to the original.
10. **Save.**

    ```bash
    cp "$RUN/variant-N.cover.png" src/assets/images/covers/<post-id>.png
    ```

    Set `cover: ../../src/assets/images/covers/<post-id>.png` in the post's
    frontmatter, after `tags:`. If a `cover:` line exists, replace it; a post
    has exactly one. Then run `npm test`.

## Prompt template

```text
Use the built-in image_gen tool to generate ONE image with a genuinely transparent background (preserve the alpha channel), then copy the generated file to variant-<N>.png in the current directory. Do not edit any other file. Reply with only the absolute path of the file.

Input images: the attached images are style references only. Match their line, shading and palette. Do not copy their subject or composition. The output background must be transparent even though the references are shown on a light background.

Use case: illustration-story
Asset type: blog post cover illustration
Subject: <the metaphor>

<style block>
```

Revision prompt:

```text
Use the built-in image_gen tool to edit the attached image, which is the edit target: <the one change>. Keep everything else unchanged: subject, composition, line, shading and palette. The output must have a genuinely transparent background (preserve the alpha channel); the light background of the attached image is not part of the drawing. Copy the result to variant-<N>.png in the current directory. Do not edit any other file. Reply with only the absolute path of the file.
```

## Style block

```text
Style/medium: quick, loose hand-drawn sketch made with a digital pencil. Light
confident ink line with visible imperfect strokes, minimal soft grey shading
only in a few places. Every object is filled with flat white paper color, never
a hollow outline. Sketchbook study, not a finished rendering. Fewer details
rather than more.
Subject rules: concrete physical objects only. No people, no text, no letters,
no logos or brand marks.
Composition/framing: one compact object group, centered, nothing cut at the
edges. No ground plane, no cast shadow, no glow or halo.
Color palette: greyscale ink and graphite; terracotta #c25a34 is the only
chromatic accent, on one or two small elements only.
Constraints: genuinely transparent background (preserve the alpha channel),
landscape 3:2 (1536x1024), no frame, no border, no watermark.
```

There is no margin rule: `prepare.mjs` sets the margin, so never reject a
variant for its framing.

## References

References: none yet

## Fallback

If `codex` is missing (`codex login status` fails) or all three variants fail,
show the author the three `$RUN/prompt-N.txt` files to generate in ChatGPT by
hand (without the first paragraph, which is addressed to Codex),
wait for them to save the files as `$RUN/variant-1.png` to `variant-3.png`,
then continue from step 6. `prepare.mjs` rejects a file with an opaque
background, and `tests/post-covers.test.ts` rejects one that skipped it.
