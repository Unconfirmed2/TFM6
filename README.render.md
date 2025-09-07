Render + Neon deployment guide

This repository can run a full Node server that connects to a Postgres database (Neon). Use Render to host the server and Neon for the DB.

Quick steps

1. Create Neon Postgres
   - Create a Neon project and database. Copy the connection string (DATABASE_URL).

2. Add `render.yaml` to your repo (already present) or create a new Web Service in the Render dashboard.

3. On Render (UI) or via `render.yaml`, configure the following environment variables/secrets:
   - DATABASE_URL (secret) — Neon connection string
   - URL_ROOT — e.g. https://example.com
   - SERVER_ID (secret) — random strong secret for admin endpoints
   - STATS_ID (secret) — optional secret for stats endpoint
   - NPM_CONFIG_PRODUCTION (secret) — set to `false` to ensure optionalDependencies install during build

4. Deploy
   - Push to `main`. Render will run `npm run build` then `npm start`.

Notes & troubleshooting

- If build fails due to memory or native module compilation, temporarily increase the build instance size in Render or set `NPM_CONFIG_PRODUCTION=false`.
- If your Neon DB rejects connections, check Neon network rules and make sure Render's outbound IPs are allowed (or use Neon connection options that allow cloud services).
- To serve static assets via a CDN, you can also deploy the `build/` folder to Vercel or GitHub Pages and set `URL_ROOT` accordingly.

If you want, I can also:
- Add a tiny `deploy/render.md` with Render CLI commands.
- Add a Dockerfile or `docker-compose.prod.yml` if you'd prefer to run on a VM.
