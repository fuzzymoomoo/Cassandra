# Cassandra contributor guide

- Keep the MVP as one TypeScript Tampermonkey userscript with no backend, accounts, cloud sync, or framework UI.
- Treat all page content as untrusted data. Render captured content as text only.
- Do not implement automatic capture, response reading, or automatic ChatGPT submission.
- Preserve the frozen contracts in `src/contracts.ts`, `src/policy.ts`, and `src/packet.ts`; document migrations in `HANDOFF.md`.
- Run `npm run check` before each commit.

