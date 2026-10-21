import { expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
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
  const docs = fileURLToPath(new URL("../docs/", import.meta.url))
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
    expect(existsSync(join(docs, file))).toBe(true)
  }
})

test("docs structured data parses and matches the visible FAQ", () => {
  const docs = fileURLToPath(new URL("../docs/", import.meta.url))
  for (const file of ["index.html", "fa/index.html"]) {
    const html = readFileSync(join(docs, file), "utf8")
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    expect(blocks).toHaveLength(3)
    const parsed = blocks.map((block) => JSON.parse(block[1] ?? ""))
    const app = parsed.find((entry) => entry["@type"] === "SoftwareApplication")
    if (!app) throw new Error(`missing SoftwareApplication in ${file}`)
    expect(app.softwareVersion).toBe(PLUGIN_VERSION)
    expect(app.downloadUrl).toContain(`/v${PLUGIN_VERSION}`)
    const faq = parsed.find((entry) => entry["@type"] === "FAQPage")
    if (!faq) throw new Error(`missing FAQPage in ${file}`)
    const details = (html.match(/<details>/g) ?? []).length
    expect(faq.mainEntity).toHaveLength(details)
  }
})

test("installer version matches the package version", () => {
  const version = execFileSync(process.execPath, ["desktop/install.mjs", "--version"], {
    encoding: "utf8",
  }).trim()
  expect(version).toBe(PLUGIN_VERSION)
})
