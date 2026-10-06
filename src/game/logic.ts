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
    log: [{ id: uid(), text: "Banen er klar. Bytt én kategori om dere vil, og start runden.", tone: "round" }],
  }
}

function clampChance(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function renameTeam(state: GameState, color: TeamColor, name: string): GameState {
  return replaceTeam(state, { ...getTeam(state, color), name: name.slice(0, NAME_LIMIT) })
}

export function setStreakChance(state: GameState, streakChance: number): GameState {
  return { ...state, streakChance: clampChance(streakChance) }
}

export function setFestMode(state: GameState, festMode: boolean): GameState {
  return { ...state, festMode }
}

export function nudge(state: GameState, color: TeamColor, direction: Direction, rng: Rng = Math.random): Result {
  const team = getTeam(state, color)
  if (team.won) {
    return result(state, { ...quietEffect(), banner: `${team.name} er allerede i mål.` }, color)
  }
  const moved = advance(team, direction, 1)
  if (moved.moved === 0) {
    return result(state, { ...quietEffect(), banner: `${team.name} står på start og kan ikke rygge.` }, color)
  }
  let next = replaceTeam(state, moved.team)
  const streak = direction === "forward" ? state.streak + 1 : 0
  const chanceState = direction === "forward" ? { ...next, streak } : next
  const streakers = rollStreakers(chanceState, 1, rng)
  next = {
    ...next,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    winner: moved.wonNow && !state.winner ? color : state.winner,
    doubleNext: state.doubleNext,
  }
  next = noteStreakers(next, streakers)
  const verb = direction === "forward" ? "ett felt frem" : "ett felt tilbake"
  const text = moved.wonNow ? `${team.name} fullfører banen!` : `${team.name} flytter ${verb}.`
  next = pushLog(next, text, moved.wonNow ? "win" : "move")
  return result(
    next,
    {
      ...quietEffect(),
      blip: true,
      fanfare: moved.wonNow,
      streakers,
      banner: moved.wonNow ? `${team.name} vinner banen` : null,
    },
    color,
  )
}

export function awardCorrect(
  state: GameState,
  color: TeamColor,
  tileIndex: number,
  rng: Rng = Math.random,
): Result {
  const team = getTeam(state, color)
  const tile = team.tiles[tileIndex]
  if (!tile) return result(state, quietEffect(), color)
  const category = categoryById(tile.categoryId)
  const base = tileIndex + 1
  const home = onHomeStretch(team)
  const doubled = state.doubleNext === color && !team.won && !home
  const steps = team.won ? 0 : home ? 1 : base * (doubled ? 2 : 1)
  const moved = steps === 0 ? { team, moved: 0, wonNow: false } : advance(team, "forward", steps)
  const tiles = team.tiles.map((candidate, index) =>
    index === tileIndex ? { ...candidate, used: true } : candidate,
  ) as Team["tiles"]
  const nextTeam: Team = {
    ...moved.team,
    tiles,
    stats: { ...moved.team.stats, correct: team.stats.correct + 1 },
  }
  let next = replaceTeam(state, nextTeam)
  const streak = state.streak + 1
  next = {
    ...next,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    doubleNext: doubled ? null : state.doubleNext,
    winner: moved.wonNow && !state.winner ? color : state.winner,
  }
  const streakers = team.won ? 0 : rollStreakers(next, steps, rng)
  next = noteStreakers(next, streakers)
  const text = moved.wonNow
    ? `${team.name} svarte riktig på ${category.name} og fullfører banen!`
    : team.won
      ? `${team.name} har allerede vunnet. ${category.name} merkes som brukt.`
      : home
        ? `${team.name} svarte riktig på ${category.name}. Prikkfeltet gir ett felt.`
        : `${team.name} svarte riktig på ${category.name} og flytter ${moved.moved} felt${doubled ? " (dobbelt)" : ""}.`
  next = pushLog(next, text, moved.wonNow ? "win" : "move")
  return result(
    next,
    {
      ...quietEffect(),
      clap: true,
      blip: moved.moved > 0,
      fanfare: moved.wonNow,
      streakers,
      banner: moved.wonNow
        ? `${team.name} vinner banen`
        : home
          ? "Prikkfelt: riktig svar gir ett felt"
          : doubled
            ? `Dobbelt! ${category.name} gir ${moved.moved} felt`
            : null,
    },
    color,
  )
}

export function awardWrong(state: GameState, color: TeamColor, tileIndex: number): Result {
  const team = getTeam(state, color)
  const tile = team.tiles[tileIndex]
  if (!tile) return result(state, quietEffect(), color)
  const category = categoryById(tile.categoryId)
  const moved = team.won ? { team, moved: 0, wonNow: false } : advance(team, "back", 1)
  const tiles = team.tiles.map((candidate, index) =>
    index === tileIndex ? { ...candidate, used: true } : candidate,
  ) as Team["tiles"]
  const nextTeam: Team = {
    ...moved.team,
    tiles,
    stats: { ...moved.team.stats, wrong: team.stats.wrong + 1 },
  }
  let next = replaceTeam(state, nextTeam)
  next = { ...next, streak: 0 }
  next = pushLog(
    next,
    moved.moved > 0
      ? `${team.name} bommet på ${category.name} og rykker ett felt tilbake.`
      : `${team.name} bommet på ${category.name}.`,
    "shock",
  )
  return result(
    next,
    {
      ...quietEffect(),
      shock: true,
      blip: moved.moved > 0,
      banner: `Støt! ${category.name} gikk galt for ${team.name}.`,
    },
    color,
  )
}

export function toggleUsed(state: GameState, color: TeamColor, tileIndex: number): Result {
  const team = getTeam(state, color)
  const tile = team.tiles[tileIndex]
  if (!tile) return result(state, quietEffect(), color)
  const used = !tile.used
  const tiles = team.tiles.map((candidate, index) =>
    index === tileIndex ? { ...candidate, used } : candidate,
  ) as Team["tiles"]
  const category = categoryById(tile.categoryId)
  let next = replaceTeam(state, { ...team, tiles })
  next = pushLog(
    next,
    used ? `${team.name} legger ${category.name} til side.` : `${team.name} henter frem ${category.name} igjen.`,
    "move",
  )
  return result(next, { ...quietEffect(), clap: used }, color)
}

export function swapTiles(state: GameState, source: TileRef, target: TileRef, free = false): Result {
  if (source.color === target.color && source.index === target.index) {
    return result(state, quietEffect(), source.color)
  }
  const fromTeam = getTeam(state, source.color)
  const toTeam = getTeam(state, target.color)
  const fromTile = fromTeam.tiles[source.index]
  const toTile = toTeam.tiles[target.index]
  if (!fromTile || !toTile) return result(state, quietEffect(), source.color)
  const cross = source.color !== target.color
  if (!free && state.pendingPoints) {
    return result(state, { ...quietEffect(), banner: "Velg 1 eller 3 poeng før dere zwapper." }, source.color)
  }
  if (!free && (fromTile.used || toTile.used)) {
    return result(state, { ...quietEffect(), banner: "Snudde brikker kan ikke zwappes." }, source.color)
  }
  if (!free && state.phase === "done") {
    return result(state, { ...quietEffect(), banner: "Runden er ferdig." }, source.color)
  }

  let payer: TeamColor | null = null
  if (!free && state.phase === "play") {
    const question = currentQuestion(state)
    if (!question || state.respondent) {
      return result(state, { ...quietEffect(), banner: "Zwap legges på egen tur, før dere svarer." }, source.color)
    }
    const actor = getTeam(state, question.color)
    if (actor.swapsLeft <= 0) {
      return result(state, { ...quietEffect(), banner: `${actor.name} har brukt zwap.` }, question.color)
    }
    payer = question.color
  } else if (!free && cross) {
    if (fromTeam.swapsLeft <= 0) {
      return result(state, { ...quietEffect(), banner: `${fromTeam.name} har brukt zwap.` }, source.color)
    }
    payer = source.color
  }

  const teams = state.teams.map((team) => {
    if (source.color === target.color && team.color === source.color) {
      const tiles = team.tiles.slice() as Team["tiles"]
      tiles[source.index] = toTile
      tiles[target.index] = fromTile
      return { ...team, tiles, swapsLeft: payer === team.color ? team.swapsLeft - 1 : team.swapsLeft }
    }
    if (team.color !== source.color && team.color !== target.color) {
      if (payer !== team.color) return team
      return { ...team, swapsLeft: team.swapsLeft - 1 }
    }
    const tiles = team.tiles.slice() as Team["tiles"]
    if (team.color === source.color) tiles[source.index] = toTile
    if (team.color === target.color) tiles[target.index] = fromTile
    return { ...team, tiles, swapsLeft: payer === team.color ? team.swapsLeft - 1 : team.swapsLeft }
  })
  const fromName = categoryById(fromTile.categoryId).name
  const toName = categoryById(toTile.categoryId).name
  const payerName = payer ? getTeam(state, payer).name : fromTeam.name
  let next = withTeams(state, teams)
  if (!free && state.phase === "play" && next.bezzerQueue.length > 0) {
    const question = currentQuestion(state)
    const hitsQuestion =
      question !== null &&
      ((source.color === question.color && source.index === question.tileIndex) ||
        (target.color === question.color && target.index === question.tileIndex))
    if (hitsQuestion) {
      for (const color of next.bezzerQueue) {
        const queued = getTeam(next, color)
        next = replaceTeam(next, { ...queued, bezzersLeft: Math.min(2, queued.bezzersLeft + 1) })
      }
      next = pushLog(next, "Besserwisser-køen trekkes tilbake. Ny kategori, ny sjanse.", "swap")
      next = { ...next, bezzerQueue: [] }
    }
  }
  next = pushLog(
    next,
    payer
      ? `${payerName} zwappet ${fromName} med ${toName}. Zwap er brukt.`
      : `${fromTeam.name} byttet ${fromName} og ${toName}.`,
    "swap",
  )
  return result(next, { ...quietEffect(), blip: true, banner: `${fromName} ↔ ${toName}` }, payer ?? source.color)
}

export function newRound(state: GameState, rng: Rng = Math.random): Result {
  const hands = deal(state.deck, state.teams.length, state.addons, rng)
  const teams = state.teams.map((team, index) => ({
    ...team,
    swapsLeft: 1,
    bezzersLeft: 2,
    tiles: hands[index]!.map((categoryId) => ({ categoryId, used: false })) as Team["tiles"],
  }))
  const round = state.round + 1
  let next: GameState = {
    ...state,
    teams,
    order: shuffle(state.teams.map((team) => team.color), rng),
    round,
    phase: "swap",
    turn: 0,
    respondent: null,
    bezzerQueue: [],
    pendingPoints: null,
    streak: 0,
    doubleNext: null,
  }
  const streakers = rng() * 100 < (state.festMode ? 80 : 18) ? 1 : 0
  next = noteStreakers(next, streakers)
  next = pushLog(next, `Runde ${round}. Nye kategorier er delt ut. Bytt før dere starter.`, "round")
  const actor = next.order[0] ?? null
  return result(
    next,
    { ...quietEffect(), blip: true, streakers, banner: `Runde ${round}. Bytt, så start.` },
    actor,
  )
}

export type Question = {
  color: TeamColor
  tileIndex: number
  points: number
}

export function currentQuestion(state: GameState): Question | null {
  if (state.phase !== "play" || state.winner) return null
  const count = state.order.length
  if (count === 0) return null
  const tileIndex = Math.floor(state.turn / count)
  if (tileIndex < 0 || tileIndex > 3) return null
  const color = state.order[state.turn % count]
  if (!color) return null
  return { color, tileIndex, points: tileIndex + 1 }
}

export function startRound(state: GameState, rng: Rng = Math.random): Result {
  if (state.winner) {
    return result(state, { ...quietEffect(), banner: "Banen er allerede vunnet." }, state.winner)
  }
  if (state.phase === "play") {
    return result(state, { ...quietEffect(), banner: "Runden er allerede i gang." }, currentQuestion(state)?.color ?? null)
  }
  if (state.phase === "done") {
    return result(state, { ...quietEffect(), banner: "Del ut en ny runde før dere starter." }, null)
  }
  const order = shuffle(state.teams.map((team) => team.color), rng)
  const names = order.map((color) => getTeam(state, color).name).join(", ")
  let next: GameState = {
    ...state,
    order,
    phase: "play",
    turn: 0,
    respondent: null,
    bezzerQueue: [],
    pendingPoints: null,
  }
  next = pushLog(next, `Runden starter. Rekkefølge: ${names}.`, "round")
  const first = order[0]
  const category = first ? categoryById(getTeam(next, first).tiles[0]!.categoryId).name : ""
  return result(
    next,
    {
      ...quietEffect(),
      chime: true,
      banner: first ? `${getTeam(next, first).name} starter med ${category}` : "Runden starter",
    },
    first ?? null,
  )
}

function advanceTurn(scored: Result): Result {
  const count = scored.state.order.length
  const turn = scored.state.turn + 1
  const phase = turn >= count * 4 ? "done" : "play"
  let next: GameState = { ...scored.state, turn, phase, respondent: null, bezzerQueue: [], pendingPoints: null }
  if (phase === "done" && !next.winner) {
    next = pushLog(next, "Alle fire kategorier er spilt.", "round")
  }
  return result(next, scored.effect, scored.actor)
}

function markAsked(state: GameState, color: TeamColor, tileIndex: number): GameState {
  const team = getTeam(state, color)
  const tiles = team.tiles.map((tile, index) => (index === tileIndex ? { ...tile, used: true } : tile)) as Team["tiles"]
  return replaceTeam(state, { ...team, tiles })
}

function scoreThief(state: GameState, question: Question, thiefColor: TeamColor, points: 1 | 3, rng: Rng): Result {
  const asked = getTeam(state, question.color)
  const thief = getTeam(state, thiefColor)
  const category = categoryById(asked.tiles[question.tileIndex]!.categoryId)
  let next = markAsked(state, question.color, question.tileIndex)
  const home = onHomeStretch(thief)
  const doubled = next.doubleNext === thiefColor && !thief.won && !home
  const steps = thief.won ? 0 : home ? 1 : points * (doubled ? 2 : 1)
  const moved = steps === 0
    ? { team: getTeam(next, thiefColor), moved: 0, wonNow: false }
    : advance(getTeam(next, thiefColor), "forward", steps)
  const nextTeam: Team = {
    ...moved.team,
    stats: { ...moved.team.stats, correct: thief.stats.correct + 1 },
  }
  next = replaceTeam(next, nextTeam)
  const streak = state.streak + 1
  next = {
    ...next,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    doubleNext: doubled ? null : next.doubleNext,
    winner: moved.wonNow && !state.winner ? thiefColor : state.winner,
  }
  const streakers = thief.won ? 0 : rollStreakers(next, moved.moved, rng)
  next = noteStreakers(next, streakers)
  const text = moved.wonNow
    ? `${thief.name} tar ${category.name} med besserwisser og fullfører banen!`
    : home
      ? `${thief.name} tar ${points} poeng på ${category.name}. Prikkfeltet gir ett felt.`
      : `${thief.name} tar ${points} poeng på ${category.name} og flytter ${moved.moved} felt${doubled ? " (dobbelt)" : ""}.`
  next = pushLog(next, text, moved.wonNow ? "win" : "move")
  return result(
    next,
    {
      ...quietEffect(),
      clap: true,
      blip: moved.moved > 0,
      fanfare: moved.wonNow,
      streakers,
      banner: `${thief.name} tar poengene`,
    },
    thiefColor,
  )
}

function penalize(state: GameState, color: TeamColor): Result {
  const team = getTeam(state, color)
  const moved = team.won ? { team, moved: 0, wonNow: false } : advance(team, "back", 1)
  const nextTeam: Team = {
    ...moved.team,
    stats: { ...moved.team.stats, wrong: team.stats.wrong + 1 },
  }
  let next = replaceTeam(state, nextTeam)
  next = { ...next, streak: 0 }
  next = pushLog(
    next,
    moved.moved > 0 ? `${team.name} svarte galt og rykker ett felt tilbake.` : `${team.name} svarte galt.`,
    "shock",
  )
  return result(
    next,
    { ...quietEffect(), shock: true, blip: moved.moved > 0, banner: `${team.name} svarte galt` },
    color,
  )
}

function passToQueue(scored: Result): Result {
  const [nextColor, ...rest] = scored.state.bezzerQueue
  if (!nextColor) return scored
  const name = getTeam(scored.state, nextColor).name
  const next = pushLog(
    { ...scored.state, respondent: nextColor, bezzerQueue: rest },
    `${name} får spørsmålet.`,
    "twist",
  )
  return result(next, { ...scored.effect, banner: `${name} svarer` }, nextColor)
}

export function playBezzer(state: GameState, color: TeamColor): Result {
  const question = currentQuestion(state)
  const team = getTeam(state, color)
  if (!question) {
    return result(state, { ...quietEffect(), banner: "Besserwisser brukes mens et spørsmål er oppe." }, color)
  }
  if (state.pendingPoints) {
    return result(state, { ...quietEffect(), banner: "Velg 1 eller 3 poeng først." }, color)
  }
  const answering = state.respondent ?? question.color
  if (color === question.color || color === answering) {
    return result(state, { ...quietEffect(), banner: "Det er din tur. Svar med Riktig eller Galt." }, color)
  }
  if (state.bezzerQueue.includes(color)) {
    return result(state, { ...quietEffect(), banner: `${team.name} står allerede i kø.` }, color)
  }
  if (team.won) {
    return result(state, { ...quietEffect(), banner: `${team.name} er allerede i mål.` }, color)
  }
  if (team.bezzersLeft <= 0) {
    return result(state, { ...quietEffect(), banner: `${team.name} har brukt begge besserwisser-brikkene.` }, color)
  }
  let next = replaceTeam(state, { ...team, bezzersLeft: team.bezzersLeft - 1 })
  next = { ...next, bezzerQueue: [...next.bezzerQueue, color] }
  const category = categoryById(getTeam(next, question.color).tiles[question.tileIndex]!.categoryId)
  const place = next.bezzerQueue.length
  next = pushLog(next, `${team.name} stiller seg i kø (${place}) på ${category.name}.`, "twist")
  return result(next, { ...quietEffect(), blip: true, banner: `${team.name} er i kø` }, color)
}

export function answerCurrent(state: GameState, correct: boolean, rng: Rng = Math.random): Result {
  const question = currentQuestion(state)
  if (!question) {
    return result(state, { ...quietEffect(), banner: "Ingen aktiv tur." }, null)
  }
  if (state.pendingPoints) {
    return result(state, { ...quietEffect(), banner: "Velg 1 eller 3 poeng." }, state.pendingPoints)
  }
  const speaker = state.respondent ?? question.color
  if (correct && speaker !== question.color) {
    const name = getTeam(state, speaker).name
    const held: GameState = { ...state, pendingPoints: speaker, bezzerQueue: [] }
    const next = pushLog(held, `${name} svarte riktig. Velg 1 eller 3 poeng.`, "move")
    return result(next, { ...quietEffect(), clap: true, banner: `${name} svarte riktig. Velg poeng.` }, speaker)
  }
  if (correct) {
    return advanceTurn(awardCorrect(state, question.color, question.tileIndex, rng))
  }
  const missed = penalize(state, speaker)
  if (missed.state.bezzerQueue.length > 0) return passToQueue(missed)
  const closed = markAsked(missed.state, question.color, question.tileIndex)
  return advanceTurn(result(closed, missed.effect, missed.actor))
}

export function awardBezzerPoints(state: GameState, points: 1 | 3, rng: Rng = Math.random): Result {
  const question = currentQuestion(state)
  const thief = state.pendingPoints
  if (!question || !thief) {
    return result(state, { ...quietEffect(), banner: "Ingen poeng å velge." }, thief)
  }
  const scored = scoreThief({ ...state, pendingPoints: null }, question, thief, points, rng)
  return advanceTurn(scored)
}

function randomTile(state: GameState, rng: Rng, avoid?: TileRef): TileRef | null {
  const bag: TileRef[] = []
  for (const team of state.teams) {
    team.tiles.forEach((_, index) => {
      if (avoid && avoid.color === team.color && avoid.index === index) return
      bag.push({ color: team.color, index })
    })
  }
  if (bag.length === 0) return null
  return bag[Math.floor(rng() * bag.length)] ?? null
}

export function applyTwist(state: GameState, color: TeamColor, rng: Rng): Result {
  const kinds = ["swap", "slip", "tailwind", "parade", "double"] as const
  const kind = kinds[Math.floor(rng() * kinds.length)] ?? "parade"
  const team = getTeam(state, color)

  if (kind === "swap") {
    const first = randomTile(state, rng)
    const second = first ? randomTile(state, rng, first) : null
    if (!first || !second) return result(state, { ...quietEffect(), banner: "Streakeren fant ingen kort å rote med." }, color)
    const swapped = swapTiles(state, first, second, true)
    const next = pushLog(swapped.state, "En streaker stokket om to brikker.", "twist")
    return result(next, { ...swapped.effect, banner: "To brikker byttet plass i farten." }, color)
  }

  if (kind === "slip") {
    const candidates = state.teams.filter((candidate) => !candidate.won && candidate.position > 0)
    const victim = candidates[Math.floor(rng() * candidates.length)]
    if (!victim) {
      return result(state, { ...quietEffect(), banner: "Gulvet var tørt. Ingen skled." }, color)
    }
    const moved = advance(victim, "back", 1)
    let next = replaceTeam({ ...state, streak: 0 }, moved.team)
    next = pushLog(next, `Glatt gulv! ${victim.name} sklir ett felt tilbake.`, "twist")
    return result(next, { ...quietEffect(), blip: true, banner: `${victim.name} skled.` }, victim.color)
  }

  if (kind === "tailwind") {
    if (team.won) {
      return result(state, { ...quietEffect(), banner: `${team.name} er allerede i mål. Medvinden dør ut.` }, color)
    }
    const moved = advance(team, "forward", 1)
    let next = replaceTeam(state, moved.team)
    next = {
      ...next,
      winner: moved.wonNow && !state.winner ? color : state.winner,
    }
    next = pushLog(next, `Medvind! ${team.name} får et ekstra felt.`, moved.wonNow ? "win" : "twist")
    return result(
      next,
      {
        ...quietEffect(),
        blip: true,
        fanfare: moved.wonNow,
        banner: moved.wonNow ? `${team.name} ble blåst i mål` : `${team.name} fikk medvind`,
      },
      color,
    )
  }

  if (kind === "double") {
    const next = pushLog(
      { ...state, doubleNext: color },
      `${team.name} får dobbelt på neste riktige svar.`,
      "twist",
    )
    return result(next, { ...quietEffect(), banner: `${team.name}: neste riktige svar teller dobbelt` }, color)
  }

  const next = noteStreakers(pushLog(state, "Streaker-parade!", "streak"), 2)
  return result(next, { ...quietEffect(), parade: true, streakers: 2, banner: "Parade! Flere er på vei." }, color)
}

export function catchStreaker(state: GameState, color: TeamColor, quip: string, rng: Rng = Math.random): Result {
  if (rng() < 0.62) return applyTwist(state, color, rng)
  const next = pushLog(state, quip, "streak")
  return result(next, { ...quietEffect(), banner: quip }, color)
}

export function unleashChaos(state: GameState, rng: Rng = Math.random): Result {
  const color = state.order[Math.floor(rng() * state.order.length)] ?? state.teams[0]!.color
  const twisted = applyTwist(state, color, rng)
  return result(twisted.state, twisted.effect, twisted.actor ?? color)
}

export function releaseStreaker(state: GameState, rng: Rng = Math.random): Result {
  const color = state.order[Math.floor(rng() * state.order.length)] ?? state.teams[0]!.color
  let next = noteStreakers(state, 1)
  next = pushLog(next, "Verten slapp en streaker løs.", "streak")
  return result(next, { ...quietEffect(), streakers: 1, banner: "Der kom det en." }, color)
}
