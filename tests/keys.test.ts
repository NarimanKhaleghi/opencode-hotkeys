import { describe, expect, test } from "bun:test"
import {
  formatBinding,
  formatBindings,
  keyFromKeyEvent,
  normalizeBindings,
  normalizeKey,
  splitBindingList,
} from "../src/core/keys"

describe("keys", () => {
  test("normalizes modifiers and aliases", () => {
    expect(normalizeKey("Alt+T")).toBe("alt+t")
    expect(normalizeKey("option + t")).toBe("alt+t")
    expect(normalizeKey("Ctrl+Shift+Tab")).toBe("ctrl+shift+tab")
    expect(normalizeKey("pgdn")).toBe("pagedown")
    expect(normalizeKey("Return")).toBe("enter")
  })

  test("keeps modifier order stable", () => {
    expect(normalizeKey("shift+ctrl+alt+k")).toBe("ctrl+alt+shift+k")
  })

  test("splits binding lists", () => {
    expect(splitBindingList("alt+t, alt+o")).toEqual(["alt+t", "alt+o"])
    expect(splitBindingList(["alt+t", " ", "alt+o"])).toEqual(["alt+t", "alt+o"])
  })

  test("normalizes and deduplicates binding arrays", () => {
    expect(normalizeBindings(["Alt+T", "alt+t", "alt+o"])).toEqual(["alt+t", "alt+o"])
  })

  test("formats bindings for humans", () => {
    expect(formatBinding("alt+pagedown")).toBe("Alt+PageDown")
    expect(formatBinding("ctrl+1")).toBe("Ctrl+1")
    expect(formatBindings(["alt+t", "alt+o"])).toBe("Alt+T, Alt+O")
    expect(formatBindings([])).toBe("unassigned")
  })

  test("builds a binding string from a key event", () => {
    expect(keyFromKeyEvent({ name: "t", meta: true })).toBe("alt+t")
    expect(keyFromKeyEvent({ name: "tab", ctrl: true, shift: true })).toBe("ctrl+shift+tab")
    expect(keyFromKeyEvent({ name: "escape" })).toBe("esc")
    expect(keyFromKeyEvent({ name: "shift" })).toBeUndefined()
  })
})
