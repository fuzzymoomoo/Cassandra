# Security and privacy boundary

Cassandra is a local userscript, not a browsing agent. Its only page-reading operation begins after the learner clicks **Capture something**, ends after one deliberate selection or Escape, and produces a short plain-text excerpt.

## Never captured

- password, input, textarea, select, button, textbox, and editable content;
- hidden, script, style, template, and `aria-hidden` content;
- authentication routes and pages containing password controls;
- localhost, email, messaging, cloud-drive, banking, and health/private-account surfaces;
- extension pages or other non-HTTP(S) documents.

## Untrusted inputs

Page excerpts and restored backups are untrusted. Captured material is normalized, length-limited, and inserted into UI as escaped text. Backup capture IDs, enum values, URLs, and required fields are validated. The GPT contract explicitly treats packet content as quoted evidence rather than instructions.

## GPT boundary

The courier recognizes a visible ChatGPT composer, writes the generated prompt, emits normal input/change events, focuses the composer, and stops. It contains no send-button action and no response/output query. Copying the prompt remains the permanent fallback.

## Local data

The active session is stored under `cassandra.active-session.v1` with Tampermonkey storage. Delete session clears that value. Backup and export downloads happen only after explicit button clicks.
