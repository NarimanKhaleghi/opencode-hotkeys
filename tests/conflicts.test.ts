import { describe, expect, test } from "bun:test"
import {
  bindingMapFromLookup,
  bindingMapFromTuiConfig,
  defaultNativeBindings,
  findConflicts,
  formatConflict,
  terminalCaveats,
} from "../src/core/conflicts"

describe("conflicts", () => {
  test("builds a normalized native binding map from tui config", () => {
    const map = bindingMapFromTuiConfig({
      session_new: "ctrl+n",
      command_list: "ctrl+p, alt+p",
    })
    expect(map["ctrl+n"]).toEqual(["session_new"])
    expect(map["ctrl+p"]).toEqual(["command_list"])
    expect(map["alt+p"]).toEqual(["command_list"])
  })

  test("builds a native map from the runtime binding lookup", () => {
    const map = bindingMapFromLookup({
      bindings: [
        { key: "Ctrl+N", cmd: "session.new" },
        { key: "alt+t", cmd: "hotkeys.new" },
        { key: "ctrl+p", cmd: () => undefined },
      ],
    })
    expect(map["ctrl+n"]).toEqual(["session.new"])
    expect(map["alt+t"]).toBeUndefined()
    expect(map["ctrl+p"]).toBeUndefined()
  })

  test("detects conflicts and formats them", () => {
    const conflicts = findConflicts({ "hotkeys.new": ["ctrl+t"] }, defaultNativeBindings())
    expect(conflicts).toHaveLength(1)
    expect(formatConflict(conflicts[0]!)).toBe("ctrl+t is also used by OpenCode (variant.cycle)")
  })

  test("returns terminal caveats for intercepted keys", () => {
    const caveats = terminalCaveats(
      { "hotkeys.next": ["ctrl+tab"], "hotkeys.switch.1": ["ctrl+1"] },
      "linux",
    )
    expect(caveats).toContain("Ctrl+Tab is often intercepted by terminal emulators or tmux.")
    expect(caveats).toContain("Ctrl+1..9 is often used by terminals to switch terminal tabs.")
  })

  test("adds a macOS Option-as-Meta note", () => {
    const caveats = terminalCaveats({ "hotkeys.new": ["alt+t"] }, "darwin")
    expect(caveats.some((caveat) => caveat.includes("Option as Meta"))).toBe(true)
  })
})
