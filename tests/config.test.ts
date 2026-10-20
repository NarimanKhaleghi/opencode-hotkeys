import { describe, expect, test } from "bun:test"
import { resolveOptions } from "../src/core/config"

describe("resolveOptions", () => {
  test("uses the native preset by default", () => {
    const { config, warnings } = resolveOptions(undefined)
    expect(warnings).toEqual([])
    expect(config.enabled).toBe(true)
    expect(config.preset).toBe("native")
    expect(config.bindings["hotkeys.new"]).toEqual(["alt+t"])
    expect(config.bindings["hotkeys.switch.1"]).toEqual(["alt+1"])
  })

  test("switches presets", () => {
    const { config } = resolveOptions({ preset: "browser" })
    expect(config.preset).toBe("browser")
    expect(config.bindings["hotkeys.new"]).toEqual(["ctrl+t"])
    expect(config.bindings["hotkeys.next"]).toEqual(["ctrl+tab"])
  })

  test("applies and records overrides", () => {
    const { config } = resolveOptions({
      bindings: {
        "hotkeys.new": "ctrl+n",
        "hotkeys.switch.1": ["alt+q", "alt+shift+q"],
        "hotkeys.help": false,
      },
    })

    expect(config.bindings["hotkeys.new"]).toEqual(["ctrl+n"])
    expect(config.bindings["hotkeys.switch.1"]).toEqual(["alt+q", "alt+shift+q"])
    expect(config.bindings["hotkeys.help"]).toEqual([])
    expect(config.overrides["hotkeys.new"]).toEqual(["ctrl+n"])
    expect(config.overrides["hotkeys.help"]).toEqual([])
  })

  test("supports comma separated override strings", () => {
    const { config } = resolveOptions({ bindings: { "hotkeys.picker": "alt+o, alt+shift+o" } })
    expect(config.bindings["hotkeys.picker"]).toEqual(["alt+o", "alt+shift+o"])
  })

  test("warns about unknown presets and actions", () => {
    const { config, warnings } = resolveOptions({
      preset: "vim" as never,
      bindings: { "hotkeys.unknown": "alt+u" },
    })

    expect(config.preset).toBe("native")
    expect(warnings).toContain('Unknown preset "vim"; falling back to "native".')
    expect(warnings).toContain('Unknown action id in bindings: "hotkeys.unknown".')
  })

  test("warns about malformed binding values", () => {
    const { warnings } = resolveOptions({
      bindings: { "hotkeys.new": 42 as never },
    })
    expect(warnings).toContain(
      'Binding for "hotkeys.new" must be a string, an array of strings, or false.',
    )
  })

  test("honors enabled false and debug true", () => {
    const { config } = resolveOptions({ enabled: false, debug: true })
    expect(config.enabled).toBe(false)
    expect(config.debug).toBe(true)
  })
})
