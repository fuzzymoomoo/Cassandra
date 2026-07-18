import { describe, expect, it } from "vitest";
import { backupSession, evidenceWarnings, moveCapture, removeCapture, restoreSession, updateCapture } from "../src/session-tools.js";
import type { ResearchSession } from "../src/contracts.js";

const session: ResearchSession = { id: "r", title: "Question", researchQuestion: "Question?", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", captures: [
  { id: "a", sourceId: "S1", kind: "text", excerpt: "A", relevanceNote: "Supports it", sourceType: "secondary", source: { url: "https://one.example/a", title: "A", capturedAt: "2026-01-01T00:00:00Z" } },
  { id: "b", sourceId: "S1", kind: "text", excerpt: "B", relevanceNote: "", sourceType: "unknown", source: { url: "https://one.example/a", title: "A", capturedAt: "2026-01-01T00:00:00Z" } }
] };

describe("evidence trail session tools", () => {
  it("warns without blocking on weak source diversity and metadata", () => expect(evidenceWarnings(session).map((warning) => warning.kind)).toEqual(["single-domain", "missing-metadata"]));
  it("edits, removes, and reorders captures", () => {
    expect(updateCapture(session, "a", { relevanceNote: "Edited", sourceType: "primary" }).captures[0]).toMatchObject({ relevanceNote: "Edited", sourceType: "primary" });
    expect(moveCapture(session, "a", 1).captures.map((capture) => capture.id)).toEqual(["b", "a"]);
    expect(removeCapture(session, "a").captures.map((capture) => capture.id)).toEqual(["b"]);
  });
  it("round-trips a JSON backup and rejects unrelated data", () => {
    expect(restoreSession(backupSession(session))).toEqual(session);
    expect(() => restoreSession('{"format":"other"}')).toThrow("not a Cassandra");
    expect(() => restoreSession(JSON.stringify({ format: "cassandra-session-v1", session: { ...session, captures: [{ ...session.captures[0], id: '\"><script>' }] } }))).toThrow("invalid capture");
  });
});
