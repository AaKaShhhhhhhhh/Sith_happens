// Remembers which player this browser is, per room, so a phone can rejoin
// its private role screen without re-entering details.
const key = (code: string) => `md:player:${code.toUpperCase()}`

export function savePlayerId(code: string, playerId: string) {
  try {
    localStorage.setItem(key(code), playerId)
  } catch {
    /* ignore */
  }
}

export function getPlayerId(code: string): string | null {
  try {
    return localStorage.getItem(key(code))
  } catch {
    return null
  }
}
