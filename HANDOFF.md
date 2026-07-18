# Cassandra handoff

## Wave 0 — complete

Frozen on 2026-07-18:

- `ResearchSession` and `Capture` contracts in `src/contracts.ts`.
- Markdown packet v1 and the GPT-5.6 study-partner prompt in `src/packet.ts`.
- Capture exclusions and limits: 800 characters per item, 20 captures and 24,000 packet characters.
- Controlled three-page urban-trees fixture in `fixtures/urban-trees/`.
- Strict TypeScript, esbuild, and Vitest skeleton. No UI or capture logic exists yet by design.

Initial environment: Node v24.13.0, npm 11.6.2. Validation command: `npm run check`.

## Wave 1 prompt

Implement Wave 1 only. Build the Tampermonkey userscript shell with an isolated Shadow DOM floating research tray, research-question session creation/editing, local Tampermonkey storage, and clear/delete session controls. Keep capture controls inert or explicitly marked as coming next; do not implement capture selection, evidence trail, packet export, or ChatGPT composer filling. Add focused tests, run `npm run check`, update this handoff, commit, and stop.

