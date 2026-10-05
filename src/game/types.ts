export const COLORS = ["red", "green", "blue", "pink"] as const
export type TeamColor = (typeof COLORS)[number]

export const DECKS = ["classic", "edition2020", "party"] as const
export type DeckId = (typeof DECKS)[number]

export type Direction = "forward" | "back"

export type Category = {
  id: string
  name: string
  icon: string
  blurb: string
  iconFile?: string
}

export type Phase = "swap" | "play" | "done"

export type Tile = {
  categoryId: string
  used: boolean
}

export type TeamStats = {
  forward: number
  backward: number
  correct: number
  wrong: number
}

export type Team = {
  color: TeamColor
  name: string
  position: number
  won: boolean
  tiles: [Tile, Tile, Tile, Tile]
  stats: TeamStats
  /** One category swap with another team, refreshed each round. */
  swapsLeft: number
  /** Two Bezzerwizzer bricks, refreshed each round. */
  bezzersLeft: number
}

export type LogTone = "move" | "streak" | "shock" | "swap" | "round" | "win" | "twist"

export type LogEntry = {
  id: string
  text: string
  tone: LogTone
}

export type GameState = {
  teams: Team[]
  order: TeamColor[]
  deck: DeckId
  addons: string[]
  round: number
  phase: Phase
  /** Questions answered in this round. Category index is floor(turn / teams). */
  turn: number
  /** Set when the team whose turn it is has missed and a queued team is answering. */
  respondent: TeamColor | null
  /** Teams waiting to answer this question if the current answer is wrong, in press order. */
  bezzerQueue: TeamColor[]
  /** Set after a besserwisser team answers correctly, until the table picks 1 or 3 points. */
  pendingPoints: TeamColor | null
  streakChance: number
  festMode: boolean
  streak: number
  bestStreak: number
  streakersSeen: number
  doubleNext: TeamColor | null
  log: LogEntry[]
  winner: TeamColor | null
}

export type GameEffect = {
  clap: boolean
  shock: boolean
  blip: boolean
  fanfare: boolean
  chime: boolean
  streakers: number
  parade: boolean
  banner: string | null
}

export type Result = {
  state: GameState
  effect: GameEffect
  actor: TeamColor | null
}

export type TileRef = {
  color: TeamColor
  index: number
}

export type Rng = () => number

export type NewGameConfig = {
  teamCount: number
  names: Record<TeamColor, string>
  deck: DeckId
  addons?: string[]
  streakChance: number
  festMode: boolean
}

export const TEAM_STYLE: Record<
  TeamColor,
  { base: string; ink: string; label: string }
> = {
  red: { base: "#ff3b5c", ink: "#3a0610", label: "Rød" },
  green: { base: "#1ec96b", ink: "#042414", label: "Grønn" },
  blue: { base: "#3d8bff", ink: "#041428", label: "Blå" },
  pink: { base: "#ff5ad4", ink: "#3a0630", label: "Rosa" },
}

export const NAME_LIMIT = 32

export const DEFAULT_NAMES: Record<TeamColor, string> = {
  red: "Mjaalands",
  green: "Hengemyra",
  blue: "Professorlaget",
  pink: "Tissemann og tissefrue",
}

export const quietEffect = (): GameEffect => ({
  clap: false,
  shock: false,
  blip: false,
  fanfare: false,
  chime: false,
  streakers: 0,
  parade: false,
  banner: null,
})
