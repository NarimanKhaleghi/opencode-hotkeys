import { SWITCH_SLOTS, type ActionId } from "./actions"

export type PresetName = "native" | "browser" | "notes"

export type PresetDefinition = {
  readonly label: string
  readonly description: string
  readonly bindings: Partial<Record<ActionId, readonly string[]>>
}

const switchBindings = (key: (slot: number) => string): Partial<Record<ActionId, string[]>> =>
  Object.fromEntries(
    SWITCH_SLOTS.map((slot) => [`hotkeys.switch.${slot}`, [key(slot)]]),
  ) as Partial<Record<ActionId, string[]>>

export const PRESETS: Record<PresetName, PresetDefinition> = {
  native: {
    label: "Native first",
    description: "Keeps OpenCode's own shortcuts untouched and adds only free Alt-based shortcuts.",
    bindings: {
      "hotkeys.new": ["alt+t"],
      "hotkeys.picker": ["alt+o"],
      "hotkeys.next": ["alt+pagedown"],
      "hotkeys.prev": ["alt+pageup"],
      ...switchBindings((slot) => `alt+${slot}`),
      "hotkeys.studio": ["alt+k"],
      "hotkeys.help": ["alt+i"],
      "hotkeys.doctor": [],
    },
  },
  browser: {
    label: "Browser",
    description:
      "Chrome/Firefox-style switching shortcuts. Some terminals intercept Ctrl+Tab and Ctrl+1..9.",
    bindings: {
      "hotkeys.new": ["ctrl+t"],
      "hotkeys.picker": ["ctrl+l"],
      "hotkeys.next": ["ctrl+tab"],
      "hotkeys.prev": ["ctrl+shift+tab"],
      ...switchBindings((slot) => `ctrl+${slot}`),
      "hotkeys.studio": ["alt+k"],
      "hotkeys.help": ["alt+i"],
      "hotkeys.doctor": [],
    },
  },
  notes: {
    label: "Notes",
    description:
      "Obsidian-inspired quick switcher and session movement, with safe Alt+1..9 slot switching.",
    bindings: {
      "hotkeys.new": ["ctrl+n"],
      "hotkeys.picker": ["ctrl+o"],
      "hotkeys.next": ["ctrl+tab"],
      "hotkeys.prev": ["ctrl+shift+tab"],
      ...switchBindings((slot) => `alt+${slot}`),
      "hotkeys.studio": ["alt+k"],
      "hotkeys.help": ["alt+i"],
      "hotkeys.doctor": [],
    },
  },
}

export const DEFAULT_PRESET: PresetName = "native"

export function isPresetName(value: unknown): value is PresetName {
  return value === "native" || value === "browser" || value === "notes"
}
