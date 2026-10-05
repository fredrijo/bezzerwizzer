import { COLORS, DECKS, type GameState, type Phase, type TeamColor } from "@/game/types.ts"

const KEY = "bezzerwizzer-night-v1"

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // The table can keep playing even if the browser refuses storage.
  }
}

export function clearGame(): void {
  localStorage.removeItem(KEY)
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isGameState(parsed)) return null
    return hydrate(parsed)
  } catch {
    return null
  }
}

function hydrate(state: GameState): GameState {
  const phase: Phase = state.phase === "play" || state.phase === "done" || state.phase === "swap" ? state.phase : "swap"
  const legacy = state as GameState & { bezzerThief?: TeamColor | null }
  const bezzerQueue = Array.isArray(state.bezzerQueue)
    ? state.bezzerQueue
    : legacy.bezzerThief
      ? [legacy.bezzerThief]
      : []
  return {
    ...state,
    phase,
    turn: typeof state.turn === "number" ? state.turn : 0,
    addons: Array.isArray(state.addons) ? state.addons : [],
    respondent: state.respondent ?? null,
    bezzerQueue,
    pendingPoints: COLORS.includes(state.pendingPoints as TeamColor) ? (state.pendingPoints as TeamColor) : null,
    teams: state.teams.map((team) => ({
      ...team,
      swapsLeft: typeof team.swapsLeft === "number" ? team.swapsLeft : 1,
      bezzersLeft: typeof team.bezzersLeft === "number" ? team.bezzersLeft : 2,
    })),
  }
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false
  const candidate = value as GameState
  if (!Array.isArray(candidate.teams) || candidate.teams.length < 2 || candidate.teams.length > 4) {
    return false
  }
  if (!DECKS.includes(candidate.deck)) return false
  if (typeof candidate.round !== "number") return false
  return candidate.teams.every(
    (team) =>
      typeof team?.color === "string" &&
      typeof team.name === "string" &&
      typeof team.position === "number" &&
      Array.isArray(team.tiles) &&
      team.tiles.length === 4,
  )
}
