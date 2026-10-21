import { afterEach, expect, test } from "bun:test"
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
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

const runResult = (...args: string[]) => {
  const result = spawnSync(process.execPath, ["desktop/install.mjs", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
  return { code: result.status, stdout: result.stdout, stderr: result.stderr }
}

const backupsIn = (path: string): string[] =>
  readdirSync(dirname(path))
    .filter((name) => name.startsWith("default.dat.bak-"))
    .sort()

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

test("uninstall diff reports removals without writing", () => {
  const path = tempSettings()
  run("--config", path)
  const before = readFileSync(path, "utf8")
  const output = run("--config", path, "--uninstall", "--diff")
  expect(output).toContain("Would remove 14 managed keybinds")
  expect(output).toContain("tab.new: alt+enter,alt+t,mod+t,mod+n -> (unset)")
  expect(readFileSync(path, "utf8")).toBe(before)
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

test("reports a healthy doctor output and machine-readable JSON", () => {
  const path = tempSettings()
  run("--config", path)

  const human = run("--config", path, "--doctor")
  expect(human).toContain(`Config: ${path}`)
  expect(human).toContain("Managed: 14/14 installed")
  expect(human).toContain("Duplicate keys: none")

  const result = runResult("--config", path, "--doctor", "--json")
  expect(result.code).toBe(0)
  const report = JSON.parse(result.stdout)
  expect(report.ok).toBe(true)
  expect(report.configPath).toBe(path)
  expect(report.managed.total).toBe(14)
  expect(report.managed.installed).toHaveLength(14)
  expect(report.managed.missing).toEqual([])
  expect(report.duplicates).toEqual([])
  expect(report.backups.count).toBeGreaterThan(0)
})

test("doctor flags duplicate key sequences", () => {
  const path = tempSettings({ "custom.action": "alt+1", "tab.1": "alt+1" })
  const result = runResult("--config", path, "--doctor")
  expect(result.code).toBe(1)
  expect(result.stdout).toContain("Duplicate keys:")
  expect(result.stdout).toContain("alt+1: custom.action, tab.1")
})

test("diff shows current and new bindings without writing", () => {
  const path = tempSettings({ "tab.1": "alt+q" })
  const before = readFileSync(path, "utf8")
  const output = run("--config", path, "--diff")
  expect(output).toContain("Would install")
  expect(output).toContain("tab.1: alt+q -> alt+1,mod+1")
  expect(readFileSync(path, "utf8")).toBe(before)
})

test("keeps customized bindings when asked", () => {
  const path = tempSettings({ "tab.new": "alt+z" })
  const output = run("--config", path, "--keep-custom")
  expect(output).toContain("Kept customized bindings: tab.new")
  const { settings } = read(path)
  expect(settings.keybinds["tab.new"]).toBe("alt+z")
  expect(settings.keybinds["tab.1"]).toBe("alt+1,mod+1")
})

test("lists backups and restores one by name", () => {
  const path = tempSettings({ "custom.action": "alt+x" })
  run("--config", path)
  const [name] = backupsIn(path)
  if (!name) throw new Error("expected a backup")
  const list = run("--config", path, "--backups")
  expect(list).toContain(`Backups for ${path}:`)
  expect(list).toContain(name)

  run("--config", path, "--restore", name)
  expect(read(path).settings.keybinds).toEqual({ "custom.action": "alt+x" })
})

test("prunes old backups and leaves unrelated files alone", () => {
  const path = tempSettings()
  run("--config", path)
  for (const value of ["alt+q", "alt+w"]) {
    const current = read(path)
    current.settings.keybinds["tab.new"] = value
    current.outer["settings.v3"] = JSON.stringify(current.settings)
    writeFileSync(path, JSON.stringify(current.outer))
    run("--config", path)
  }
  const unrelated = join(dirname(path), "keep.txt")
  writeFileSync(unrelated, "keep")

  const dryRun = run("--config", path, "--prune", "1", "--dry-run")
  expect(dryRun).toContain("Would remove")
  expect(backupsIn(path)).toHaveLength(3)

  expect(run("--config", path, "--prune", "2")).toContain("Kept 2 newest backup(s)")
  expect(backupsIn(path)).toHaveLength(2)
  expect(existsSync(unrelated)).toBe(true)
})

test("rejects conflicting modes", () => {
  const path = tempSettings()
  const result = runResult("--config", path, "--uninstall", "--doctor")
  expect(result.code).toBe(1)
  expect(result.stderr).toContain("choose only one mode")
})
