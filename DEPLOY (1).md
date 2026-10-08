# Deploying to Cloudflare Pages

Static site — no build step, no server.

## Before you deploy

1. Open `script.js` and set `DOWNLOAD_URL`, `DOCUMENTATION_URL`, `GITHUB_URL` in `CONFIG`. Links stay inert until you do.
2. In `index.html`, replace `CANONICAL_URL` (the `<link rel="canonical">`) with your site URL.
3. Add `assets/ai-context-demo.png` (screenshot) and `assets/og-image.png` (1200×630). Both are optional; the page works without them.
4. For link previews, change the `og:image` / `twitter:image` values to absolute URLs (e.g. `https://your-domain/assets/og-image.png`) — most platforms ignore relative paths.

## Deploy

**Git:** push the folder to a repo → Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
- Framework preset: `None`
- Build command: *(empty)*
- Build output directory: `/` (project root)

**Direct upload:** Workers & Pages → Create → Pages → Upload assets → drop the project folder.

**Wrangler:** `npx wrangler pages deploy . --project-name ai-context`

## Local preview

Open `index.html` directly in a browser.
