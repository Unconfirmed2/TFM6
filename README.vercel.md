Quick notes: Deploying to Vercel

This project builds a static front-end into the `build/` directory.

- Vercel will run `npm run build` during deployment.
- The `vercel.json` file sets the static output directory to `build`.

If you want to deploy only the client and skip server compilation, consider adding a lighter `build` script that only runs the client build.

Troubleshooting
- If your deployment fails because of optional native modules (e.g., sqlite3 or pg), consider setting `NPM_CONFIG_PRODUCTION=false` or pruning optionalDependencies in Vercel settings.
- For dynamic server-side features, Vercel Serverless Functions would need separate endpoints; this repo is primarily a static build.
