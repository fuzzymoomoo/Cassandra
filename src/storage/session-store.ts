import type { ResearchSession } from "../contracts.js";

export const SESSION_STORAGE_KEY = "cassandra.active-session.v1";

export interface ValueStore {
  get<T>(key: string, fallback: T): T | Promise<T>;
  set<T>(key: string, value: T): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}

declare const GM_getValue: <T>(key: string, fallback: T) => T;
declare const GM_setValue: <T>(key: string, value: T) => void;
declare const GM_deleteValue: (key: string) => void;

function browserFallback(): ValueStore {
  return {
    get<T>(key: string, fallback: T): T {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) return fallback;
      try { return JSON.parse(raw) as T; } catch { return fallback; }
    },
    set<T>(key: string, value: T): void { globalThis.localStorage?.setItem(key, JSON.stringify(value)); },
    delete(key: string): void { globalThis.localStorage?.removeItem(key); }
  };
}

export function tampermonkeyStore(): ValueStore {
  if (typeof GM_getValue === "function" && typeof GM_setValue === "function" && typeof GM_deleteValue === "function") {
    return { get: GM_getValue, set: GM_setValue, delete: GM_deleteValue };
  }
  return browserFallback();
}

export class SessionStore {
  public constructor(private readonly values: ValueStore = tampermonkeyStore()) {}

  async load(): Promise<ResearchSession | null> {
    return await this.values.get<ResearchSession | null>(SESSION_STORAGE_KEY, null);
  }

  async save(session: ResearchSession): Promise<void> {
    await this.values.set(SESSION_STORAGE_KEY, session);
  }

  async clear(): Promise<void> {
    await this.values.delete(SESSION_STORAGE_KEY);
  }
}

