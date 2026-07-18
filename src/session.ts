import type { ResearchSession } from "./contracts.js";

export function newSession(question: string, clock = new Date(), id: string = globalThis.crypto.randomUUID()): ResearchSession {
  const now = clock.toISOString();
  return {
    id,
    title: question.trim() || "Untitled research",
    researchQuestion: question.trim(),
    createdAt: now,
    updatedAt: now,
    captures: []
  };
}

export function updateResearchQuestion(session: ResearchSession, question: string, clock = new Date()): ResearchSession {
  const researchQuestion = question.trim();
  return {
    ...session,
    title: researchQuestion || "Untitled research",
    researchQuestion,
    updatedAt: clock.toISOString()
  };
}
