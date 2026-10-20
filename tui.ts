import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { Plugin } from "@opencode/plugin/tui"
import { createV1Runtime } from "./src/adapters/v1"
import { setupV2 } from "./src/adapters/v2"
import { resolveOptions } from "./src/core/config"
import { PLUGIN_ID } from "./src/core/meta"

const tui: TuiPlugin = async (api, options) => {
  const { config, warnings } = resolveOptions(options)
  if (!config.enabled) return
  createV1Runtime(api, config, warnings)
  if (config.debug) {
    try {
      const names = api.keymap
        .getCommands({ visibility: "registered" })
        .map((command) => String(command.name))
      api.kv.set("opencode-hotkeys:registered", {
        method: typeof api.keymap.registerLayer === "function" ? "layer" : "legacy",
        hotkeys: names.filter((name) => name.includes("hotkeys")),
        palette: names.filter((name) => name.startsWith("palette.")),
      })
    } catch (error) {
      api.kv.set("opencode-hotkeys:registered", {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

const setup: Plugin.Definition["setup"] = async (context) => {
  await setupV2(context)
}

export default {
  id: PLUGIN_ID,
  setup,
  tui,
} satisfies TuiPluginModule & Plugin.Definition
