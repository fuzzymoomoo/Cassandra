import { describe, expect, it } from "vitest";
import { newSession, updateResearchQuestion } from "../src/session.js";

describe("research sessions", () => {
  it("creates a local empty session from a learner question", () => {
    const session = newSession("  How do trees cool cities?  ", new Date("2026-07-18T12:00:00Z"), "session-1");
    expect(session).toMatchObject({ id: "session-1", title: "How do trees cool cities?", researchQuestion: "How do trees cool cities?", captures: [] });
  });
  it("updates only the question fields and timestamp", () => {
    const initial = newSession("First question", new Date("2026-07-18T12:00:00Z"), "session-1");
    const updated = updateResearchQuestion(initial, "Second question", new Date("2026-07-19T12:00:00Z"));
    expect(updated).toMatchObject({ id: "session-1", title: "Second question", researchQuestion: "Second question", createdAt: "2026-07-18T12:00:00.000Z", updatedAt: "2026-07-19T12:00:00.000Z" });
  });
});

