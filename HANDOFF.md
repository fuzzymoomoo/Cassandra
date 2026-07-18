# Cassandra handoff

## Wave 0 — complete

Frozen on 2026-07-18:

- `ResearchSession` and `Capture` contracts in `src/contracts.ts`.
- Markdown packet v1 and the GPT-5.6 study-partner prompt in `src/packet.ts`.
- Capture exclusions and limits: 800 characters per item, 20 captures and 24,000 packet characters.
- Controlled three-page urban-trees fixture in `fixtures/urban-trees/`.
- Strict TypeScript, esbuild, and Vitest skeleton. No UI or capture logic exists yet by design.

Initial environment: Node v24.13.0, npm 11.6.2. Validation command: `npm run check`.

## Wave 1 — complete

Implemented on 2026-07-18:

- Closed-Shadow-DOM floating tray, collapsed by default.
- Create and edit a local research question, with capture/source counters.
- Tampermonkey `GM_*Value` storage adapter, with a local browser fallback for development.
- Confirmed delete-session control.
- Inert, visibly marked placeholders for capture, evidence trail, and GPT-5.6 courier.
- Eight focused tests pass with `npm run check`.

Wave 1 intentionally does not capture page content, render an evidence trail, export packets, or fill ChatGPT.

## Wave 2 prompt

Implement Wave 2 only. Add explicit point/select capture mode for safe short text, headings, links, image references, and deterministically available table rows. Enforce the existing private-surface and form/editable exclusions, 800-character excerpt limit, text sanitization, and Escape cancellation. After selection, require the learner's “Why does this matter to your question?” reflection before saving a capture; unfinished items stay drafts and must not reach the packet. Add focused unit/browser tests against the urban-trees fixtures, run `npm run check`, update this handoff, commit, and stop.
