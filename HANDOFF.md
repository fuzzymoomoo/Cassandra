# Cassandra handoff

Initial environment: Node v24.13.0, npm 11.6.2. Validation command: `npm run check`.

## Wave 0 — complete

Frozen data contracts, safety limits/exclusions, Markdown packet v1, GPT-5.6 study-partner prompt, controlled urban-trees fixtures, and strict TypeScript/esbuild/Vitest skeleton.

## Wave 1 — complete

Implemented a closed-Shadow-DOM floating tray, local research-question session creation/editing, Tampermonkey-backed local storage, and confirmed session deletion. Capture, trail, and courier controls remained unavailable.

## Wave 2 — complete

Implemented on 2026-07-18:

- Explicit point/select capture mode with Escape cancellation.
- Safe short capture types: text, headings, links, image references, and table rows with deterministic headers.
- Private/local-host and form/editable exclusions, text sanitization, and the frozen 800-character limit with a truncation marker.
- Persisted blank-reflection drafts; the required learner reflection is needed before eligibility for the research packet.
- Fixture-based capture tests. `npm run check` passes 14 tests.

Wave 2 intentionally does not add an evidence trail, export, or ChatGPT composer filling.

## Wave 3 — complete

Implemented on 2026-07-18:

- Evidence trail grouped by source ID with source links/metadata, learner notes, edit, remove, and reorder controls.
- Non-blocking one-domain and missing-metadata warnings.
- Markdown packet preview/export plus JSON backup/restore.
- GPT-5.6 input-only courier: fill a visible composer when present, otherwise copy the prompt. It never sends or reads a response.
- Packet generation continues to enforce the frozen 20-capture and 24,000-character limits.
- `npm run check` passes 18 tests.

## Wave 4 prompt

Implement Wave 4 only. Review privacy and trust boundaries end-to-end, add browser smoke coverage across the controlled three-page fixture, verify that capture remains disabled on private surfaces and that the courier cannot send or read output, then polish README and Build Week submission/demo materials. Run `npm run check`, update this handoff, commit, and stop.
