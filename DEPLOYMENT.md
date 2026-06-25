# SharpEdge Deployment

SharpEdge is a static Vite app. It can be deployed without paid services, login requirements for judges, wallets, private keys, or TxLINE credentials.

## Build Locally

```bash
npm install
npm test
npm run build
npm audit --audit-level=moderate
```

The production output is generated in `dist/`.

## Environment

Replay mode is the default and requires no secrets.

Optional environment variables are documented in `.env.example`. Do not commit real tokens, private keys, seed phrases, or private sponsor data.

## Vercel

1. Import the public GitHub repo into Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Environment variables: none required for replay mode.
6. Deploy and copy the public URL into `README.md` and `SUBMISSION.md`.

Judges should be able to open the Vercel URL without signing in.

## Netlify

1. Import the public GitHub repo into Netlify.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Environment variables: none required for replay mode.
5. Deploy and copy the public URL into `README.md` and `SUBMISSION.md`.

Judges should be able to open the Netlify URL without signing in.

## GitHub Pages

1. Build locally with `npm run build`.
2. Configure GitHub Pages to publish a static site from a Pages branch or deployment workflow.
3. Use `dist/` as the static artifact.
4. Confirm the deployed app opens directly to the SharpEdge replay console.

If publishing under a subpath, set the Vite `base` option before building.

## Deployment Smoke Check

After deployment, verify:

- first screen shows `SharpEdge odds-shock audit agent`,
- `Odds Shock Radar` is visible without scrolling on desktop,
- `Replay agent incident` runs without credentials,
- Rule Inspector can show `EventMismatchRule` fired and `MomentumShockRule` rejected,
- `Copy JSON` or `Download JSON` produces the redacted synthetic incident,
- browser console has no errors,
- mobile viewport has no horizontal overflow.

## What Not To Add

Do not add:

- real-money flows,
- betting recommendations,
- automated betting,
- trade execution,
- expected-profit or guaranteed-return claims,
- wallet or KYC requirements,
- committed TxLINE tokens,
- raw live TxODDS/TXLINE response dumps.
