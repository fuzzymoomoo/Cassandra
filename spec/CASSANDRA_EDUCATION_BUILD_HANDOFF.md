# Cassandra — Education build handoff

**Byline:** Don't just be right. Bring the evidence.  
**Product mantra:** Browse first. Ask better.

**Category:** Education  
**Build shape:** One Tampermonkey userscript, one repository, no backend required for the MVP  
**Core belief:** AI should help learners reason over evidence they deliberately gathered, not replace the act of looking.

> **Working name locked: Cassandra.** Complete trademark and company-name clearance before public release.

**Name story:** In Greek mythology, Cassandra could foresee the truth but was cursed never to be believed. This Cassandra helps learners avoid that fate by collecting the sources and reasoning behind what they know before asking AI to help synthesize it.

---

## 1. The project in one sentence

Cassandra follows a learner as they browse, lets them deliberately capture small referenced pieces of evidence and explain why each matters, then assembles those findings into a source-grounded Markdown research packet that can be placed into a GPT-5.6 prompt.

## 2. Why this is a separate Build Week entry

Hydra Studio is a developer tool for visually grounded source-code modification. Cassandra is an education tool for active research, source awareness, reflection, and AI-assisted synthesis. It must have its own repository, code, visual identity, demo, README, and Codex session evidence.

The [Build Week Official Rules](https://openai.devpost.com/rules) permit multiple submissions when each is unique and substantially different. The rules describe Education projects as those that push AI forward for students, teachers, or educational organizations. Cassandra fits because its essential interaction is learner-led inquiry before AI use.

## 3. The learning loop

1. The learner writes a research goal or question.
2. They browse the web normally.
3. They activate Cassandra and point to or select a useful page item.
4. Cassandra records a short excerpt plus its source details.
5. The learner must add **Why this matters to my question**.
6. They repeat across several sources.
7. Cassandra shows the evidence trail and missing-source warnings.
8. **Chat with GPT-5.6** assembles a Markdown research packet and fills the ChatGPT composer.
9. The learner reviews and submits the prompt manually.
10. GPT-5.6 synthesizes, identifies gaps and conflicts, and cites the supplied source IDs.

The product's memorable loop is:

**find → mark → explain → compare → ask**

## 4. MVP experience

### 4.1 Floating research tray

The userscript renders a small, isolated tray using Shadow DOM. It remains collapsed while browsing and shows:

- current research-question title;
- capture count and source count;
- **Capture something**;
- **Open evidence trail**;
- **Chat with GPT-5.6**.

The script never captures automatically. Capture mode starts only after a user action, highlights the current candidate, and ends after selection or Escape.

### 4.2 What can be captured

MVP capture types:

- selected text or one paragraph;
- heading;
- link with visible label;
- image reference containing page URL, image URL, caption/alt text, and user note—but not image bytes;
- one table row, with column headings when deterministically available.

Do not copy complete articles, complete pages, paywalled material, or large selections. Default text limit: 800 characters per item, with a clear truncation indicator. This protects focus, prompt size, privacy, and copyright.

### 4.3 Required reflection

Every capture opens a small card requiring:

- **Why does this matter to your question?**

Optional prompts:

- What does this support or challenge?
- What would make you trust this source more?
- What should you investigate next?

An item without the required reflection remains a draft and is excluded from the GPT packet.

### 4.4 Evidence trail

The trail groups captures by source and shows:

- numbered source ID such as `S1`;
- page title and canonical URL;
- author and publication date when plainly available;
- capture timestamp;
- quoted excerpt separated from the learner's note;
- source-type label chosen by the learner: primary, secondary, reference, opinion, or unknown;
- edit, remove, open source, and reorder actions.

Cassandra may warn—not block—when all evidence comes from one domain or when publication/author information is missing.

## 5. Data contract

```ts
interface ResearchSession {
  id: string;
  title: string;
  researchQuestion: string;
  createdAt: string;
  updatedAt: string;
  captures: Capture[];
}

interface Capture {
  id: string;
  sourceId: string;
  kind: "text" | "heading" | "link" | "image-reference" | "table-row";
  excerpt: string;
  relevanceNote: string;
  followUpQuestion?: string;
  sourceType: "primary" | "secondary" | "reference" | "opinion" | "unknown";
  source: {
    url: string;
    canonicalUrl?: string;
    title: string;
    author?: string;
    publishedAt?: string;
    capturedAt: string;
  };
  locator?: {
    textFragment?: string;
    selectorHint?: string;
  };
}
```

Store sessions locally with Tampermonkey storage for the MVP. Provide JSON backup/restore and Markdown export. Never sync or transmit a session until the learner deliberately chooses an export or GPT action.

## 6. Markdown research packet

The generated packet is human-readable and can also be saved as `cassandra-research-packet.md`.

```markdown
<!-- CASSANDRA RESEARCH PACKET v1 -->
# Research question

...

# Learner goal

...

# Evidence

## [S1] Page title
- Source: https://example.com/page
- Source type: secondary
- Captured: 2026-07-18T12:00:00Z
- Evidence: “Short learner-selected excerpt.”
- Why it matters: Learner-written relevance note.
- Follow-up: Optional learner question.

# Source list

1. [S1] Page title — https://example.com/page
```

Before generation, show the item count, source count, character estimate, and any single-domain warning. Cap the injected packet at 20 captures and 24,000 characters for the MVP; ask the learner to remove or split material rather than silently dropping it.

## 7. GPT-5.6 prompt contract

The prompt begins with:

```text
Act as a study partner, not a replacement for research.

Use the Cassandra packet below to help with the learner's stated goal.
- Distinguish source evidence, learner notes, and your own inferences.
- Cite supplied claims with their source IDs, for example [S1].
- Do not invent sources or claim to have opened the linked pages.
- Identify disagreements, weak evidence, and unanswered questions.
- Explain the result at an appropriate learning level.
- End with three useful next research steps or checking questions.

CASSANDRA PACKET FOLLOWS
```

The userscript may fill this text into a ChatGPT composer but must stop there:

- the learner reviews and clicks Send;
- the script does not read responses;
- the script does not detect completion;
- the script does not copy, download, or relay Output;
- if composer filling breaks, **Copy prompt** is the permanent fallback.

The demo must visibly use GPT-5.6. Keep the exact model label and the manual Send action on screen. The official Responses API can be a later transport, but it is not required for this small input-only MVP.

## 8. Privacy, safety, and source integrity

- Never capture password fields, text inputs, textareas, editable regions, form values, authentication pages, or browser-extension pages.
- Disable capture by default on localhost admin panels, banking, health portals, email, messaging, cloud drives, and other private-account surfaces; allow no bypass in the Build Week build.
- Capture only after an explicit click or selection.
- Sanitize all captured text and render it as text, never raw HTML.
- Strip scripts, event handlers, invisible text, and page-supplied instructions.
- Treat collected page text as untrusted evidence, not instructions to Cassandra or GPT.
- Keep quotes short and retain their URL reference.
- Make delete-session and clear-all-data actions obvious.
- Do not score a learner, diagnose ability, or present GPT synthesis as authoritative.

## 9. Recommended implementation

```text
cassandra/
  AGENTS.md
  BUILD.md
  HANDOFF.md
  README.md
  package.json
  src/
    userscript.ts
    capture/
    citations/
    packet/
    storage/
    ui/
    gpt-courier/
  tests/
  fixtures/
  dist/cassandra.user.js
```

Recommended stack:

- TypeScript in strict mode;
- esbuild producing one installable `.user.js`;
- Shadow DOM and small hand-written UI to keep the bundle and build small;
- Tampermonkey `GM_getValue`, `GM_setValue`, and menu commands;
- Vitest with jsdom for unit tests;
- Playwright for a controlled multi-page research fixture and composer-fill smoke test.

Do not add React, a backend, accounts, cloud sync, vector search, or a database for the MVP.

## 10. Cap-conscious build waves

| Wave | Deliverable | Codex model | Thinking |
|---|---|---|---|
| 0 | Freeze schema, prompt contract, safety rules, fixtures | GPT-5.6 Terra | Low |
| 1 | Userscript shell, Shadow DOM tray, sessions and storage | GPT-5.6 Terra | Medium |
| 2 | Point/select capture, references, reflection cards | GPT-5.6 Terra | Medium |
| 3 | Evidence trail, Markdown packet, export and prompt courier | GPT-5.6 Terra | Medium |
| 4 | Privacy/security tests, browser smoke, submission polish | GPT-5.6 Sol | High once; Terra/medium for fixes |

Rules for conserving cap:

- one Codex thread and one wave per prompt;
- no subagents unless explicitly authorized;
- each wave ends with tests, a small commit, and updated `HANDOFF.md`;
- use Sol/high only for the final trust-boundary review or a compact failure capsule;
- no model call is needed for ordinary capture, citation, storage, or packet generation.

## 11. Acceptance scenario

On a controlled three-page educational fixture:

1. Create the question: “How do urban trees affect summer temperatures?”
2. Capture one short item from each of three sources.
3. Add a different relevance note to each item.
4. Open the evidence trail and verify every item links to its original page.
5. Generate the Markdown packet.
6. Click **Chat with GPT-5.6** and show the populated composer.
7. Review and manually click Send.
8. Verify the answer distinguishes evidence from inference, cites `[S1]`–`[S3]`, and suggests missing research.

Automate steps 1–6 against fixtures. Step 7 remains deliberately manual. Never make response extraction part of the test.

## 12. Ninety-second demo

**0–12 seconds:** “Most AI tools start with an empty prompt. Cassandra starts with looking.” Create the research question.

**12–42 seconds:** Browse three pages, capture small evidence, and add a quick “why this matters” note to each.

**42–58 seconds:** Open the evidence trail. Show distinct sources, quotes, learner notes, and one source-diversity warning.

**58–72 seconds:** Generate the readable Markdown packet and click **Chat with GPT-5.6**.

**72–84 seconds:** Show the filled prompt, manually send it, and reveal the source-ID-based response.

**84–90 seconds:** “Cassandra doesn't browse or think for you. It helps you bring better evidence to AI. Don't just be right. Bring the evidence.”

## 13. Submission positioning

**Problem:** Asking AI first can bypass research, obscure where claims came from, and reduce the learner's active role.

**Solution:** Cassandra makes source collection and personal relevance mandatory before synthesis. GPT-5.6 becomes the final study partner over a learner-created evidence trail.

**Why GPT-5.6 matters:** It compares, explains, identifies gaps, and proposes next research steps across the learner's packet. It does not gather the packet for them.

**Why Codex matters:** Codex builds the cross-site capture system, provenance model, privacy boundary, packet generator, browser tests, and distributable userscript during Build Week.

**Why it belongs in Education:** The product teaches an inquiry habit—find evidence, record its origin, explain its relevance, compare sources, and only then ask AI for help.

## 14. Name decision

**Cassandra** is the locked working name. It gives the product a memorable theme around evidence, foresight, and claims that deserve examination rather than blind acceptance.

### Primary lockup

> **Cassandra**  
> *Don't just be right. Bring the evidence.*

### Supporting product line

> Browse first. Ask better.

### About-page copy

> Named for Cassandra, who could see the truth but could not make others believe it. This Cassandra helps learners collect the evidence behind what they know. Browse, capture, explain why each source matters, and only then ask AI to help connect the pieces.

The primary byline is for the logo, landing page, submission title card, and demo ending. The shorter supporting line is for buttons, onboarding, and the research tray.

---

## 15. First Codex prompt

```text
Create a new clean-room repository named cassandra for the OpenAI Build Week Education category.

Read CASSANDRA_EDUCATION_BUILD_HANDOFF.md. Implement Wave 0 only. Freeze the ResearchSession/Capture schema, Markdown packet contract, GPT-5.6 prompt contract, capture exclusions, size limits, and the controlled three-page educational fixture. Create AGENTS.md, BUILD.md, HANDOFF.md, README.md, package.json, and a strict TypeScript/esbuild/Vitest skeleton. Do not implement the UI yet. Do not copy code from Hydra or Hydra Lens. Run the initial checks, record exact versions and commands, commit, and stop with the Wave 1 prompt ready.
```
