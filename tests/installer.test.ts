import { afterEach, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parse } from "jsonc-parser"

const dirs: string[] = []

const tempConfig = (content: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "opencode-hotkeys-installer-"))
  dirs.push(dir)
  const path = join(dir, "tui.json")
  writeFileSync(path, content)
  return path
}

const run = (...args: string[]): string =>
  execFileSync(process.execPath, ["bin/opencode-hotkeys.mjs", ...args], {
    encoding: "utf8",
  })

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

test("installs the plugin without dropping comments or other plugins", () => {
  const path = tempConfig('{\n  // keep me\n  "plugin": ["other"]\n}\n')
  run("--config", path, "--bind", "hotkeys.new=alt+n", "--debug")

  const body = readFileSync(path, "utf8")
  const config = parse(body)
  expect(body).toContain("// keep me")
  expect(config.plugin[0]).toBe("other")
  expect(config.plugin[1]).toEqual([
    "opencode-hotkeys",
    {
      preset: "native",
      debug: true,
      bindings: { "hotkeys.new": "alt+n" },
    },
  ])
})

test("is idempotent and supports force and uninstall", () => {
  const path = tempConfig("{}\n")
  run("--config", path)
  expect(run("--config", path)).toContain("already listed")

  run("--config", path, "--preset", "browser", "--force")
  expect(parse(readFileSync(path, "utf8")).plugin[0][1]).toEqual({
    preset: "browser",
  })

  run("--config", path, "--uninstall")
  expect(parse(readFileSync(path, "utf8")).plugin).toEqual([])
})
