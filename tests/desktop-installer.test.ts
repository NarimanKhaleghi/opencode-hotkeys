import { afterEach, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

const dirs: string[] = []

const tempSettings = (keybinds: Record<string, string> = {}): string => {
  const dir = mkdtempSync(join(tmpdir(), "opencode-hotkeys-desktop-"))
  dirs.push(dir)
  const path = join(dir, "default.dat")
  writeFileSync(
    path,
    JSON.stringify({
      other: "keep",
      "settings.v3": JSON.stringify({
        general: { autoSave: true },
        keybinds,
      }),
    }),
  )
  return path
}

const run = (...args: string[]): string =>
  execFileSync(process.execPath, ["desktop/install.mjs", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })

const read = (path: string) => {
  const outer = JSON.parse(readFileSync(path, "utf8"))
  return { outer, settings: JSON.parse(outer["settings.v3"]) }
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

test("installs desktop keybinds, preserves settings, and writes a backup", () => {
  const path = tempSettings({ "custom.action": "alt+x", "tab.new": "mod+t" })
  run("--config", path)

  const { outer, settings } = read(path)
  expect(outer.other).toBe("keep")
  expect(settings.general.autoSave).toBe(true)
  expect(settings.keybinds["custom.action"]).toBe("alt+x")
  expect(settings.keybinds["tab.new"]).toBe("alt+enter,alt+t,mod+t,mod+n")
  expect(settings.keybinds["tab.9"]).toBe("alt+9,mod+9")
  expect(settings.keybinds["file.open"]).toBe("alt+/,alt+o,mod+p")
  expect(readdirSync(dirname(path)).some((name) => name.startsWith("default.dat.bak-"))).toBe(true)
})

test("is idempotent and supports check", () => {
  const path = tempSettings()
  expect(() => run("--config", path, "--check")).toThrow()
  run("--config", path)
  const backups = readdirSync(dirname(path)).filter((name) => name.startsWith("default.dat.bak-"))
  expect(run("--config", path)).toContain("already installed")
  expect(run("--config", path, "--check")).toContain("are installed")
  expect(readdirSync(dirname(path)).filter((name) => name.startsWith("default.dat.bak-"))).toEqual(
    backups,
  )
})

test("dry run reports changes without writing", () => {
  const path = tempSettings()
  const before = readFileSync(path, "utf8")
  expect(run("--config", path, "--dry-run")).toContain("Would install")
  expect(readFileSync(path, "utf8")).toBe(before)
})

test("uninstall removes managed bindings but keeps custom ones", () => {
  const path = tempSettings({ "custom.action": "alt+x" })
  run("--config", path)
  const { settings } = read(path)
  settings.keybinds["tab.new"] = "alt+z"
  const outer = JSON.parse(readFileSync(path, "utf8"))
  outer["settings.v3"] = JSON.stringify(settings)
  writeFileSync(path, JSON.stringify(outer))

  expect(run("--config", path, "--uninstall")).toContain("Kept customized bindings: tab.new")
  const next = read(path).settings.keybinds
  expect(next["tab.new"]).toBe("alt+z")
  expect(next["tab.1"]).toBeUndefined()
  expect(next["custom.action"]).toBe("alt+x")
})

test("restores the latest backup", () => {
  const path = tempSettings({ "custom.action": "alt+x" })
  run("--config", path)
  run("--config", path, "--restore", "latest")

  const keybinds = read(path).settings.keybinds
  expect(keybinds).toEqual({ "custom.action": "alt+x" })
})

test("rejects a missing settings file", () => {
  expect(() => run("--config", join(tmpdir(), "opencode-hotkeys-missing", "default.dat"))).toThrow()
})
