import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const bundle = resolve("dist/cassandra.user.js");
const fixtureDir = resolve("fixtures/urban-trees");

async function installFixtureRoutes(page: Page): Promise<void> {
  await page.route("https://fixture.test/**", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop() || "shade-study.html";
    await route.fulfill({ status: 200, contentType: "text/html", body: readFileSync(resolve(fixtureDir, name), "utf8") });
  });
  await page.addInitScript({ path: bundle });
}

function tray(page: Page) { return page.locator("#cassandra-research-tray"); }

test("mounts the branded userscript shell on every controlled fixture", async ({ page }) => {
  await installFixtureRoutes(page);
  for (const name of ["shade-study.html", "canopy-reference.html", "planning-view.html"]) {
    await page.goto(`https://fixture.test/${name}?cassandra-browser-test=1`);
    await expect(tray(page).getByRole("button", { name: /Cassandra|Open Cassandra/ })).toBeVisible();
  }
});

test("long tray screens scroll to the final control on a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await installFixtureRoutes(page);
  await page.goto("https://fixture.test/shade-study.html?cassandra-browser-test=1");
  await tray(page).getByRole("button", { name: "Open Cassandra" }).click();
  await tray(page).getByLabel("Research question").fill("How do urban trees affect summer temperatures?");
  await tray(page).getByRole("button", { name: "Create research session" }).click();
  const finalControl = tray(page).getByRole("button", { name: "Delete this research session" });
  await finalControl.scrollIntoViewIfNeeded();
  await expect(finalControl).toBeVisible();
  const box = await finalControl.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(600);
});

test("automates question, three-source capture, trail, and packet preview", async ({ page }) => {
  await installFixtureRoutes(page);
  const pages = [
    ["shade-study.html", "#finding", "This shows a measured shade effect."],
    ["canopy-reference.html", "#mechanism", "This explains two cooling mechanisms."],
    ["planning-view.html", "#tradeoff", "This adds a practical limitation to compare."]
  ] as const;
  await page.goto(`https://fixture.test/${pages[0][0]}?cassandra-browser-test=1`);
  await tray(page).getByRole("button", { name: "Open Cassandra" }).click();
  await expect(tray(page).getByRole("img", { name: "Cassandra" })).toBeVisible();
  await tray(page).getByLabel("Research question").fill("How do urban trees affect summer temperatures?");
  await tray(page).getByRole("button", { name: "Create research session" }).click();
  for (let index = 0; index < pages.length; index += 1) {
    const [name, selector, note] = pages[index]!;
    if (index > 0) {
      await page.goto(`https://fixture.test/${name}?cassandra-browser-test=1`);
      await tray(page).getByRole("button", { name: /Cassandra ·/ }).click();
    }
    await tray(page).getByRole("button", { name: "Capture something" }).click();
    await page.locator(selector).click();
    await tray(page).getByLabel(/Why does this matter/).fill(note);
    await tray(page).getByRole("button", { name: "Save capture" }).click();
  }
  await tray(page).getByRole("button", { name: "Open evidence trail" }).click();
  await expect(tray(page)).toContainText("[S1]");
  await expect(tray(page)).toContainText("[S2]");
  await expect(tray(page)).toContainText("[S3]");
  await tray(page).getByRole("button", { name: "Preview research packet" }).click();
  await expect(tray(page).locator("#packet")).toContainText("CASSANDRA RESEARCH PACKET v1");
});

test("private-surface capture stays disabled", async ({ page }) => {
  await page.route("https://mail.google.com/**", (route) => route.fulfill({ body: "<title>Private inbox</title><p>Private account content</p>", contentType: "text/html" }));
  await page.addInitScript({ path: bundle });
  await page.goto("https://mail.google.com/?cassandra-browser-test=1");
  await tray(page).getByRole("button", { name: "Open Cassandra" }).click();
  await tray(page).getByLabel("Research question").fill("Private test");
  await tray(page).getByRole("button", { name: "Create research session" }).click();
  page.once("dialog", async (dialog) => { expect(dialog.message()).toContain("disabled"); await dialog.accept(); });
  await tray(page).getByRole("button", { name: "Capture something" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-cassandra-capture-mode", "true");
});

test("composer courier fills input but never sends or reads output", async ({ page }) => {
  await page.route("https://chatgpt.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<title>ChatGPT fixture</title><textarea id='prompt-textarea'></textarea><button id='send'>Send</button><div id='output'>DO NOT READ OR CHANGE</div><script>window.sendCount=0;document.querySelector('#send').addEventListener('click',()=>window.sendCount+=1)</script>" }));
  await page.addInitScript({ path: bundle });
  await page.goto("https://chatgpt.com/?cassandra-browser-test=1");
  const session = { id: "research-1", title: "Tree cooling", researchQuestion: "How do trees cool cities?", createdAt: "2026-07-18T00:00:00Z", updatedAt: "2026-07-18T00:00:00Z", captures: [{ id: "capture-1", sourceId: "S1", kind: "text", excerpt: "Tree shade cools pavement.", relevanceNote: "It provides a mechanism.", sourceType: "secondary", source: { url: "https://fixture.test/shade-study.html", title: "Shade study", capturedAt: "2026-07-18T00:00:00Z" } }] };
  await page.evaluate((value) => localStorage.setItem("cassandra.active-session.v1", JSON.stringify(value)), session);
  await page.reload();
  await tray(page).getByRole("button", { name: /Cassandra ·/ }).click();
  await tray(page).getByRole("button", { name: "Research packet & GPT-5.6" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await tray(page).getByRole("button", { name: "Fill ChatGPT composer" }).click();
  await expect(page.locator("#prompt-textarea")).toHaveValue(/CASSANDRA PACKET FOLLOWS/);
  await expect(page.locator("#output")).toHaveText("DO NOT READ OR CHANGE");
  expect(await page.evaluate(() => (window as unknown as { sendCount: number }).sendCount)).toBe(0);
});
