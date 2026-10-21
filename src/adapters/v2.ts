import type { Plugin } from "@opencode/plugin/tui"
import { ACTIONS, ACTION_BY_ID, isSwitchAction, switchSlot, type ActionId } from "../core/actions"
import { resolveOptions, type ResolvedConfig } from "../core/config"
import {
  findConflicts,
  formatConflict,
  terminalCaveats,
  type NativeBindingMap,
} from "../core/conflicts"
import { formatBindings, normalizeKey } from "../core/keys"
import { PLUGIN_NAME, PLUGIN_VERSION, STUDIO_NAME } from "../core/meta"
import {
  describeSession,
  nextIndex,
  sessionTitle,
  sortRecentSessions,
  type SessionSummary,
} from "../core/sessions"

export type V2Context = Parameters<Plugin.Definition["setup"]>[0]

type OpenTab = {
  readonly sessionID: string
  readonly title?: string
  readonly active: boolean
}

type ToastVariant = "info" | "success" | "warning" | "error"

export async function setupV2(ctx: V2Context): Promise<void> {
  const { config, warnings } = resolveOptions(ctx.options)
  if (!config.enabled) return

  ctx.keymap.layer(() => buildLayer(ctx, config))

  if (warnings.length > 0) {
    toast(ctx, warnings.join(" "), "warning")
  }
}

function buildLayer(ctx: V2Context, config: ResolvedConfig) {
  const commands = []

  for (const action of ACTIONS) {
    const keys = config.bindings[action.id]
    const palette = isSwitchAction(action.id) ? undefined : (true as const)
    const slash = action.slash
      ? {
          name: action.slash.name,
          aliases: action.slash.aliases ? [...action.slash.aliases] : undefined,
          ...(action.slash.arguments ? { arguments: true as const } : {}),
        }
      : undefined

    const base = {
      title: action.title,
      description: action.description,
      group: action.group,
      suggested: action.suggested,
      palette,
      slash,
      run: () => execute(ctx, config, action.id),
    }

    if (keys.length === 0) {
      commands.push({ id: action.id, ...base })
      continue
    }

    keys.forEach((key, index) => {
      commands.push({
        ...base,
        ...(index === 0 ? { id: action.id } : {}),
        title: index === 0 ? action.title : `${action.title} (${key})`,
        bind: key,
        palette: index === 0 ? palette : undefined,
        slash: index === 0 ? slash : undefined,
      })
    })
  }

  return {
    mode: "global",
    priority: 20,
    commands,
  }
}

async function execute(ctx: V2Context, config: ResolvedConfig, actionId: ActionId): Promise<void> {
  try {
    if (actionId === "hotkeys.new") {
      const info = await ctx.client.session.create({})
      focusSession(ctx, info.id)
      return
    }

    if (actionId === "hotkeys.picker") {
      await pickSession(ctx)
      return
    }

    if (actionId === "hotkeys.next") {
      await cycleSession(ctx, 1)
      return
    }

    if (actionId === "hotkeys.prev") {
      await cycleSession(ctx, -1)
      return
    }

    if (isSwitchAction(actionId)) {
      await goToSlot(ctx, switchSlot(actionId))
      return
    }

    if (actionId === "hotkeys.help") {
      await showHelp(ctx, config)
      return
    }

    if (actionId === "hotkeys.doctor") {
      await showDoctor(ctx, config)
      return
    }

    if (actionId === "hotkeys.studio") {
      await openStudio(ctx, config)
    }
  } catch (error) {
    toast(ctx, error instanceof Error ? error.message : String(error), "error")
  }
}

function tabsEnabled(ctx: V2Context): boolean {
  try {
    return ctx.ui.tabs.enabled()
  } catch {
    return false
  }
}

function openTabs(ctx: V2Context): readonly OpenTab[] {
  try {
    return tabsEnabled(ctx) ? ctx.ui.tabs.list() : []
  } catch {
    return []
  }
}

function currentSessionID(ctx: V2Context): string | undefined {
  const route = ctx.ui.router.current()
  return route.type === "session" ? route.sessionID : undefined
}

function focusSession(ctx: V2Context, sessionID: string): void {
  try {
    if (tabsEnabled(ctx) && ctx.ui.tabs.focus(sessionID)) return
  } catch {
    // Fall through to navigation.
  }

  try {
    ctx.ui.router.navigate({ type: "session", sessionID })
  } catch {
    toast(ctx, `Could not open session ${sessionID}.`, "error")
  }
}

async function loadSessions(ctx: V2Context): Promise<SessionSummary[]> {
  try {
    const response = await ctx.client.session.list({
      limit: 100,
      order: "desc",
      parentID: null,
    })
    return sortRecentSessions((response.data ?? []) as SessionSummary[])
  } catch {
    return sortRecentSessions(ctx.data.session.list() as SessionSummary[])
  }
}

async function pickSession(ctx: V2Context): Promise<void> {
  let sessions: SessionSummary[]
  try {
    sessions = await loadSessions(ctx)
  } catch {
    toast(ctx, "Could not load sessions.", "error")
    return
  }

  if (sessions.length === 0) {
    toast(ctx, "No sessions yet. Press Alt+T to create one.", "info")
    return
  }

  const current = currentSessionID(ctx)
  const value = await ctx.ui.dialog.select<string>({
    title: "Switch session",
    placeholder: "Search sessions…",
    current,
    options: sessions.slice(0, 100).map((session) => ({
      title: sessionTitle(session),
      value: session.id,
      description: describeSession(session),
    })),
    search: (query, options) => {
      const needle = query.trim().toLowerCase()
      if (!needle) return options
      return options.filter(
        (option) =>
          option.title.toLowerCase().includes(needle) ||
          (option.description?.toLowerCase().includes(needle) ?? false) ||
          String(option.value).toLowerCase().includes(needle),
      )
    },
  })

  if (value && value !== current) focusSession(ctx, value)
}

async function cycleSession(ctx: V2Context, direction: 1 | -1): Promise<void> {
  const tabs = openTabs(ctx)
  if (tabs.length > 1) {
    const active = tabs.findIndex((tab) => tab.active)
    const target = tabs[nextIndex(active, tabs.length, direction)]
    if (target) {
      focusSession(ctx, target.sessionID)
      return
    }
  }

  let sessions: SessionSummary[]
  try {
    sessions = await loadSessions(ctx)
  } catch {
    toast(ctx, "Could not load sessions.", "error")
    return
  }

  if (sessions.length === 0) {
    toast(ctx, "No sessions yet. Press Alt+T to create one.", "info")
    return
  }

  const current = currentSessionID(ctx)
  const index = current ? sessions.findIndex((session) => session.id === current) : -1
  const target = sessions[nextIndex(index, sessions.length, direction)]
  if (target) focusSession(ctx, target.id)
}

async function goToSlot(ctx: V2Context, slot: number): Promise<void> {
  const tabs = openTabs(ctx)
  if (tabs.length >= slot) {
    const tab = tabs[slot - 1]
    if (tab) {
      focusSession(ctx, tab.sessionID)
      return
    }
  }

  let sessions: SessionSummary[]
  try {
    sessions = await loadSessions(ctx)
  } catch {
    toast(ctx, "Could not load sessions.", "error")
    return
  }

  const target = sessions[slot - 1]
  if (target) {
    focusSession(ctx, target.id)
    return
  }

  toast(ctx, `No session in slot ${slot}.`, "info")
}

async function showHelp(ctx: V2Context, config: ResolvedConfig): Promise<void> {
  const lines = [
    `${PLUGIN_NAME} ${PLUGIN_VERSION}`,
    `Preset: ${config.presetLabel}`,
    "",
    ...ACTIONS.filter(
      (action) =>
        !isSwitchAction(action.id) ||
        (config.bindings[action.id] && config.bindings[action.id].length > 0),
    ).map((action) => {
      const keys = formatBindings(config.bindings[action.id]) || "Not bound"
      return `${keys.padEnd(26)} ${action.title}`
    }),
    "",
    `Open ${STUDIO_NAME}: /keys`,
    "Change defaults in tui.json → plugin options.",
  ]

  await alert(ctx, PLUGIN_NAME, lines.join("\n"))
}

async function showDoctor(ctx: V2Context, config: ResolvedConfig): Promise<void> {
  const conflicts = findConflicts(config.bindings, nativeBindingMap(ctx))
  const caveats = terminalCaveats(config.bindings)
  const tabs = tabsEnabled(ctx)

  const lines = [
    `${PLUGIN_NAME} ${PLUGIN_VERSION}`,
    `OpenCode: ${ctx.app.version}`,
    `Preset: ${config.presetLabel}`,
    "Keymap API: v2 (layered)",
    `Session tabs: ${tabs ? "enabled" : "disabled"}`,
    conflicts.length === 0 ? "Conflicts: none" : `Conflicts: ${conflicts.length}`,
    ...conflicts.slice(0, 8).map((conflict) => `- ${formatConflict(conflict)}`),
    ...(caveats.length ? ["", "Terminal notes:", ...caveats.map((caveat) => `- ${caveat}`)] : []),
  ]

  if (conflicts.length === 0 && caveats.length === 0) {
    lines.push("", "Everything looks good.")
  }

  await alert(ctx, "Hotkeys doctor", lines.join("\n"))
}

async function openStudio(ctx: V2Context, config: ResolvedConfig): Promise<void> {
  const value = await ctx.ui.dialog.select<string>({
    title: `${STUDIO_NAME} (preview)`,
    placeholder: "Search actions…",
    options: ACTIONS.map((action) => ({
      title: action.title,
      value: action.id,
      description: formatBindings(config.bindings[action.id]) || "Not bound",
      category: action.group,
    })),
  })

  if (!value) return
  const action = ACTION_BY_ID.get(value as ActionId)
  if (!action) return

  await alert(
    ctx,
    action.title,
    [
      action.description,
      "",
      `Bindings: ${formatBindings(config.bindings[action.id]) || "Not bound"}`,
      "",
      "Editing is available in the classic TUI. For this runtime, set it in tui.json → plugin options.",
    ].join("\n"),
  )
}

function nativeBindingMap(ctx: V2Context): NativeBindingMap {
  const map: NativeBindingMap = {}

  const add = (key: string, name: string): void => {
    const normalized = normalizeKey(key)
    if (!normalized) return
    const bucket = map[normalized] ?? (map[normalized] = [])
    if (!bucket.includes(name)) bucket.push(name)
  }

  try {
    for (const command of ctx.keymap.commands()) {
      if (!command.id || command.id.startsWith("hotkeys.")) continue
      if (typeof command.bind === "string") add(command.bind, command.id)
      for (const shortcut of ctx.keymap.shortcuts(command.id)) add(shortcut, command.id)
    }
  } catch {
    // Conflict inspection is best-effort.
  }

  return map
}

function toast(
  ctx: V2Context,
  message: string,
  variant: ToastVariant = "info",
  title = "Hotkeys",
): void {
  try {
    ctx.ui.toast.show({
      title,
      message,
      variant,
      duration: variant === "error" ? 8000 : 5000,
    })
  } catch {
    // The toast surface may not be ready yet.
  }
}

async function alert(ctx: V2Context, title: string, message: string): Promise<void> {
  try {
    await ctx.ui.dialog.alert({ title, message })
  } catch {
    toast(ctx, message, "info", title)
  }
}
