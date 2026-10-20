import type { ActionId } from "./actions"
import { normalizeKey, splitBindingList } from "./keys"

export type Conflict = {
  readonly key: string
  readonly actionId: ActionId
  readonly native: readonly string[]
  readonly severity: "warning" | "info"
}

export type NativeBindingMap = Record<string, string[]>

const DEFAULT_NATIVE_BINDINGS: NativeBindingMap = {}

function addNative(map: NativeBindingMap, keys: readonly string[], names: readonly string[]): void {
  for (const key of keys) {
    const normalized = normalizeKey(key)
    if (!normalized) continue
    const bucket = map[normalized] ?? (map[normalized] = [])
    for (const name of names) {
      if (!bucket.includes(name)) bucket.push(name)
    }
  }
}

addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+t"], ["variant.cycle"])
addNative(
  DEFAULT_NATIVE_BINDINGS,
  ["ctrl+w", "ctrl+backspace", "alt+backspace"],
  ["input.delete.word.backward"],
)
addNative(
  DEFAULT_NATIVE_BINDINGS,
  ["alt+d", "alt+delete", "ctrl+delete"],
  ["input.delete.word.forward"],
)
addNative(DEFAULT_NATIVE_BINDINGS, ["alt+left", "alt+b", "ctrl+left"], ["input.word.backward"])
addNative(DEFAULT_NATIVE_BINDINGS, ["alt+right", "alt+f", "ctrl+right"], ["input.word.forward"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+p"], ["command.palette.show"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+r"], ["session.rename"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+c"], ["app.exit", "prompt.clear"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+d"], ["app.exit"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+f"], ["model.favorite.toggle", "session.pin.toggle"])
addNative(DEFAULT_NATIVE_BINDINGS, ["tab"], ["agent.cycle"])
addNative(DEFAULT_NATIVE_BINDINGS, ["shift+tab"], ["agent.cycle.reverse"])
addNative(DEFAULT_NATIVE_BINDINGS, ["f2"], ["model.cycle.recent"])
addNative(DEFAULT_NATIVE_BINDINGS, ["shift+f2"], ["model.cycle.recent.reverse"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+a"], ["input.line.home"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+e"], ["input.line.end"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+b"], ["input.move.left"])
addNative(DEFAULT_NATIVE_BINDINGS, ["ctrl+v"], ["prompt.paste"])
addNative(
  DEFAULT_NATIVE_BINDINGS,
  ["ctrl+j", "alt+enter", "ctrl+enter", "shift+enter"],
  ["input.newline"],
)
addNative(DEFAULT_NATIVE_BINDINGS, ["pageup", "ctrl+alt+b"], ["session.page.up"])
addNative(DEFAULT_NATIVE_BINDINGS, ["pagedown", "ctrl+alt+f"], ["session.page.down"])

export function defaultNativeBindings(): NativeBindingMap {
  return Object.fromEntries(
    Object.entries(DEFAULT_NATIVE_BINDINGS).map(([key, names]) => [key, [...names]]),
  )
}

export function bindingMapFromTuiConfig(keybinds: unknown): NativeBindingMap {
  const map: NativeBindingMap = {}
  if (!keybinds || typeof keybinds !== "object") return map

  for (const [name, value] of Object.entries(keybinds as Record<string, unknown>)) {
    const sequences: string[] = []
    if (typeof value === "string") {
      sequences.push(...splitBindingList(value))
    } else if (value && typeof value === "object" && "key" in value) {
      const key = (value as { key?: unknown }).key
      if (typeof key === "string") sequences.push(...splitBindingList(key))
    }

    for (const sequence of sequences) {
      if (sequence.includes(" ")) continue
      const normalized = normalizeKey(sequence)
      if (!normalized) continue
      const bucket = map[normalized] ?? (map[normalized] = [])
      if (!bucket.includes(name)) bucket.push(name)
    }
  }

  return map
}

type LookupBinding = {
  readonly key?: unknown
  readonly cmd?: unknown
}

type BindingLookupLike = {
  readonly bindings?: readonly LookupBinding[]
}

export function bindingMapFromLookup(lookup: BindingLookupLike | undefined): NativeBindingMap {
  const map: NativeBindingMap = {}
  for (const binding of lookup?.bindings ?? []) {
    if (typeof binding.key !== "string" || typeof binding.cmd !== "string") continue
    if (binding.cmd.startsWith("hotkeys.")) continue
    const normalized = normalizeKey(binding.key)
    if (!normalized) continue
    const bucket = map[normalized] ?? (map[normalized] = [])
    if (!bucket.includes(binding.cmd)) bucket.push(binding.cmd)
  }
  return map
}

export function humanizeNativeName(name: string): string {
  if (name.includes(".")) return name
  return name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
}

export function findConflicts(
  bindings: Partial<Record<ActionId, readonly string[]>>,
  native: NativeBindingMap,
): Conflict[] {
  const conflicts: Conflict[] = []
  for (const [actionId, keys] of Object.entries(bindings) as [ActionId, string[]][]) {
    for (const key of keys ?? []) {
      const normalized = normalizeKey(key)
      const nativeNames = native[normalized]
      if (!nativeNames || nativeNames.length === 0) continue
      conflicts.push({
        key: normalized,
        actionId,
        native: nativeNames.map(humanizeNativeName),
        severity: "warning",
      })
    }
  }
  return conflicts
}

export function formatConflict(conflict: Conflict): string {
  return `${conflict.key} is also used by OpenCode (${conflict.native.join(", ")})`
}

const TERMINAL_CAVEATS: Readonly<Record<string, string>> = {
  "ctrl+tab": "Ctrl+Tab is often intercepted by terminal emulators or tmux.",
  "ctrl+shift+tab": "Ctrl+Shift+Tab is often intercepted by terminal emulators or tmux.",
  "ctrl+1": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+2": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+3": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+4": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+5": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+6": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+7": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+8": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
  "ctrl+9": "Ctrl+1..9 is often used by terminals to switch terminal tabs.",
}

export function terminalCaveats(
  bindings: Partial<Record<ActionId, readonly string[]>>,
  platform: string = typeof process === "undefined" ? "linux" : process.platform,
): string[] {
  const caveats = new Set<string>()
  for (const keys of Object.values(bindings)) {
    for (const key of keys ?? []) {
      const caveat = TERMINAL_CAVEATS[normalizeKey(key)]
      if (caveat) caveats.add(caveat)
    }
  }

  const hasAlt = Object.values(bindings).some((keys) =>
    (keys ?? []).some((key) => normalizeKey(key).startsWith("alt+")),
  )
  if (hasAlt && platform === "darwin") {
    caveats.add(
      'On macOS, enable "Use Option as Meta" in your terminal or Alt shortcuts will not reach OpenCode.',
    )
  }

  return [...caveats]
}
