#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
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
      --check            Exit 0 when every managed keybind is installed
      --uninstall        Remove only the keybinds installed by this tool
      --restore <path>   Restore a default.dat backup
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
    else if (arg === "-c" || arg === "--config") {
      const value = argv[++index]
      if (!value) fail("--config needs a path")
      result.config = value
    } else if (arg === "--restore") {
      const value = argv[++index]
      if (!value) fail("--restore needs a backup path or 'latest'")
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

function latestBackup(path) {
  const directory = dirname(path)
  const prefix = `${basename(path)}.bak-`
  const matches = readdirSync(directory)
    .filter((name) => name.startsWith(prefix))
    .sort()
  if (matches.length === 0) fail(`no backups found for ${path}`)
  return join(directory, matches.at(-1))
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

function formatChanges(changes) {
  return changes.map(([action, value]) => `  ${action}: ${value}`).join("\n")
}

const args = readArgs(process.argv.slice(2))
if (args.help) {
  console.log(HELP)
  process.exit(0)
}
if (args.version) {
  console.log("0.2.0")
  process.exit(0)
}

const path = locateConfig(args.config)
const { outer, settings, keybinds } = readSettings(path)

if (args.restore) {
  const source = args.restore === "latest" ? latestBackup(path) : resolve(args.restore)
  if (!existsSync(source)) fail(`backup not found: ${source}`)
  if (!isValidSettings(source)) fail(`not a valid OpenCode Desktop settings backup: ${source}`)
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
  if (!args.dryRun) {
    settings.keybinds = keybinds
    const saved = backup(path)
    writeSettings(path, outer, settings)
    console.log(`Backup: ${saved}`)
  }
  console.log(
    `${args.dryRun ? "Would remove" : "Removed"} ${removed.length} managed keybinds from ${path}.`,
  )
  if (kept.length > 0) console.log(`Kept customized bindings: ${kept.join(", ")}`)
  console.log("Quit and reopen OpenCode Desktop to apply.")
  process.exit(0)
}

const changes = changedKeybinds(keybinds, MANAGED_KEYBINDS)
const missing = Object.entries(MANAGED_KEYBINDS).filter(
  ([action, value]) => keybinds[action] !== value,
)

if (args.check) {
  if (missing.length === 0) {
    console.log(`OpenCode Desktop hotkeys are installed in ${path}.`)
    process.exit(0)
  }
  console.error(`OpenCode Desktop hotkeys are not fully installed in ${path}.`)
  console.error(`Missing or different:\n${formatChanges(missing)}`)
  process.exit(1)
}

if (args.print) {
  console.log(JSON.stringify(MANAGED_KEYBINDS, null, 2))
  process.exit(0)
}

if (changes.length === 0) {
  console.log(`OpenCode Desktop hotkeys are already installed in ${path}.`)
  process.exit(0)
}

if (!args.dryRun) {
  settings.keybinds = { ...keybinds, ...MANAGED_KEYBINDS }
  const saved = backup(path)
  writeSettings(path, outer, settings)
  console.log(`Backup: ${saved}`)
}

console.log(
  `${args.dryRun ? "Would install" : "Installed"} ${changes.length} OpenCode Desktop keybinds in ${path}.`,
)
console.log(formatChanges(changes))
console.log("Quit and reopen OpenCode Desktop to apply. Then press Alt+Enter to open a new tab.")
