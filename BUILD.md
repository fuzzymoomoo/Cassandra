# Build

## Prerequisites

- Node.js 24.13.0 or later
- npm 11.6.2 or later

## Commands

```powershell
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run build
npm run smoke
npm run check
```

`npm run build` writes the installable userscript to `dist/cassandra.user.js`.
`npm run smoke` exercises the controlled three-page flow in Chromium. `npm run check` runs all unit, trust-boundary, build, and browser checks.
