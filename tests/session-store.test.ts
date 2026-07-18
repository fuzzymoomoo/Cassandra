import { describe, expect, it } from "vitest";
import type { ValueStore } from "../src/storage/session-store.js";
import { SessionStore } from "../src/storage/session-store.js";
import { newSession } from "../src/session.js";

function memoryStore(): ValueStore & { values: Map<string, unknown> } {
  const values = new Map<string, unknown>();
  return { values, get: (key, fallback) => (values.get(key) as never) ?? fallback, set: (key, value) => { values.set(key, value); }, delete: (key) => { values.delete(key); } };
}

describe("Tampermonkey session storage", () => {
  it("loads, saves, and clears the one local active session", async () => {
    const values = memoryStore();
    const store = new SessionStore(values);
    const session = newSession("Question", new Date("2026-07-18T12:00:00Z"), "session-1");
    expect(await store.load()).toBeNull();
    await store.save(session);
    expect(await store.load()).toEqual(session);
    await store.clear();
    expect(await store.load()).toBeNull();
  });
});
