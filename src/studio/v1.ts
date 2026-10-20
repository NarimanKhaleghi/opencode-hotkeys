import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { ACTIONS, type ActionId } from "../core/actions"
import { resolveOptions, type ResolvedConfig } from "../core/config"
import { bindingMapFromLookup, findConflicts } from "../core/conflicts"
import { formatBindings, keyFromKeyEvent, normalizeBindings } from "../core/keys"
import { PLUGIN_ID, STUDIO_NAME } from "../core/meta"
import { PRESETS, type PresetName } from "../core/presets"

type ToastVariant = "info" | "success" | "warning" | "error"

type MutableConfig = {
  bindings: Record<ActionId, readonly string[]>
  overrides: Partial<Record<ActionId, readonly string[]>>
  preset: PresetName
  presetLabel: string
  debug: boolean
}

export type V1StudioDeps = {
  readonly api: TuiPluginApi
  readonly config: ResolvedConfig
  readonly baselineOverrides: ResolvedConfig["overrides"]
  readonly reload: () => void
  readonly toast: (message: string, variant?: ToastVariant) => void
  readonly alert: (title: string, message: string) => void
}

const PRESET_VALUES = Object.entries(PRESETS) as Array<[PresetName, (typeof PRESETS)[PresetName]]>

export function createV1Studio(deps: V1StudioDeps) {
  const { api, config, reload, toast, alert } = deps
  const mutable = config as unknown as MutableConfig
  const initialOverrides: Partial<Record<ActionId, readonly string[]>> = {
    ...deps.baselineOverrides,
  }

  const bindingsLabel = (id: ActionId): string =>
    formatBindings(mutable.bindings[id]) || "unassigned"

  const showSelect = (
    title: string,
    placeholder: string,
    options: Array<{
      title: string
      value: string
      description?: string
      category?: string
      disabled?: boolean
    }>,
    onSelect: (value: string) => void,
  ): void => {
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect<string>({
        title,
        placeholder,
        options,
        onSelect: (option) => {
          if (option.disabled) return
          api.ui.dialog.clear()
          onSelect(option.value)
        },
      }),
    )
  }

  const persistHint = (): string => {
    const bindings = Object.fromEntries(
      Object.entries(mutable.overrides).filter(([, keys]) => keys !== undefined),
    )
    const snippet = {
      plugin: [
        [
          PLUGIN_ID,
          {
            preset: mutable.preset,
            ...(Object.keys(bindings).length ? { bindings } : {}),
          },
        ],
      ],
    }
    return [
      "Studio changes are saved in OpenCode's local state and restored on restart.",
      "To share or pin them, copy this into tui.json:",
      "",
      JSON.stringify(snippet, null, 2),
    ].join("\n")
  }

  const studioOverrides = (): Partial<Record<ActionId, readonly string[]>> =>
    Object.fromEntries(
      Object.entries(mutable.overrides).filter(
        ([id, keys]) => JSON.stringify(keys) !== JSON.stringify(initialOverrides[id as ActionId]),
      ),
    ) as Partial<Record<ActionId, readonly string[]>>

  const persistChanges = (): void => {
    try {
      api.kv.set("opencode-hotkeys:studio", {
        preset: mutable.preset,
        overrides: studioOverrides(),
        at: Date.now(),
      })
    } catch {
      // Debug metadata is best-effort only.
    }
  }

  const commit = (actionId: ActionId, keys: readonly string[]): void => {
    mutable.bindings[actionId] = keys
    mutable.overrides[actionId] = keys
    persistChanges()
    reload()
    const action = ACTIONS.find((entry) => entry.id === actionId)
    toast(`${action?.title ?? actionId}: ${formatBindings(keys)}`, "success")
    open()
  }

  const preview = (actionId: ActionId, keys: readonly string[]): void => {
    const action = ACTIONS.find((entry) => entry.id === actionId)
    const internal = ACTIONS.find(
      (entry) =>
        entry.id !== actionId && keys.some((key) => mutable.bindings[entry.id].includes(key)),
    )
    const native = findConflicts(
      { ...mutable.bindings, [actionId]: keys },
      bindingMapFromLookup(api.tuiConfig.keybinds),
    ).find((conflict) => conflict.actionId === actionId)

    if (!internal && !native) {
      commit(actionId, keys)
      return
    }

    const reasons: string[] = []
    if (internal) {
      reasons.push(`Already used by “${internal.title}”.`)
    }
    if (native) {
      reasons.push(`OpenCode already uses ${native.key} for ${native.native.join(", ")}.`)
    }
    const message = [
      `Assign ${formatBindings(keys)} to “${action?.title ?? actionId}”?`,
      "",
      ...reasons,
      "",
      "You can still override it; the host shortcut may stop working.",
    ].join("\n")

    api.ui.dialog.replace(() =>
      api.ui.DialogConfirm({
        title: "Shortcut conflict",
        message,
        onConfirm: () => {
          api.ui.dialog.clear()
          commit(actionId, keys)
        },
        onCancel: () => {
          api.ui.dialog.clear()
          open()
        },
      }),
    )
  }

  const capture = (actionId: ActionId): void => {
    const action = ACTIONS.find((entry) => entry.id === actionId)
    api.ui.dialog.clear()
    toast(`Press a key combination for “${action?.title ?? actionId}”… Esc cancels.`, "info")

    let finished = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let dispose: (() => void) | undefined

    const finish = (key: string | null): void => {
      if (finished) return
      finished = true
      if (timer) clearTimeout(timer)
      dispose?.()
      if (key === null) {
        open()
        return
      }
      const keys = normalizeBindings([key])
      if (keys.length === 0) {
        toast(`“${key}” is not a valid shortcut.`, "warning")
        open()
        return
      }
      preview(actionId, keys)
    }

    try {
      dispose = api.keymap.intercept(
        "key",
        (ctx) => {
          if (ctx.event.name === "escape" || ctx.event.name === "esc") {
            ctx.consume({ preventDefault: true, stopPropagation: true })
            finish(null)
            return
          }
          const key = keyFromKeyEvent(ctx.event)
          if (!key) return
          ctx.consume({ preventDefault: true, stopPropagation: true })
          finish(key)
        },
        { priority: 1000 },
      )
    } catch {
      toast("This OpenCode build cannot capture keys.", "warning")
      open()
      return
    }

    timer = setTimeout(() => {
      finish(null)
      toast("Key capture timed out.", "warning")
    }, 15000)
  }

  const resetAction = (actionId: ActionId): void => {
    const overrides = { ...mutable.overrides }
    const original = initialOverrides[actionId]
    if (original === undefined) {
      delete overrides[actionId]
    } else {
      overrides[actionId] = original
    }
    const next = resolveOptions({
      preset: mutable.preset,
      bindings: overrides,
      debug: mutable.debug,
    })
    Object.assign(mutable, next.config)
    persistChanges()
    reload()
    toast(`Reset “${ACTIONS.find((entry) => entry.id === actionId)?.title ?? actionId}”.`, "info")
    open()
  }

  const openAction = (actionId: ActionId): void => {
    const action = ACTIONS.find((entry) => entry.id === actionId)
    if (!action) {
      open()
      return
    }

    showSelect(
      action.title,
      "Choose an action…",
      [
        {
          title: "Rebind shortcut",
          value: "rebind",
          description: "Capture the next key combination",
          category: "Edit",
        },
        {
          title: "Clear shortcut",
          value: "clear",
          description: "Leave this action without a key",
          category: "Edit",
        },
        {
          title: "Reset to preset",
          value: "reset",
          description: `Restore ${bindingsLabel(actionId)} from ${mutable.presetLabel}`,
          category: "Edit",
        },
        { title: "Back to studio", value: "back", category: "Navigate" },
      ],
      (value) => {
        if (value === "rebind") {
          capture(actionId)
          return
        }
        if (value === "clear") {
          commit(actionId, [])
          return
        }
        if (value === "reset") {
          resetAction(actionId)
          return
        }
        open()
      },
    )
  }

  const setPreset = (preset: PresetName): void => {
    const next = resolveOptions({
      preset,
      bindings: mutable.overrides,
      debug: mutable.debug,
    })
    Object.assign(mutable, next.config)
    persistChanges()
    reload()
    toast(`Preset: ${mutable.presetLabel}`, "success")
    open()
  }

  const openPreset = (): void => {
    showSelect(
      "Preset",
      "Choose a preset…",
      PRESET_VALUES.map(([name, preset]) => ({
        title: preset.label,
        value: name,
        description: preset.description,
        category: "Presets",
        disabled: name === mutable.preset,
      })),
      (value) => setPreset(value as PresetName),
    )
  }

  const resetAll = (): void => {
    api.ui.dialog.replace(() =>
      api.ui.DialogConfirm({
        title: "Reset all shortcuts?",
        message: "This removes every studio override and restores the selected preset.",
        onConfirm: () => {
          api.ui.dialog.clear()
          const next = resolveOptions({
            preset: mutable.preset,
            bindings: initialOverrides,
            debug: mutable.debug,
          })
          Object.assign(mutable, next.config)
          persistChanges()
          reload()
          toast("All hotkey overrides were reset.", "info")
          open()
        },
        onCancel: () => {
          api.ui.dialog.clear()
          open()
        },
      }),
    )
  }

  function open(): void {
    const options = [
      {
        title: `Preset: ${mutable.presetLabel}`,
        value: "__preset",
        description: "Switch the base preset",
        category: "Studio",
      },
      {
        title: "Reset all overrides",
        value: "__reset",
        description: "Restore the selected preset",
        category: "Studio",
      },
      {
        title: "How to persist changes",
        value: "__persist",
        description: "Show the tui.json snippet",
        category: "Studio",
      },
      ...ACTIONS.map((action) => ({
        title: `${action.title} (${bindingsLabel(action.id)})`,
        value: action.id,
        description: action.description,
        category: action.group,
      })),
    ]

    showSelect(STUDIO_NAME, "Search actions…", options, (value) => {
      if (value === "__preset") {
        openPreset()
        return
      }
      if (value === "__reset") {
        resetAll()
        return
      }
      if (value === "__persist") {
        alert(STUDIO_NAME, persistHint())
        return
      }
      openAction(value as ActionId)
    })
  }

  return { open }
}
