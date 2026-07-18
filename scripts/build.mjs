import { build } from "esbuild";

await build({
  entryPoints: ["src/userscript.ts"],
  bundle: true,
  format: "iife",
  target: ["es2022"],
  outfile: "dist/cassandra.user.js",
  banner: {
    js: "// ==UserScript==\n// @name         Cassandra\n// @namespace    https://github.com/cassandra-build-week\n// @version      0.1.0\n// @description  Browse first. Ask better.\n// @match        http://*/*\n// @match        https://*/*\n// @grant        GM_getValue\n// @grant        GM_setValue\n// ==/UserScript=="
  }
});

