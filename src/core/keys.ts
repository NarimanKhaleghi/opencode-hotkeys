const MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"] as const
type Modifier = (typeof MODIFIER_ORDER)[number]

const MODIFIER_ALIASES: Record<string, Modifier> = {
  ctrl: "ctrl",
  control: "ctrl",
  ctl: "ctrl",
  alt: "alt",
  opt: "alt",
  option: "alt",
  shift: "shift",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  super: "meta",
  win: "meta",
  windows: "meta",
}

const KEY_ALIASES: Record<string, string> = {
  escape: "esc",
  return: "enter",
  pgup: "pageup",
  pgdn: "pagedown",
  "page-up": "pageup",
  "page-down": "pagedown",
  spacebar: "space",
  del: "delete",
}

export function splitBindingList(value: string | readonly string[]): string[] {
  const list = typeof value === "string" ? value.split(",") : [...value]
  return list.map((entry) => entry.trim()).filter((entry) => entry.length > 0)
}

export function normalizeKey(value: string): string {
  const parts = value
    .trim()
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  const modifiers = new Set<Modifier>()
  let key = ""

  for (const part of parts) {
    const modifier = MODIFIER_ALIASES[part]
    if (modifier) {
      modifiers.add(modifier)
      continue
    }
    key = KEY_ALIASES[part] ?? part
  }

  if (!key) return ""
  const prefix = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier))
  return [...prefix, key].join("+")
}

export function normalizeBindings(bindings: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const binding of bindings) {
    for (const part of splitBindingList(binding)) {
      const normalized = normalizeKey(part)
      if (!normalized || seen.has(normalized)) continue
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

export function formatBinding(binding: string): string {
  const normalized = normalizeKey(binding)
  if (!normalized) return binding
  return normalized
    .split("+")
    .map((part) => {
      if (part === "ctrl") return "Ctrl"
      if (part === "alt") return "Alt"
      if (part === "shift") return "Shift"
      if (part === "meta") return "Meta"
      if (part === "pageup") return "PageUp"
      if (part === "pagedown") return "PageDown"
      if (part.length === 1) return part.toUpperCase()
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join("+")
}

export function formatBindings(bindings: readonly string[]): string {
  if (bindings.length === 0) return "unassigned"
  return bindings.map(formatBinding).join(", ")
}

export function primaryModifierDescription(bindings: readonly string[]): string {
  if (bindings.length === 0) return "No shortcut"
  return formatBindings(bindings)
}

export type KeyEventLike = {
  readonly name: string
  readonly ctrl?: boolean
  readonly meta?: boolean
  readonly shift?: boolean
  readonly option?: boolean
}

const MODIFIER_KEY_NAMES = new Set([
  "ctrl",
  "control",
  "alt",
  "option",
  "shift",
  "meta",
  "cmd",
  "command",
  "super",
  "hyper",
  "win",
  "windows",
])

export function keyFromKeyEvent(event: KeyEventLike): string | undefined {
  const name = event.name.trim().toLowerCase()
  if (!name || MODIFIER_KEY_NAMES.has(name)) return undefined

  const modifiers: string[] = []
  if (event.ctrl) modifiers.push("ctrl")
  if (event.meta || event.option) modifiers.push("alt")
  if (event.shift) modifiers.push("shift")
  modifiers.push(name)

  return normalizeKey(modifiers.join("+")) || undefined
}
