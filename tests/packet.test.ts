import { describe, expect, it } from "vitest";
import { createGptPrompt, createResearchPacket, GPT_56_PROMPT_PREFIX } from "../src/packet.js";
import type { ResearchSession } from "../src/contracts.js";

const session: ResearchSession = {
  id: "r1", title: "Explain cooling", researchQuestion: "How do urban trees affect summer temperatures?",
  createdAt: "2026-07-18T12:00:00Z", updatedAt: "2026-07-18T12:00:00Z",
  captures: [{
    id: "c1", sourceId: "S1", kind: "text", excerpt: "Street trees shade pavements.",
    relevanceNote: "This gives one mechanism for lower local temperatures.", sourceType: "secondary",
    source: { url: "https://fixture.test/heat.html", title: "Urban heat", capturedAt: "2026-07-18T12:00:00Z" }
  }]
};

describe("research packet contract", () => {
  it("uses the frozen v1 structure and source IDs", () => {
    const packet = createResearchPacket(session);
    expect(packet).toContain("<!-- CASSANDRA RESEARCH PACKET v1 -->");
    expect(packet).toContain("## [S1] Urban heat");
    expect(packet).toContain("Why it matters: This gives one mechanism");
  });
  it("excludes draft captures without relevance notes", () => {
    expect(createResearchPacket({ ...session, captures: [{ ...session.captures[0]!, relevanceNote: "" }] })).not.toContain("[S1]");
  });
  it("prepends the frozen GPT-5.6 study-partner contract", () => {
    expect(createGptPrompt(session)).toBe(`${GPT_56_PROMPT_PREFIX}\n\n${createResearchPacket(session)}`);
  });
});

