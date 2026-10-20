export type SessionSummary = {
  id: string
  title?: string
  parentID?: string
  time?: { created?: number; updated?: number; archived?: number }
}

export function isRootSession(session: SessionSummary): boolean {
  return !session.parentID && !session.time?.archived
}

export function sortRecentSessions<T extends SessionSummary>(sessions: readonly T[]): T[] {
  return sessions
    .filter(isRootSession)
    .slice()
    .sort((a, b) => (b.time?.updated ?? 0) - (a.time?.updated ?? 0))
}

export function sessionTitle(session: SessionSummary): string {
  return session.title?.trim() || "Untitled session"
}

export function describeSession(session: SessionSummary): string {
  const updated = session.time?.updated
  if (!updated) return session.id
  return `${relativeTime(updated)} · ${session.id}`
}

export function relativeTime(timestamp: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function nextIndex(current: number, length: number, direction: 1 | -1): number {
  if (length === 0) return -1
  if (current < 0 || current >= length) return direction === 1 ? 0 : length - 1
  return (current + direction + length) % length
}

export function moveSelection<T>(
  items: readonly T[],
  current: T | undefined,
  direction: 1 | -1,
): T | undefined {
  if (items.length === 0) return undefined
  const index = current === undefined ? -1 : items.indexOf(current)
  const target = nextIndex(index, items.length, direction)
  return target < 0 ? undefined : items[target]
}
