// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { candidateFromElement, candidateFromSelection, captureIsAllowed, isSafeCaptureElement, sanitizeExcerpt, toDraft } from "../src/capture/capture.js";
import { MAX_CAPTURE_EXCERPT_CHARACTERS } from "../src/policy.js";
import type { ResearchSession } from "../src/contracts.js";

function fixture(name: string): Document {
  const html = readFileSync(resolve("fixtures/urban-trees", name), "utf8");
  return new JSDOM(html, { url: `https://fixture.test/${name}` }).window.document;
}

const emptySession: ResearchSession = { id: "r1", title: "Trees", researchQuestion: "How do trees cool cities?", createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", captures: [] };

describe("deliberate capture extraction", () => {
  it("extracts a safe, attributed short text capture from a fixture", () => {
    const doc = fixture("shade-study.html");
    const candidate = candidateFromElement(doc.querySelector("#finding")!, doc);
    expect(candidate).toMatchObject({ kind: "text", excerpt: "Tree shade reduced the measured surface temperature of a paved walkway at noon.", source: { title: "Shade observation study", author: "City Climate Lab", publishedAt: "2024-06-12" } });
  });
  it("recognises link, image reference, and deterministic table-row captures", () => {
    const links = fixture("canopy-reference.html");
    expect(candidateFromElement(links.querySelector("a")!, links)?.kind).toBe("link");
    const table = fixture("planning-view.html");
    const row = candidateFromElement(table.querySelector("tbody tr")!, table);
    expect(row?.kind).toBe("table-row");
    expect(row?.excerpt).toContain("Benefit: Shade");
    const imageDoc = new JSDOM("<title>Image page</title><figure><img src='tree.jpg' alt='A shaded street'><figcaption>Street canopy</figcaption></figure>", { url: "https://fixture.test/image" }).window.document;
    expect(candidateFromElement(imageDoc.querySelector("img")!, imageDoc)).toMatchObject({ kind: "image-reference", excerpt: expect.stringContaining("A shaded street") });
  });
  it("rejects form, editable, and private-host candidates", () => {
    const doc = new JSDOM("<p>Visible</p><input value='secret'><div contenteditable='true'>private</div>", { url: "https://mail.google.com/" }).window.document;
    expect(captureIsAllowed(doc)).toBe(false);
    expect(isSafeCaptureElement(doc.querySelector("input"))).toBe(false);
    expect(isSafeCaptureElement(doc.querySelector("[contenteditable]"))).toBe(false);
  });
  it("sanitizes and marks oversized captures", () => {
    const excerpt = sanitizeExcerpt(`start\u0000 ${"x".repeat(MAX_CAPTURE_EXCERPT_CHARACTERS + 100)}`);
    expect(excerpt.length).toBeLessThanOrEqual(MAX_CAPTURE_EXCERPT_CHARACTERS);
    expect(excerpt).toMatch(/\[truncated\]$/);
  });
  it("creates blank-reflection drafts and reuses source IDs", () => {
    const doc = fixture("shade-study.html");
    const candidate = candidateFromElement(doc.querySelector("#finding")!, doc)!;
    const first = toDraft(candidate, emptySession);
    const second = toDraft(candidate, { ...emptySession, captures: [first] });
    expect(first).toMatchObject({ sourceId: "S1", relevanceNote: "", sourceType: "unknown" });
    expect(second.sourceId).toBe("S1");
  });
  it("limits a deliberately selected text range", () => {
    const doc = new JSDOM(`<p>${"word ".repeat(300)}</p>`, { url: "https://fixture.test/range" }).window.document;
    const text = doc.querySelector("p")!.firstChild!;
    const range = doc.createRange(); range.setStart(text, 0); range.setEnd(text, text.textContent!.length);
    const selection = doc.defaultView!.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    expect(candidateFromSelection(selection, doc)?.excerpt).toMatch(/\[truncated\]$/);
  });
});
