import { describe, expect, test } from "bun:test"
import { DEFAULT_PRESET, PRESETS } from "../src/core/presets"
import { defaultNativeBindings, findConflicts } from "../src/core/conflicts"
import { normalizeKey } from "../src/core/keys"

describe("presets", () => {
  test("defaults to the safe native preset", () => {
    expect(DEFAULT_PRESET).toBe("native")
    expect(PRESETS[DEFAULT_PRESET].bindings["hotkeys.new"]).toEqual(["alt+t"])
  })

  test("native preset is free of conflicts with OpenCode defaults", () => {
    expect(findConflicts(PRESETS.native.bindings, defaultNativeBindings())).toEqual([])
  })

  test("browser preset intentionally shadows variant cycling with Ctrl+T", () => {
    const conflicts = findConflicts(PRESETS.browser.bindings, defaultNativeBindings())
    expect(conflicts).toContainEqual({
      key: "ctrl+t",
      actionId: "hotkeys.new",
      native: ["variant.cycle"],
      severity: "warning",
    })
  })

  test("notes preset keeps its quick-switcher shortcuts free of native conflicts", () => {
    expect(findConflicts(PRESETS.notes.bindings, defaultNativeBindings())).toEqual([])
  })

  test("every preset key is normalized", () => {
    for (const preset of Object.values(PRESETS)) {
      for (const keys of Object.values(preset.bindings)) {
        for (const key of keys ?? []) {
          expect(key).toBe(normalizeKey(key))
        }
      }
    }
  })

  test("each preset binds nine switch slots", () => {
    for (const preset of Object.values(PRESETS)) {
      const bindings = preset.bindings as Record<string, readonly string[] | undefined>
      for (let slot = 1; slot <= 9; slot += 1) {
        expect(bindings[`hotkeys.switch.${slot}`]?.length).toBe(1)
      }
    }
  })
})

test("shipped preset files match the runtime presets", async () => {
  const { readFile } = await import("node:fs/promises")
  for (const [name, preset] of Object.entries(PRESETS)) {
    const shipped = JSON.parse(
      await readFile(new URL(`../presets/${name}.json`, import.meta.url), "utf8"),
    )
    expect(shipped.name).toBe(name)
    expect(shipped.label).toBe(preset.label)
    expect(shipped.bindings).toEqual(preset.bindings)
  }
})
