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

## Wave 3 prompt

Implement Wave 3 only. Add the evidence trail grouped by source with source IDs, source metadata, learner notes, edit/remove/open-source/reorder actions, and non-blocking source-diversity/metadata warnings. Add Markdown packet preview and export, JSON backup/restore, and the GPT-5.6 prompt courier that fills a ChatGPT composer without sending or reading any response; Copy prompt must be the permanent fallback. Enforce the existing 20-capture and 24,000-character limits before generation. Add focused tests, run `npm run check`, update this handoff, commit, and stop.
