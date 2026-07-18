import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./browser-tests",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { browserName: "chromium", headless: true, viewport: { width: 1440, height: 900 } }
});
