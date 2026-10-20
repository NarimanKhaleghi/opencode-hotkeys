import { expect, test } from "bun:test"
import pkg from "../package.json"
import { PLUGIN_VERSION } from "../src/core/meta"

test("package metadata stays in sync", () => {
  expect(pkg.name).toBe("opencode-hotkeys")
  expect(pkg.version).toBe(PLUGIN_VERSION)
  expect(pkg.exports["./tui"].types).toBe("./tui.ts")
  expect(pkg.files).toContain("schema.json")
  expect(pkg.files).toContain("assets/")
})
