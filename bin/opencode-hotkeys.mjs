#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { applyEdits, modify, parse } from "jsonc-parser"

const PLUGIN_ID = "opencode-hotkeys"
const PRESETS = new Set(["native", "browser", "notes"])

const HELP = `opencode-hotkeys installer

Usage:
  opencode-hotkeys [options]

Options:
  -c, --config <path>   Path to tui.json (default: ~/.config/opencode/tui.json)
  -p, --preset <name>   native | browser | notes (default: native)
      --debug           Enable diagnostic markers
      --bind <id=keys>  Override an action, e.g. --bind hotkeys.new=alt+n
      --force           Replace an existing opencode-hotkeys entry
      --uninstall       Remove the opencode-hotkeys entry
      --print           Print the resulting tui.json instead of writing it
  -h, --help            Show this help

The installer edits tui.json and keeps your comments and formatting.
Restart OpenCode after changing the config.`

function fail(message) {
  console.error(`opencode-hotkeys: ${message}`)
  process.exit(1)
}

function readArgs(argv) {
  const result = {
    config: undefined,
    preset: "native",
    debug: false,
    binds: {},
    force: false,
    uninstall: false,
    print: false,
    help: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "-h" || arg === "--help") result.help = true
    else if (arg === "--debug") result.debug = true
    else if (arg === "--force") result.force = true
    else if (arg === "--uninstall") result.uninstall = true
    else if (arg === "--print") result.print = true
    else if (arg === "-c" || arg === "--config") result.config = argv[++index]
    else if (arg === "-p" || arg === "--preset") result.preset = argv[++index]
    else if (arg === "--bind") {
      const value = argv[++index]
      if (!value) fail("--bind needs an action=key value")
      const [id, keys] = value.split("=")
      if (!id || !keys) fail(`invalid --bind value: ${value}`)
      result.binds[id] = keys.includes(",") ? keys.split(",") : keys
    } else fail(`unknown option: ${arg}`)
  }
  return result
}

function configPath(explicit) {
  if (explicit) return resolve(explicit)
  if (process.env.OPENCODE_TUI_CONFIG) return resolve(process.env.OPENCODE_TUI_CONFIG)
  const dir =
    process.env.OPENCODE_CONFIG_DIR ||
    join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode")
  return join(dir, "tui.json")
}

function isOurs(entry) {
  return entry === PLUGIN_ID || (Array.isArray(entry) && entry[0] === PLUGIN_ID)
}

const args = readArgs(process.argv.slice(2))
if (args.help) {
  console.log(HELP)
  process.exit(0)
}
if (!PRESETS.has(args.preset)) fail(`unknown preset: ${args.preset}`)

const path = configPath(args.config)
const exists = existsSync(path)
let text = exists
  ? readFileSync(path, "utf8")
  : '{\n  "$schema": "https://opencode.ai/tui.json"\n}\n'

const errors = []
const document = parse(text, errors, { allowTrailingComma: true, disallowComments: false })
if (errors.length > 0) {
  fail(`could not parse ${path}; fix the JSON first`)
}
const root = document === undefined ? {} : document
if (typeof root !== "object" || root === null || Array.isArray(root)) {
  fail(`${path} must contain a JSON object`)
}
const plugins = Array.isArray(root.plugin) ? [...root.plugin] : []
if (root.plugin !== undefined && !Array.isArray(root.plugin)) {
  fail(`"plugin" in ${path} must be an array`)
}

const existing = plugins.findIndex(isOurs)

if (args.uninstall) {
  if (existing === -1) {
    console.log(`opencode-hotkeys is not listed in ${path}.`)
    process.exit(0)
  }
  plugins.splice(existing, 1)
} else {
  const options = { preset: args.preset }
  if (args.debug) options.debug = true
  if (Object.keys(args.binds).length > 0) options.bindings = args.binds
  const entry = [PLUGIN_ID, options]

  if (existing !== -1 && !args.force) {
    console.log(
      `opencode-hotkeys is already listed in ${path}. Use --force to replace its options.`,
    )
    process.exit(0)
  }
  if (existing === -1) plugins.push(entry)
  else plugins[existing] = entry
}

const edits = modify(text, ["plugin"], plugins, {
  formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
})
const next = applyEdits(text, edits)

if (args.print) {
  process.stdout.write(next)
  process.exit(0)
}

mkdirSync(dirname(path), { recursive: true })
writeFileSync(path, next)
console.log(
  args.uninstall
    ? `Removed opencode-hotkeys from ${path}. Restart OpenCode to apply.`
    : `Installed opencode-hotkeys in ${path}. Restart OpenCode, then press Alt+I.`,
)
