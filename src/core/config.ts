import { ACTION_IDS, isActionId, type ActionId } from "./actions"
import { normalizeBindings } from "./keys"
import { DEFAULT_PRESET, isPresetName, PRESETS, type PresetName } from "./presets"

export type BindingOverride = string | readonly string[] | false

export type HotkeysOptions = {
  enabled?: boolean
  preset?: PresetName
  bindings?: Partial<Record<string, BindingOverride>>
  debug?: boolean
}

export type ResolvedConfig = {
  readonly enabled: boolean
  readonly preset: PresetName
  readonly presetLabel: string
  readonly presetExplicit: boolean
  readonly bindings: Readonly<Record<ActionId, readonly string[]>>
  readonly overrides: Readonly<Partial<Record<ActionId, readonly string[]>>>
  readonly debug: boolean
}

export type ResolveResult = {
  readonly config: ResolvedConfig
  readonly warnings: readonly string[]
}

const ACTION_ID_SET = new Set<string>(ACTION_IDS)

function emptyBindings(): Record<ActionId, string[]> {
  return Object.fromEntries(ACTION_IDS.map((id) => [id, [] as string[]])) as Record<
    ActionId,
    string[]
  >
}

export function resolveOptions(raw: unknown): ResolveResult {
  const warnings: string[] = []
  const options: HotkeysOptions = raw && typeof raw === "object" ? (raw as HotkeysOptions) : {}

  if (raw !== undefined && (raw === null || typeof raw !== "object")) {
    warnings.push("Plugin options must be an object; using the native preset.")
  }

  let preset: PresetName = DEFAULT_PRESET
  const presetExplicit = options.preset !== undefined
  if (options.preset !== undefined) {
    if (isPresetName(options.preset)) {
      preset = options.preset
    } else {
      warnings.push(
        `Unknown preset "${String(options.preset)}"; falling back to "${DEFAULT_PRESET}".`,
      )
    }
  }

  const enabled = options.enabled !== false
  const debug = options.debug === true

  const bindings: Record<ActionId, string[]> = emptyBindings()
  for (const [id, keys] of Object.entries(PRESETS[preset].bindings)) {
    bindings[id as ActionId] = normalizeBindings(keys ?? [])
  }

  const overrides: Partial<Record<ActionId, string[]>> = {}
  if (options.bindings !== undefined) {
    if (!options.bindings || typeof options.bindings !== "object") {
      warnings.push("bindings must be an object keyed by action id.")
    } else {
      for (const [id, value] of Object.entries(options.bindings)) {
        if (!ACTION_ID_SET.has(id) || !isActionId(id)) {
          warnings.push(`Unknown action id in bindings: "${id}".`)
          continue
        }

        if (value === false) {
          bindings[id] = []
          overrides[id] = []
          continue
        }

        if (typeof value !== "string" && !Array.isArray(value)) {
          warnings.push(`Binding for "${id}" must be a string, an array of strings, or false.`)
          continue
        }

        const normalized = normalizeBindings(
          typeof value === "string" ? [value] : (value as readonly string[]),
        )
        bindings[id] = normalized
        overrides[id] = normalized
      }
    }
  }

  return {
    config: {
      enabled,
      preset,
      presetLabel: PRESETS[preset].label,
      presetExplicit,
      bindings,
      overrides,
      debug,
    },
    warnings,
  }
}

export function activeBindingEntries(
  config: ResolvedConfig,
): Array<{ actionId: ActionId; bindings: readonly string[] }> {
  return ACTION_IDS.map((actionId) => ({
    actionId,
    bindings: config.bindings[actionId],
  }))
}
