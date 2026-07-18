import { describe, expect, it } from "vitest";
import { isBlockedCaptureHost, MAX_CAPTURE_EXCERPT_CHARACTERS, MAX_PACKET_CAPTURES, MAX_PACKET_CHARACTERS } from "../src/policy.js";

describe("Wave 0 safety policy", () => {
  it("freezes MVP size limits", () => {
    expect([MAX_CAPTURE_EXCERPT_CHARACTERS, MAX_PACKET_CAPTURES, MAX_PACKET_CHARACTERS]).toEqual([800, 20, 24_000]);
  });
  it("blocks private and local surfaces", () => {
    expect(isBlockedCaptureHost("localhost")).toBe(true);
    expect(isBlockedCaptureHost("mail.google.com")).toBe(true);
    expect(isBlockedCaptureHost("example.edu")).toBe(false);
  });
});

