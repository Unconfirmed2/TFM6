Vercel environment variables for Terraforming Mars (minimal)

This trimmed file contains only the bare-minimum environment variables useful for a static Vercel deployment. Discord/OAuth and other server-only variables have been omitted.

Notes
- Set these in the Vercel dashboard (Project → Settings → Environment Variables) or via the Vercel CLI with `vercel env add`.
- Scope: Production = production deployments; Preview = preview (pull request) deployments; Development = local `vercel dev` runs.

Variables (minimal)

- URL_ROOT
  - Description: Root URL of the site used for redirects and canonical links. Example: https://example.com
  - Vercel name: URL_ROOT
  - Scope: Production
  - Secret: No

- ASSET_CACHE_MAX_AGE
  - Description: Seconds to instruct browsers to cache assets (fonts, CSS, images).
  - Vercel name: ASSET_CACHE_MAX_AGE
  - Scope: Production / Preview
  - Secret: No

Notes on advanced setups

- Database / server features: If you later enable server-side features or an external database, you'll need to add DB credentials (e.g., `DATABASE_URL`) and possibly admin secrets like `SERVER_ID` and `STATS_ID`.
- Discord / OAuth: OAuth variables (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`) were removed since they're not needed for a static deployment.

Setting variables via Vercel CLI (examples)

```bash
# set a production variable
vercel env add URL_ROOT production

# set a preview variable
vercel env add ASSET_CACHE_MAX_AGE preview
```

If you'd like, I can add a `build:vercel` script that only builds client assets (skip server TypeScript compile) or add a post-build step to copy `build/` to `public/` to match Vercel defaults.
