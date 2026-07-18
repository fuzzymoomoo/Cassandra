# Cassandra

![Cassandra logo](spec/cassandra-logo-transparent.png)

> **Don't just be right. Bring the evidence.**
>
> Browse first. Ask better.

Cassandra is a local-first Tampermonkey research companion for learners. It helps you deliberately collect short, referenced evidence, explain why each finding matters, compare sources, and prepare a source-grounded packet for GPT-5.6.

## What it does

1. Start with a research question.
2. Select text or point to a paragraph, heading, link, image reference, or table row.
3. Add the required “Why does this matter?” reflection.
4. Review the source-grouped evidence trail and its diversity warnings.
5. Preview/export the Markdown packet or fill a ChatGPT composer.
6. Review the prompt and click Send manually.

Sessions stay in Tampermonkey storage. JSON backup/restore and Markdown export happen only when the learner explicitly requests them. Cassandra never gathers a full page, submits a prompt, reads an AI response, or uses a backend.

## Install and develop

```powershell
npm install
npx playwright install chromium
npm run check
```

Install [dist/cassandra.user.js](dist/cassandra.user.js) in Tampermonkey after `npm run build`. See [BUILD.md](BUILD.md) for individual commands.

## Privacy and trust boundary

- Capture requires an explicit learner action and stops after one item or Escape.
- Password/authentication pages, form/editable content, hidden text, private-account hosts, localhost, and non-HTTP pages are excluded.
- Page content is rendered as text and labelled as untrusted evidence in the GPT prompt.
- Excerpts are capped at 800 characters; packets are capped at 20 ready captures and 24,000 characters.
- The courier only writes to a visible ChatGPT composer. It never clicks Send or inspects output.
- Imported backups are structure- and URL-validated before storage or rendering.

The full boundary is documented in [SECURITY.md](SECURITY.md). The 90-second Build Week walkthrough is in [DEMO.md](DEMO.md).

## Status

Wave 4 is complete. The controlled three-source scenario, private-surface exclusion, and input-only courier are covered by Chromium smoke tests.
