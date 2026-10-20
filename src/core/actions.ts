export const SWITCH_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export type SwitchSlot = (typeof SWITCH_SLOTS)[number]

export type StaticActionId =
  | "hotkeys.new"
  | "hotkeys.picker"
  | "hotkeys.next"
  | "hotkeys.prev"
  | "hotkeys.help"
  | "hotkeys.studio"
  | "hotkeys.doctor"

export type SwitchActionId = `hotkeys.switch.${SwitchSlot}`

export type ActionId = StaticActionId | SwitchActionId

export type SlashDefinition = {
  readonly name: string
  readonly aliases?: readonly string[]
  readonly arguments?: boolean
}

export type ActionDefinition = {
  readonly id: ActionId
  readonly title: string
  readonly description: string
  readonly group: string
  readonly slash?: SlashDefinition
  readonly suggested?: boolean
}

const switchActions: ActionDefinition[] = SWITCH_SLOTS.map((slot) => ({
  id: `hotkeys.switch.${slot}` as const,
  title: `Switch to session ${slot}`,
  description: `Jump to quick slot ${slot} (pinned sessions first, then recent sessions).`,
  group: "Hotkeys: switching",
}))

export const ACTIONS: readonly ActionDefinition[] = [
  {
    id: "hotkeys.new",
    title: "New session",
    description: "Open the new-session composer.",
    group: "Hotkeys: sessions",
    suggested: true,
  },
  {
    id: "hotkeys.picker",
    title: "Session picker",
    description: "Open OpenCode's session list and switch to a session.",
    group: "Hotkeys: sessions",
    slash: { name: "sessions", aliases: ["switch"] },
    suggested: true,
  },
  {
    id: "hotkeys.next",
    title: "Next session",
    description: "Switch to the next recent session.",
    group: "Hotkeys: switching",
  },
  {
    id: "hotkeys.prev",
    title: "Previous session",
    description: "Switch to the previous recent session.",
    group: "Hotkeys: switching",
  },
  ...switchActions,
  {
    id: "hotkeys.studio",
    title: "Hotkey Studio",
    description: "Search, inspect, and rebind every Hotkeys action.",
    group: "Hotkeys: settings",
    slash: { name: "keys", aliases: ["hotkey-studio"] },
    suggested: true,
  },
  {
    id: "hotkeys.help",
    title: "Hotkeys help",
    description: "Show the active preset, shortcuts, and quick fixes.",
    group: "Hotkeys: settings",
    slash: { name: "hotkeys", aliases: ["hotkeys-help"] },
    suggested: true,
  },
  {
    id: "hotkeys.doctor",
    title: "Hotkeys doctor",
    description: "Check OpenCode compatibility, conflicts, and terminal caveats.",
    group: "Hotkeys: settings",
  },
]

export const ACTION_BY_ID = new Map<ActionId, ActionDefinition>(
  ACTIONS.map((action) => [action.id, action]),
)

export const ACTION_IDS = ACTIONS.map((action) => action.id)

export function isActionId(value: string): value is ActionId {
  return ACTION_BY_ID.has(value as ActionId)
}

export function isSwitchAction(id: ActionId): id is SwitchActionId {
  return id.startsWith("hotkeys.switch.")
}

export function switchSlot(id: SwitchActionId): SwitchSlot {
  return Number(id.slice("hotkeys.switch.".length)) as SwitchSlot
}
