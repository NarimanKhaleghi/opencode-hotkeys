#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { homedir, platform } from "node:os"
import { basename, dirname, join, resolve } from "node:path"

export const MANAGED_KEYBINDS = Object.freeze({
  "tab.new": "alt+enter,alt+t,mod+t,mod+n",
  "tab.1": "alt+1,mod+1",
  "tab.2": "alt+2,mod+2",
  "tab.3": "alt+3,mod+3",
  "tab.4": "alt+4,mod+4",
  "tab.5": "alt+5,mod+5",
  "tab.6": "alt+6,mod+6",
  "tab.7": "alt+7,mod+7",
  "tab.8": "alt+8,mod+8",
  "tab.9": "alt+9,mod+9",
  "tab.prev": "alt+pageup,alt+home,mod+option+arrowleft,ctrl+shift+tab",
  "tab.next": "alt+pagedown,alt+end,mod+option+arrowright,ctrl+tab",
  "file.open": "alt+/,alt+o,mod+p",
  "settings.open": "alt+.,alt+k,mod+comma",
})

const SETTINGS_KEY = "settings.v3"
const APP_DIRS = ["ai.opencode.desktop", "OpenCode", "opencode-desktop"]

const HELP = `OpenCode Desktop hotkeys

Usage:
  opencode-hotkeys-desktop [options]

Options:
  -c, --config <path>    Path to OpenCode Desktop's default.dat
      --print            Print the resulting keybind configuration
      --dry-run          Show what would change without writing
      --diff             Show current and new bindings without writing
      --keep-custom      Do not overwrite keybinds you customized yourself
      --check            Exit 0 when every managed keybind is installed
      --doctor           Diagnose config, bindings, duplicates, and backups
      --json             Machine-readable output for --doctor
      --backups          List timestamped backups next to the settings file
      --prune <n>        Keep the newest n backups and delete older ones
      --uninstall        Remove only the keybinds installed by this tool
      --restore <path>   Restore a default.dat backup by path or name
      --restore latest   Restore the newest backup next to the settings file
  -h, --help             Show this help
  -v, --version          Show the version

The installer preserves every other setting and writes a timestamped backup.
Quit and reopen OpenCode Desktop after changing keybinds.`

function fail(message) {
  console.error(`opencode-hotkeys-desktop: ${message}`)
  process.exit(1)
}

function readArgs(argv) {
  const result = {
    config: undefined,
    dryRun: false,
    print: false,
    check: false,
    uninstall: false,
    restore: undefined,
    doctor: false,
    json: false,
    backups: false,
    prune: undefined,
    diff: false,
    keepCustom: false,
    help: false,
    version: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "-h" || arg === "--help") result.help = true
    else if (arg === "-v" || arg === "--version") result.version = true
    else if (arg === "--dry-run") result.dryRun = true
    else if (arg === "--print") result.print = true
    else if (arg === "--check") result.check = true
    else if (arg === "--uninstall") result.uninstall = true
    else if (arg === "--doctor") result.doctor = true
    else if (arg === "--json") result.json = true
    else if (arg === "--backups") result.backups = true
    else if (arg === "--diff") result.diff = true
    else if (arg === "--keep-custom") result.keepCustom = true
    else if (arg === "-c" || arg === "--config") {
      const value = argv[++index]
      if (!value) fail("--config needs a path")
      result.config = value
    } else if (arg === "--prune") {
      const value = argv[++index]
      if (!value) fail("--prune needs a positive integer")
      result.prune = value
    } else if (arg === "--restore") {
      const value = argv[++index]
      if (!value) fail("--restore needs a backup path, a backup name, or 'latest'")
      result.restore = value
    } else {
      fail(`unknown option: ${arg}`)
    }
  }
  return result
}

function configCandidates() {
  const roots = []
  if (platform() === "darwin") {
    roots.push(join(homedir(), "Library", "Application Support"))
  } else if (platform() === "win32") {
    roots.push(process.env.APPDATA || join(homedir(), "AppData", "Roaming"))
    roots.push(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"))
  } else {
    roots.push(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"))
  }
  return roots.flatMap((root) => APP_DIRS.map((name) => join(root, name, "default.dat")))
}

function readSettings(path) {
  const outer = JSON.parse(readFileSync(path, "utf8"))
  if (outer === null || typeof outer !== "object" || Array.isArray(outer)) {
    throw new Error("expected a JSON object at the top level")
  }
  const raw = outer[SETTINGS_KEY]
  const settings =
    typeof raw === "string"
      ? JSON.parse(raw)
      : raw && typeof raw === "object"
        ? structuredClone(raw)
        : undefined
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error(`missing or invalid ${SETTINGS_KEY}`)
  }
  const keybinds =
    settings.keybinds && typeof settings.keybinds === "object" && !Array.isArray(settings.keybinds)
      ? settings.keybinds
      : {}
  return { outer, settings, keybinds }
}

function isValidSettings(path) {
  try {
    readSettings(path)
    return true
  } catch {
    return false
  }
}

function locateConfig(explicit) {
  if (explicit) {
    const path = resolve(explicit)
    if (!existsSync(path))
      fail(`settings file not found: ${path}\nOpen OpenCode Desktop once, then retry.`)
    try {
      readSettings(path)
    } catch (error) {
      fail(`could not read ${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
    return path
  }
  const override = process.env.OPENCODE_DESKTOP_CONFIG
  if (override) return locateConfig(override)
  const found = configCandidates().filter(existsSync)
  const valid = found.filter(isValidSettings)
  if (valid.length === 0) {
    const searched = configCandidates()
      .map((path) => `  ${path}`)
      .join("\n")
    fail(
      found.length > 0
        ? `found settings files but none contain ${SETTINGS_KEY}:\n${found.map((path) => `  ${path}`).join("\n")}`
        : `could not find OpenCode Desktop settings.\nOpen the app once, or pass --config <path>.\nSearched:\n${searched}`,
    )
  }
  return valid[0]
}

function timestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("")
}

function backupPath(path) {
  const base = `${path}.bak-${timestamp()}`
  if (!existsSync(base)) return base
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`
    if (!existsSync(candidate)) return candidate
  }
  fail(`could not allocate a backup name next to ${path}`)
}

function backup(path) {
  const target = backupPath(path)
  copyFileSync(path, target)
  return target
}

function listBackups(path) {
  const directory = dirname(path)
  const prefix = `${basename(path)}.bak-`
  let names = []
  try {
    names = readdirSync(directory)
  } catch {
    return []
  }
  return names
    .filter((name) => name.startsWith(prefix))
    .map((name) => {
      const full = join(directory, name)
      let size = 0
      let mtime = 0
      try {
        const stats = statSync(full)
        size = stats.size
        mtime = stats.mtimeMs
      } catch {
        size = 0
        mtime = 0
      }
      return { name, path: full, size, mtime }
    })
    .sort((a, b) => b.mtime - a.mtime || (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
}

function latestBackup(path) {
  const [latest] = listBackups(path)
  if (!latest) fail(`no backups found for ${path}`)
  return latest.path
}

function resolveBackup(path, value) {
  if (value === "latest") return latestBackup(path)
  const direct = resolve(value)
  if (existsSync(direct)) return direct
  const nearby = join(dirname(path), value)
  if (existsSync(nearby)) return nearby
  fail(`backup not found: ${value}`)
}

function normalizeSequence(value) {
  const parts = value
    .trim()
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return ""
  const key = parts.pop()
  const mod = platform() === "darwin" ? "meta" : "ctrl"
  const modifiers = new Set(
    parts.map((part) => {
      if (part === "cmd" || part === "command") return "meta"
      if (part === "mod") return mod
      return part
    }),
  )
  return [...[...modifiers].sort(), key].join("+")
}

function splitSequences(value) {
  if (typeof value !== "string") return []
  const trimmed = value.trim()
  if (!trimmed || trimmed === "none") return []
  return trimmed.split(",").map(normalizeSequence).filter(Boolean)
}

function findDuplicateKeys(keybinds) {
  const owners = new Map()
  for (const [action, value] of Object.entries(keybinds)) {
    const seen = new Set()
    for (const key of splitSequences(value)) {
      if (seen.has(key)) continue
      seen.add(key)
      const actions = owners.get(key) ?? []
      if (!actions.includes(action)) actions.push(action)
      owners.set(key, actions)
    }
  }
  return [...owners.entries()]
    .filter(([, actions]) => actions.length > 1)
    .map(([key, actions]) => ({ key, actions: actions.sort() }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

function managedStatus(keybinds) {
  const installed = []
  const missing = []
  const customized = []
  for (const [action, desired] of Object.entries(MANAGED_KEYBINDS)) {
    if (!(action in keybinds)) missing.push(action)
    else if (keybinds[action] === desired) installed.push(action)
    else customized.push(action)
  }
  return { installed, missing, customized }
}

function doctorReport(path, keybinds) {
  const status = managedStatus(keybinds)
  const duplicates = findDuplicateKeys(keybinds)
  const backups = listBackups(path)
  const warnings = []
  if (status.missing.length > 0) {
    warnings.push(`${status.missing.length} managed keybind(s) are not installed.`)
  }
  if (status.customized.length > 0) {
    warnings.push(`${status.customized.length} managed keybind(s) were customized.`)
  }
  if (duplicates.length > 0) {
    warnings.push(`${duplicates.length} duplicate key sequence(s) found.`)
  }
  return {
    ok: duplicates.length === 0,
    configPath: path,
    platform: platform(),
    managed: {
      total: Object.keys(MANAGED_KEYBINDS).length,
      installed: status.installed,
      missing: status.missing,
      customized: status.customized,
    },
    duplicates,
    backups: {
      count: backups.length,
      latest: backups[0]?.name ?? null,
    },
    warnings,
  }
}

function printDoctor(report) {
  console.log("OpenCode Desktop hotkeys doctor")
  console.log(`Config: ${report.configPath}`)
  console.log(`Platform: ${report.platform}`)
  console.log(`Managed: ${report.managed.installed.length}/${report.managed.total} installed`)
  if (report.managed.missing.length > 0) {
    console.log(`Missing: ${report.managed.missing.join(", ")}`)
  }
  if (report.managed.customized.length > 0) {
    console.log(`Customized: ${report.managed.customized.join(", ")}`)
  }
  if (report.duplicates.length > 0) {
    console.log("Duplicate keys:")
    for (const duplicate of report.duplicates) {
      console.log(`  ${duplicate.key}: ${duplicate.actions.join(", ")}`)
    }
  } else {
    console.log("Duplicate keys: none")
  }
  console.log(
    `Backups: ${report.backups.count}${report.backups.latest ? ` (latest: ${report.backups.latest})` : ""}`,
  )
}

function formatChanges(changes, current) {
  return changes
    .map(([action, value]) => {
      const previous = current?.[action]
      return `  ${action}: ${previous === undefined ? "(unset)" : previous} -> ${value}`
    })
    .join("\n")
}

function pruneBackups(path, keep, dryRun) {
  const backups = listBackups(path)
  const remove = backups.slice(keep)
  if (remove.length === 0) {
    console.log(`Nothing to prune; ${backups.length} backup(s) present.`)
    return
  }
  for (const entry of remove) {
    if (!dryRun) rmSync(entry.path, { force: true })
    console.log(`${dryRun ? "Would remove" : "Removed"} ${entry.path}`)
  }
  console.log(
    `${dryRun ? "Would keep" : "Kept"} ${Math.min(keep, backups.length)} newest backup(s).`,
  )
}

function writeSettings(path, outer, settings) {
  const next = { ...outer, [SETTINGS_KEY]: JSON.stringify(settings) }
  const temporary = `${path}.tmp-${process.pid}`
  try {
    writeFileSync(temporary, JSON.stringify(next), { mode: 0o600 })
    renameSync(temporary, path)
  } catch (error) {
    rmSync(temporary, { force: true })
    const reason = error instanceof Error ? error.message : String(error)
    fail(`could not write ${path}: ${reason}\nQuit OpenCode Desktop completely and retry.`)
  }
}

function changedKeybinds(current, desired) {
  return Object.entries(desired).filter(([action, value]) => current[action] !== value)
}

const args = readArgs(process.argv.slice(2))
if (args.help) {
  console.log(HELP)
  process.exit(0)
}
if (args.version) {
  console.log("1.0.0")
  process.exit(0)
}

const modes = [
  args.restore !== undefined ? "--restore" : undefined,
  args.uninstall ? "--uninstall" : undefined,
  args.doctor ? "--doctor" : undefined,
  args.backups ? "--backups" : undefined,
  args.prune !== undefined ? "--prune" : undefined,
  args.check ? "--check" : undefined,
].filter(Boolean)
if (modes.length > 1) fail(`choose only one mode: ${modes.join(", ")}`)
if (args.json && !args.doctor) fail("--json is only supported with --doctor")
if (args.prune !== undefined) {
  const keep = Number(args.prune)
  if (!Number.isInteger(keep) || keep < 1) fail("--prune needs a positive integer")
}

const dryRun = args.dryRun || args.diff
const path = locateConfig(args.config)
const { outer, settings, keybinds } = readSettings(path)

if (args.backups) {
  const backups = listBackups(path)
  if (backups.length === 0) {
    console.log(`No backups found for ${path}.`)
    process.exit(0)
  }
  console.log(`Backups for ${path}:`)
  for (const [index, entry] of backups.entries()) {
    const marker = index === 0 ? " (latest)" : ""
    console.log(`  ${entry.name}  ${entry.size} bytes${marker}`)
  }
  process.exit(0)
}

if (args.prune !== undefined) {
  pruneBackups(path, Number(args.prune), args.dryRun)
  process.exit(0)
}

if (args.restore) {
  const source = resolveBackup(path, args.restore)
  if (!isValidSettings(source)) fail(`not a valid OpenCode Desktop settings backup: ${source}`)
  if (dryRun) {
    console.log(`Would restore ${source} to ${path}.`)
    process.exit(0)
  }
  const saved = backup(path)
  copyFileSync(source, path)
  console.log(`Restored ${source}`)
  console.log(`Previous settings saved to ${saved}`)
  console.log("Quit and reopen OpenCode Desktop to apply.")
  process.exit(0)
}

if (args.uninstall) {
  const removed = []
  const kept = []
  for (const [action, installed] of Object.entries(MANAGED_KEYBINDS)) {
    if (!(action in keybinds)) continue
    if (keybinds[action] === installed) {
      delete keybinds[action]
      removed.push(action)
    } else {
      kept.push(action)
    }
  }
  if (removed.length === 0) {
    console.log(`No managed keybinds found in ${path}.`)
    if (kept.length > 0) console.log(`Kept customized bindings: ${kept.join(", ")}`)
    process.exit(0)
  }
  if (args.print) {
    console.log(JSON.stringify(MANAGED_KEYBINDS, null, 2))
    process.exit(0)
  }
  if (!dryRun) {
    settings.keybinds = keybinds
    const saved = backup(path)
    writeSettings(path, outer, settings)
    console.log(`Backup: ${saved}`)
  }
  console.log(
    `${dryRun ? "Would remove" : "Removed"} ${removed.length} managed keybinds from ${path}.`,
  )
  if (args.diff) {
    for (const action of removed) {
      console.log(`  ${action}: ${MANAGED_KEYBINDS[action]} -> (unset)`)
    }
  }
  if (kept.length > 0) console.log(`Kept customized bindings: ${kept.join(", ")}`)
  console.log("Quit and reopen OpenCode Desktop to apply.")
  process.exit(0)
}

if (args.doctor) {
  const report = doctorReport(path, keybinds)
  if (args.json) console.log(JSON.stringify(report, null, 2))
  else printDoctor(report)
  process.exit(report.ok ? 0 : 1)
}

const missing = Object.entries(MANAGED_KEYBINDS).filter(
  ([action, value]) => keybinds[action] !== value,
)

if (args.check) {
  if (missing.length === 0) {
    console.log(`OpenCode Desktop hotkeys are installed in ${path}.`)
    process.exit(0)
  }
  console.error(`OpenCode Desktop hotkeys are not fully installed in ${path}.`)
  console.error(`Missing or different:\n${formatChanges(missing, keybinds)}`)
  process.exit(1)
}

if (args.print) {
  console.log(JSON.stringify(MANAGED_KEYBINDS, null, 2))
  process.exit(0)
}

const allChanges = changedKeybinds(keybinds, MANAGED_KEYBINDS)
const skipped = args.keepCustom ? allChanges.filter(([action]) => action in keybinds) : []
const changes = args.keepCustom
  ? allChanges.filter(([action]) => !(action in keybinds))
  : allChanges

if (changes.length === 0) {
  if (skipped.length > 0) {
    console.log(
      `No changes; kept customized bindings: ${skipped.map(([action]) => action).join(", ")}`,
    )
  } else {
    console.log(`OpenCode Desktop hotkeys are already installed in ${path}.`)
  }
  process.exit(0)
}

if (!dryRun) {
  settings.keybinds = { ...keybinds, ...Object.fromEntries(changes) }
  const saved = backup(path)
  writeSettings(path, outer, settings)
  console.log(`Backup: ${saved}`)
}

console.log(
  `${dryRun ? "Would install" : "Installed"} ${changes.length} OpenCode Desktop keybinds in ${path}.`,
)
console.log(formatChanges(changes, keybinds))
if (skipped.length > 0) {
  console.log(`Kept customized bindings: ${skipped.map(([action]) => action).join(", ")}`)
}
console.log("Quit and reopen OpenCode Desktop to apply. Then press Alt+Enter to open a new tab.")
