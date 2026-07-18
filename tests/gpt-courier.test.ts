// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fillChatGptComposer } from "../src/gpt-courier.js";

describe("input-only GPT courier", () => {
  it("fills a composer without clicking a send control", () => {
    document.body.innerHTML = "<textarea></textarea><button>Send</button>";
    const send = document.querySelector("button")!; let sent = false; send.addEventListener("click", () => { sent = true; });
    expect(fillChatGptComposer(document, "CASSANDRA PACKET")).toBe(true);
    expect(document.querySelector("textarea")!.value).toBe("CASSANDRA PACKET");
    expect(sent).toBe(false);
  });
});
