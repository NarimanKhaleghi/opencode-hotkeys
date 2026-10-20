import type { Layer } from "@opentui/keymap"
import type { KeyEvent, Renderable } from "@opentui/core"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import {
  ACTIONS,
  ACTION_BY_ID,
  isActionId,
  isSwitchAction,
  switchSlot,
  type ActionId,
} from "../core/actions"
import { resolveOptions, type ResolvedConfig } from "../core/config"
import {
  bindingMapFromLookup,
  findConflicts,
  formatConflict,
  terminalCaveats,
} from "../core/conflicts"
import { formatBindings } from "../core/keys"
import { PLUGIN_NAME, PLUGIN_VERSION, STUDIO_NAME } from "../core/meta"
import { isPresetName } from "../core/presets"
import { createV1Studio } from "../studio/v1"
import {
  describeSession,
  sessionTitle,
  sortRecentSessions,
  type SessionSummary,
} from "../core/sessions"

type ToastVariant = "info" | "success" | "warning" | "error"

export type V1Runtime = {
  readonly dispose: () => void
  readonly reload: (config: ResolvedConfig) => void
}

type SavedStudioState = {
  readonly preset?: unknown
  readonly overrides?: unknown
}

function restoreStudioOverrides(api: TuiPluginApi, base: ResolvedConfig): ResolvedConfig {
  try {
    const saved = api.kv.get("opencode-hotkeys:studio") as SavedStudioState | undefined
    if (!saved || typeof saved !== "object") return base

    const raw =
      saved.overrides && typeof saved.overrides === "object"
        ? (saved.overrides as Record<string, unknown>)
        : {}
    const bindings: Record<string, string[] | false> = {}
    for (const [id, value] of Object.entries(raw)) {
      if (!isActionId(id)) continue
      if (value === false) {
        bindings[id] = false
        continue
      }
      if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
        bindings[id] = value as string[]
      }
    }

    for (const [id, value] of Object.entries(base.overrides)) {
      if (value !== undefined) bindings[id] = [...value]
    }

    const preset = base.presetExplicit || !isPresetName(saved.preset) ? base.preset : saved.preset

    return resolveOptions({ preset, bindings, debug: base.debug }).config
  } catch {
    return base
  }
}

export function createV1Runtime(
  api: TuiPluginApi,
  initialConfig: ResolvedConfig,
  warnings: readonly string[],
): V1Runtime {
  let config = restoreStudioOverrides(api, initialConfig)
  let unregister: (() => void) | undefined

  const toast = (message: string, variant: ToastVariant = "info", title = "Hotkeys"): void => {
    try {
      api.ui.toast({
        title,
        message,
        variant,
        duration: variant === "error" ? 8000 : 5000,
      })
    } catch {
      // Older releases may not have a working toast surface yet.
    }
  }

  const alert = (title: string, message: string): void => {
    try {
      api.ui.dialog.replace(() => api.ui.DialogAlert({ title, message }))
    } catch {
      toast(message, "info", title)
    }
  }

  const navigateToSession = (sessionID: string): void => {
    try {
      api.route.navigate("session", { sessionID })
      if (config.debug) {
        api.kv.set("opencode-hotkeys:route", api.route.current)
      }
    } catch {
      toast(`Could not open session ${sessionID}.`, "error")
    }
  }

  const loadSessions = async (): Promise<SessionSummary[]> => {
    const directory = api.state.path.directory || api.state.path.worktree
    const result = await api.client.session.list({
      ...(directory ? { directory } : {}),
      roots: true,
      limit: 100,
    })
    return sortRecentSessions((result.data ?? []) as SessionSummary[])
  }

  const currentSessionID = (): string | undefined => {
    const route = api.route.current as { name: string; params?: Record<string, unknown> }
    return typeof route.params?.sessionID === "string" ? route.params.sessionID : undefined
  }

  const createSession = async (): Promise<void> => {
    if (config.debug) {
      api.kv.set("opencode-hotkeys:new", { step: "start", at: Date.now() })
    }
    try {
      const result = await api.client.session.create({})
      if (config.debug) {
        api.kv.set("opencode-hotkeys:new", {
          step: "created",
          id: result.data?.id,
          error: result.error ?? null,
          at: Date.now(),
        })
      }
      if (result.data) {
        navigateToSession(result.data.id)
        return
      }
      toast("Could not create a new session.", "error")
    } catch (error) {
      if (config.debug) {
        api.kv.set("opencode-hotkeys:new", {
          step: "error",
          error: error instanceof Error ? error.message : String(error),
          at: Date.now(),
        })
      }
      toast("Could not create a new session.", "error")
    }
  }

  const pickSession = async (): Promise<void> => {
    let sessions: SessionSummary[]
    try {
      sessions = await loadSessions()
    } catch {
      toast("Could not load sessions.", "error")
      return
    }

    if (sessions.length === 0) {
      toast("No sessions yet. Press Alt+T to create one.", "info")
      return
    }

    const current = currentSessionID()
    try {
      api.ui.dialog.replace(() =>
        api.ui.DialogSelect<string>({
          title: "Switch session",
          placeholder: "Search sessions…",
          current,
          options: sessions.slice(0, 50).map((session) => ({
            title: sessionTitle(session),
            value: session.id,
            description: describeSession(session),
          })),
          onSelect: (option) => {
            api.ui.dialog.clear()
            if (option.value !== current) navigateToSession(option.value)
          },
        }),
      )
    } catch {
      toast("The session picker is not available in this OpenCode build.", "warning")
    }
  }

  const cycleSession = async (direction: 1 | -1): Promise<void> => {
    let sessions: SessionSummary[]
    try {
      sessions = await loadSessions()
    } catch {
      toast("Could not load sessions.", "error")
      return
    }

    if (sessions.length === 0) {
      toast("No sessions yet. Press Alt+T to create one.", "info")
      return
    }

    const current = currentSessionID()
    const index = current ? sessions.findIndex((session) => session.id === current) : -1
    const nextIndex =
      index === -1
        ? direction === 1
          ? 0
          : sessions.length - 1
        : (index + direction + sessions.length) % sessions.length

    const next = sessions[nextIndex]
    if (next) navigateToSession(next.id)
  }

  const jumpToQuickSlot = async (slot: number): Promise<void> => {
    let sessions: SessionSummary[]
    try {
      sessions = await loadSessions()
    } catch {
      toast("Could not load sessions.", "error")
      return
    }

    const target = sessions[slot - 1]
    if (!target) {
      toast(`Quick slot ${slot} is empty.`, "info")
      return
    }
    navigateToSession(target.id)
  }

  const showHelp = (): void => {
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
      ...(warnings.length ? ["", ...warnings.map((warning) => `! ${warning}`)] : []),
    ]

    alert(PLUGIN_NAME, lines.join("\n"))
  }

  const showDoctor = (): void => {
    const native = bindingMapFromLookup(api.tuiConfig.keybinds)
    const conflicts = findConflicts(config.bindings, native)
    const caveats = terminalCaveats(config.bindings)
    const modern = typeof api.keymap?.registerLayer === "function"

    const lines = [
      `${PLUGIN_NAME} ${PLUGIN_VERSION}`,
      `OpenCode: ${api.app.version}`,
      `Preset: ${config.presetLabel}`,
      `Keymap API: ${modern ? "modern (layered)" : "legacy (command register)"}`,
      conflicts.length === 0 ? "Conflicts: none" : `Conflicts: ${conflicts.length}`,
      ...conflicts.slice(0, 8).map((conflict) => `- ${formatConflict(conflict)}`),
      ...(caveats.length ? ["", "Terminal notes:", ...caveats.map((caveat) => `- ${caveat}`)] : []),
    ]

    if (conflicts.length === 0 && caveats.length === 0) {
      lines.push("", "Everything looks good.")
    }

    alert("Hotkeys doctor", lines.join("\n"))
  }

  let studio: ReturnType<typeof createV1Studio> | undefined

  const execute = async (actionId: ActionId): Promise<void> => {
    try {
      if (config.debug) {
        api.kv.set("opencode-hotkeys:last-action", { id: actionId, at: Date.now() })
      }
      if (actionId === "hotkeys.new") {
        await createSession()
        return
      }

      if (actionId === "hotkeys.picker") {
        await pickSession()
        return
      }

      if (actionId === "hotkeys.next") {
        await cycleSession(1)
        return
      }

      if (actionId === "hotkeys.prev") {
        await cycleSession(-1)
        return
      }

      if (isSwitchAction(actionId)) {
        await jumpToQuickSlot(switchSlot(actionId))
        return
      }

      if (actionId === "hotkeys.help") {
        showHelp()
        return
      }

      if (actionId === "hotkeys.doctor") {
        showDoctor()
        return
      }

      if (actionId === "hotkeys.studio") {
        studio?.open()
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error), "error")
    }
  }

  const buildLayer = (): Layer<Renderable, KeyEvent> => {
    const commands = ACTIONS.map((action) => ({
      namespace: isSwitchAction(action.id) ? "hotkeys" : "palette",
      name: action.id,
      title: action.title,
      desc: action.description,
      description: action.description,
      category: action.group,
      suggested: action.suggested,
      slashName: action.slash?.name,
      slashAliases: action.slash?.aliases ? [...action.slash.aliases] : undefined,
      run: () => execute(action.id),
    }))

    const bindings = ACTIONS.flatMap((action) =>
      config.bindings[action.id].map((key) => ({
        key,
        cmd: action.id,
        desc: action.title,
        group: "Hotkeys",
      })),
    )

    return {
      priority: 20,
      commands,
      bindings,
    }
  }

  const registerLegacy = (): void => {
    if (!api.command?.register) {
      toast("This OpenCode build has no keymap or command API. Please update OpenCode.", "error")
      return
    }

    unregister = api.command.register(() =>
      ACTIONS.map((action) => ({
        title: action.title,
        value: action.id,
        description: action.description,
        category: action.group,
        keybind: config.bindings[action.id][0],
        suggested: action.suggested,
        slash: action.slash
          ? {
              name: action.slash.name,
              aliases: action.slash.aliases ? [...action.slash.aliases] : undefined,
            }
          : undefined,
        onSelect: () => execute(action.id),
      })),
    )
  }

  const register = (): void => {
    if (typeof api.keymap?.registerLayer === "function") {
      try {
        unregister = api.keymap.registerLayer(buildLayer())
        if (config.debug) {
          api.kv.set("opencode-hotkeys:register", { method: "layer", ok: true })
        }
        return
      } catch (error) {
        if (config.debug) {
          api.kv.set("opencode-hotkeys:register", {
            method: "layer",
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
        toast(
          `Layer registration failed: ${error instanceof Error ? error.message : String(error)}`,
          "warning",
        )
      }
    }
    registerLegacy()
    if (config.debug) {
      api.kv.set("opencode-hotkeys:register", { method: "legacy", ok: true })
    }
  }

  const reload = (next: ResolvedConfig): void => {
    try {
      unregister?.()
    } finally {
      unregister = undefined
      config = next
      register()
    }
  }

  register()

  studio = createV1Studio({
    api,
    config,
    baselineOverrides: initialConfig.overrides,
    reload: () => reload(config),
    toast,
    alert,
  })

  api.lifecycle.onDispose(() => {
    unregister?.()
    unregister = undefined
  })

  if (warnings.length > 0) {
    toast(warnings.join(" "), "warning")
  }
  if (config.debug) {
    try {
      api.kv.set("opencode-hotkeys:last-load", {
        version: PLUGIN_VERSION,
        preset: config.preset,
        at: Date.now(),
      })
    } catch {
      // Debug metadata is best-effort only.
    }
  }

  return {
    dispose: () => {
      unregister?.()
      unregister = undefined
    },
    reload,
  }
}
