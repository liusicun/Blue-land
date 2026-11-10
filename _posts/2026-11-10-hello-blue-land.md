---
title: Hello, Blue Land
date: 2026-11-10 16:30:00 +0800
tags: [Notes, Meta]
image: /assets/og/2026-11-10-hello-blue-land.png
---

This is the first post on Blue Land, and a small guide to writing the next one.

## Writing a new post

1. Add a file to the `_posts` folder, named like this:

   ```
   year-month-day-short-name.md
   ```

   For example `2026-11-12-yunnan-day-1.md`. Use only letters, numbers and hyphens in the short name. It becomes part of the address.

2. Start the file with a few lines of front matter between two `---` lines:

   ```yaml
   ---
   title: Post title
   date: 2026-11-12 20:00:00 +0800
   tags: [Travel, Yunnan]
   ---
   ```

   For a post in Chinese, add a line `lang: zh`.

3. Write the post below it in Markdown:

   - `## Heading`
   - `**bold**`, `*italic*`
   - `[link text](https://example.com)`
   - {% raw %}`![image caption]({{ '/assets/images/photo.jpg' | relative_url }})`{% endraw %} (images go in `assets/images`)
   - `[^1]` for a note, with `[^1]: the note` at the end. It shows beside the text on wide screens.
   - Start a line with `>` for a quote

4. Save and commit to GitHub. The site updates itself a minute or two later.

## Drafts

Unfinished posts go in the `_drafts` folder (no date in the file name). They stay off the site until you move them to `_posts`.

> The posts page and the tags update on their own. Nothing else needs changing.
