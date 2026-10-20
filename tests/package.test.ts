import { expect, test } from "bun:test"
import { existsSync } from "node:fs"
import pkg from "../package.json"
import { PLUGIN_VERSION } from "../src/core/meta"

test("package metadata stays in sync", () => {
  expect(pkg.name).toBe("opencode-hotkeys")
  expect(pkg.version).toBe(PLUGIN_VERSION)
  expect(pkg.exports["./tui"].types).toBe("./tui.ts")
  expect(pkg.files).toContain("schema.json")
  expect(pkg.files).toContain("assets/")
  expect(pkg.files).toContain("desktop/")
  expect(pkg.files).toContain("docs/")
  expect(pkg.files).toContain("install-desktop.ps1")
  expect(pkg.bin["opencode-hotkeys-desktop"]).toBe("./desktop/install.mjs")
})

test("docs site is split into html, css, and js files", () => {
  const docs = new URL("../docs/", import.meta.url).pathname
  for (const file of [
    "index.html",
    "fa/index.html",
    "assets/styles.css",
    "assets/app.js",
    "assets/og-en.png",
    "assets/og-fa.png",
    "assets/apple-touch-icon.png",
    "robots.txt",
    "sitemap.xml",
    "site.webmanifest",
  ]) {
    expect(existsSync(docs + file)).toBe(true)
  }
})
