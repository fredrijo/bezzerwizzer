import { categoryById, poolFor } from "@/game/categories.ts"
import {
  COLORS,
  DEFAULT_NAMES,
  NAME_LIMIT,
  quietEffect,
  type DeckId,
  type Direction,
  type GameEffect,
  type GameState,
  type LogEntry,
  type LogTone,
  type NewGameConfig,
  type Result,
  type Rng,
  type Team,
  type TeamColor,
  type TileRef,
} from "@/game/types.ts"

export const TRACK: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0, y: 5 },
  { x: 0, y: 4 },
  { x: 0, y: 3 },
  { x: 0, y: 2 },
  { x: 0, y: 1 },
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 4, y: 0 },
  { x: 5, y: 0 },
  { x: 5, y: 1 },
  { x: 5, y: 2 },
  { x: 5, y: 3 },
  { x: 5, y: 4 },
  { x: 5, y: 5 },
  { x: 4, y: 5 },
  { x: 3, y: 5 },
  { x: 2, y: 5 },
  { x: 1, y: 5 },
]

export const LAP = TRACK.length

let seq = 0

export function uid(): string {
  seq += 1
  return `e${seq.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = copy[index]!
    copy[index] = copy[swap]!
    copy[swap] = current
  }
  return copy
}

export function getTeam(state: GameState, color: TeamColor): Team {
  const team = state.teams.find((candidate) => candidate.color === color)
  if (!team) throw new Error(`Ukjent lag ${color}`)
  return team
}

export function squareFor(team: Team): { x: number; y: number } {
  if (team.won) return { x: 0, y: 5 }
  return TRACK[team.position] ?? TRACK[0]!
}

export function stepsTaken(team: Team): number {
  return team.won ? LAP : team.position
}

export function onHomeStretch(team: Team): boolean {
  if (team.won) return false
  const square = TRACK[team.position]
  return Boolean(square && square.y === 5 && square.x > 0)
}

export function effectiveChance(state: GameState): number {
  if (state.festMode) return 100
  return Math.min(92, state.streakChance + state.streak * 10)
}

export function cellKind(x: number, y: number): "hidden" | "start" | "brake" | "track" {
  const onTrack = TRACK.some((cell) => cell.x === x && cell.y === y)
  if (!onTrack) return "hidden"
  if (x === 0 && y === 5) return "start"
  if (y === 5 && x > 0) return "brake"
  return "track"
}

function result(state: GameState, effect: GameEffect = quietEffect(), actor: TeamColor | null = null): Result {
  return { state, effect, actor }
}

function pushLog(state: GameState, text: string, tone: LogTone): GameState {
  const entry: LogEntry = { id: uid(), text, tone }
  return { ...state, log: [entry, ...state.log].slice(0, 40) }
}

function withTeams(state: GameState, teams: Team[]): GameState {
  return { ...state, teams }
}

function replaceTeam(state: GameState, team: Team): GameState {
  return withTeams(
    state,
    state.teams.map((candidate) => (candidate.color === team.color ? team : candidate)),
  )
}

function noteStreakers(state: GameState, count: number): GameState {
  if (count <= 0) return state
  return { ...state, streakersSeen: state.streakersSeen + count }
}

export function rollStreakers(state: GameState, steps: number, rng: Rng): number {
  const chance = effectiveChance(state)
  const rolls = 1 + (steps >= 4 ? 1 : 0)
  let hits = 0
  for (let roll = 0; roll < rolls; roll += 1) {
    if (rng() * 100 < chance) hits += 1
  }
  return Math.min(3, hits)
}

type Advance = { team: Team; moved: number; wonNow: boolean }

function advance(team: Team, direction: Direction, steps: number): Advance {
  let current = team
  let moved = 0
  let wonNow = false
  for (let step = 0; step < steps; step += 1) {
    if (current.won) break
    if (direction === "back" && current.position === 0) break
    if (direction === "forward" && current.position >= LAP - 1) {
      current = {
        ...current,
        won: true,
        position: 0,
        stats: { ...current.stats, forward: current.stats.forward + 1 },
      }
      moved += 1
      wonNow = true
      break
    }
    if (direction === "forward") {
      current = {
        ...current,
        position: current.position + 1,
        stats: { ...current.stats, forward: current.stats.forward + 1 },
      }
    } else {
      current = {
        ...current,
        position: current.position - 1,
        stats: { ...current.stats, backward: current.stats.backward + 1 },
      }
    }
    moved += 1
  }
  return { team: current, moved, wonNow }
}

function deal(deck: DeckId, teamCount: number, addons: readonly string[], rng: Rng): string[][] {
  const pool = shuffle(poolFor(deck, addons), rng)
  return Array.from({ length: teamCount }, (_, index) =>
    pool.slice(index * 4, index * 4 + 4).map((category) => category.id),
  )
}

export function createGame(config: NewGameConfig, rng: Rng = Math.random): GameState {
  const teamCount = Math.min(4, Math.max(2, Math.round(config.teamCount)))
  const addons = config.addons ?? []
  const hands = deal(config.deck, teamCount, addons, rng)
  const teams: Team[] = COLORS.slice(0, teamCount).map((color, index) => ({
    color,
    name: config.names[color].trim().slice(0, NAME_LIMIT) || DEFAULT_NAMES[color],
    position: 0,
    won: false,
    tiles: hands[index]!.map((categoryId) => ({ categoryId, used: false })) as Team["tiles"],
    stats: { forward: 0, backward: 0, correct: 0, wrong: 0 },
    swapsLeft: 1,
    bezzersLeft: 2,
  }))
  return {
    teams,
    order: shuffle(teams.map((team) => team.color), rng),
    deck: config.deck,
    addons,
    round: 1,
    phase: "swap",
    turn: 0,
    respondent: null,
    bezzerQueue: [],
    pendingPoints: null,
    streakChance: clampChance(config.streakChance),
    festMode: config.festMode,
    streak: 0,
    bestStreak: 0,
    streakersSeen: 0,
    doubleNext: null,
    winner: null,
    log: [{ id: uid(), text: "Banen er klar. Bytt \u00e9n kategori om dere vil, og start runden.", tone: "round" }],
  }
}
