import { describe, expect, test } from "bun:test"
import {
  moveSelection,
  nextIndex,
  sessionTitle,
  sortRecentSessions,
  type SessionSummary,
} from "../src/core/sessions"

const sessions: SessionSummary[] = [
  { id: "a", title: "Alpha", time: { updated: 100 } },
  { id: "b", title: "Beta", time: { updated: 300 } },
  { id: "child", parentID: "a", title: "Child", time: { updated: 500 } },
  { id: "archived", title: "Archived", time: { updated: 600, archived: 700 } },
  { id: "c", time: { updated: 200 } },
]

describe("sessions", () => {
  test("sorts roots by most recent update", () => {
    expect(sortRecentSessions(sessions).map((session) => session.id)).toEqual(["b", "c", "a"])
  })

  test("handles circular next/previous indexes", () => {
    expect(nextIndex(2, 3, 1)).toBe(0)
    expect(nextIndex(0, 3, -1)).toBe(2)
    expect(nextIndex(-1, 3, 1)).toBe(0)
    expect(nextIndex(-1, 3, -1)).toBe(2)
    expect(nextIndex(0, 0, 1)).toBe(-1)
  })

  test("moves a selection through a list", () => {
    expect(moveSelection(["a", "b", "c"], "a", 1)).toBe("b")
    expect(moveSelection(["a", "b", "c"], "c", 1)).toBe("a")
    expect(moveSelection(["a", "b", "c"], undefined, -1)).toBe("c")
    expect(moveSelection([], "a", 1)).toBeUndefined()
  })

  test("falls back for untitled sessions", () => {
    expect(sessionTitle({ id: "x" })).toBe("Untitled session")
    expect(sessionTitle({ id: "x", title: "  " })).toBe("Untitled session")
    expect(sessionTitle({ id: "x", title: " Work " })).toBe("Work")
  })
})
