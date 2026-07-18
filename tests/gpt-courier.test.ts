// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fillChatGptComposer } from "../src/gpt-courier.js";

describe("input-only GPT courier", () => {
  it("fills a composer without clicking a send control", () => {
    window.history.replaceState({}, "", "/?cassandra-browser-test=1");
    document.body.innerHTML = "<textarea></textarea><button>Send</button>";
    const send = document.querySelector("button")!; let sent = false; send.addEventListener("click", () => { sent = true; });
    expect(fillChatGptComposer(document, "CASSANDRA PACKET")).toBe(true);
    expect(document.querySelector("textarea")!.value).toBe("CASSANDRA PACKET");
    expect(sent).toBe(false);
  });
  it("refuses to overwrite an arbitrary page textarea", () => {
    window.history.replaceState({}, "", "/ordinary-page");
    document.body.innerHTML = "<textarea>learner form</textarea>";
    expect(fillChatGptComposer(document, "PROMPT")).toBe(false);
    expect(document.querySelector("textarea")!.value).toBe("learner form");
  });
});
