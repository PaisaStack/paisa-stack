# Paisa Stack — CMS Setup (Read This First)

## What changed

Your site now has two parts:

1. **`static/`** — everything unchanged: homepage, calculators, ebooks, trackers, legal pages. Copied straight through, byte-for-byte the same as before.
2. **`src/blogs/*.md`** — your 11 existing blog posts, converted from standalone HTML files into content files. A shared template (`src/_includes/blog-layout.njk`) now generates the actual page around each one — same visual design, just built from data instead of copy-pasted HTML each time.

A build step (Eleventy) combines these into the final site. This is what `netlify.toml` tells Netlify to run automatically.

## This is going to a TEST branch, not your live site

Nothing here touches `paisastack.com` yet. Follow these steps exactly:

### Step 1 — Create a new branch

In GitHub Desktop:
1. Top bar → **Current Branch** → **New Branch**
2. Name it exactly: `cms-test`
3. Make sure it says "Based on: main"

### Step 2 — Replace your local repo folder contents

1. Open your repo folder (Show in Explorer, same as before)
2. **Delete everything** currently there (except the hidden `.git` folder — don't touch that)
3. Copy in **everything from this package** — `static/`, `src/`, `admin/`, `.eleventy.js`, `package.json`, `netlify.toml`

### Step 3 — Commit and push to the TEST branch

1. GitHub Desktop should show a big changeset
2. Commit message: `"Add Eleventy + CMS setup (test)"`
3. **Important**: before pushing, confirm the branch selector at the top still says `cms-test`, not `main`
4. Click **Publish branch** (since this is a new branch's first push)

### Step 4 — Check the build on Netlify

1. Netlify → your site → **Deploys**
2. You should see a new deploy triggered for the `cms-test` branch (not "Production")
3. Click into it, watch the build log
4. **If it says "Published"** — great, click the preview URL it gives you and check the site looks right, especially a couple of blog posts
5. **If it says "Failed"** — click in, copy the error text from the log, and send it to me. This is expected to possibly happen on the first try since I couldn't test this build myself before handing it to you — I'll fix whatever it flags.

### Step 5 — Only after Step 4 succeeds

Once the `cms-test` branch builds successfully and the preview looks right, tell me — we'll then merge it into `main` together, which is what actually makes it live and turns on the CMS at `paisastack.com/admin`.

**Do not merge to `main` yourself before confirming with me that the preview looked correct.**

## Using the CMS (once live on main)

1. Go to `paisastack.com/admin`
2. Log in with the email you invited via Netlify Identity
3. Click **New Blog Posts**
4. Fill in the fields — title, description, category, body, FAQs
5. **Leave "Draft" checked** while writing
6. Save — this creates a pull request behind the scenes (the editorial workflow), it does NOT go live yet
7. When ready to publish for real, uncheck Draft and click **Publish**

## A note on the body editor

The "Body Content" field is a markdown editor, but your existing posts use some custom HTML (tables, the teal calculator-link cards, colored callout boxes) that a plain markdown editor won't have buttons for. Use the **code/HTML view** toggle in the editor toolbar to paste those elements directly — I'd recommend keeping a small file of "snippets to copy" (a table template, a tool-card template, a callout template) handy for this. I can put that together once the CMS is confirmed working.
