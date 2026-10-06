import { describe, expect, it } from "vitest"
import { DECK_INFO, poolFor } from "@/game/categories.ts"
import {
  answerCurrent,
  awardCorrect,
  awardWrong,
  createGame,
  currentQuestion,
  effectiveChance,
  getTeam,
  LAP,
  newRound,
  nudge,
  onHomeStretch,
  awardBezzerPoints,
  playBezzer,
  squareFor,
  startRound,
  swapTiles,
  TRACK,
} from "@/game/logic.ts"
import { DEFAULT_NAMES, type GameState, type TeamColor } from "@/game/types.ts"

const zero = () => 0

function fresh(chance = 0): GameState {
  return createGame(
    {
      teamCount: 4,
      names: DEFAULT_NAMES,
      deck: "classic",
      streakChance: chance,
      festMode: false,
    },
    zero,
  )
}

function legacyForward(x: number, y: number, winner: boolean) {
  if (winner) return { x, y, winner }
  const wasOnNextToLast = y === 5 && x === 1
  if (x === 0 && y > 0) y -= 1
  else if (x < 5 && y === 0) x += 1
  else if (x === 5 && y < 5) y += 1
  else if (x > 0 && y === 5) x -= 1
  if (wasOnNextToLast && x === 0 && y === 5) winner = true
  return { x, y, winner }
}

function legacyBack(x: number, y: number, winner: boolean) {
  if (winner) return { x, y, winner }
  if (x === 0 && y === 5) return { x, y, winner }
  if (x === 0 && y < 5) y += 1
  else if (x < 6 && y === 0) x -= 1
  else if (x === 5 && y < 6) y -= 1
  else if (x > 0 && y === 5) x += 1
  return { x, y, winner }
}

describe("track", () => {
  it("is a 20-step lap back to start", () => {
    expect(LAP).toBe(20)
    expect(TRACK[0]).toEqual({ x: 0, y: 5 })
    expect(TRACK[19]).toEqual({ x: 1, y: 5 })
  })

  it("follows the original forward path, including the win", () => {
    let state = fresh()
    let x = 0
    let y = 5
    let winner = false
    for (let step = 0; step < 24; step += 1) {
      const legacy = legacyForward(x, y, winner)
      x = legacy.x
      y = legacy.y
      winner = legacy.winner
      state = nudge(state, "red", "forward", zero).state
      const team = getTeam(state, "red")
      expect(squareFor(team)).toEqual({ x, y })
      expect(team.won).toBe(winner)
    }
    expect(state.winner).toBe("red")
  })

  it("follows the original backward path from every square", () => {
    for (let steps = 0; steps <= 20; steps += 1) {
      let state = fresh()
      let x = 0
      let y = 5
      let winner = false
      for (let step = 0; step < steps; step += 1) {
        const legacy = legacyForward(x, y, winner)
        x = legacy.x
        y = legacy.y
        winner = legacy.winner
        state = nudge(state, "red", "forward", zero).state
      }
      const legacy = legacyBack(x, y, winner)
      state = nudge(state, "red", "back", zero).state
      const team = getTeam(state, "red")
      expect(squareFor(team)).toEqual({ x: legacy.x, y: legacy.y })
      expect(team.won).toBe(legacy.winner)
    }
  })
})

describe("scoring", () => {
  it("moves the point value of the tile", () => {
    const state = fresh()
    const next = awardCorrect(state, "red", 2, zero)
    expect(getTeam(next.state, "red").position).toBe(3)
    expect(getTeam(next.state, "red").tiles[2]?.used).toBe(true)
    expect(next.effect.clap).toBe(true)
  })

  it("scores one square on the dotted home stretch", () => {
    let state = fresh()
    for (let step = 0; step < 16; step += 1) {
      state = nudge(state, "red", "forward", zero).state
    }
    expect(onHomeStretch(getTeam(state, "red"))).toBe(true)
    const doubled = { ...state, doubleNext: "red" as TeamColor }
    const next = awardCorrect(doubled, "red", 3, zero)
    expect(getTeam(next.state, "red").position).toBe(17)
    expect(next.state.doubleNext).toBe("red")
    expect(next.effect.banner).toContain("Prikkfelt")
  })

  it("stops on the first dotted square when entering the home stretch", () => {
    let state = fresh()
    for (let step = 0; step < 12; step += 1) state = nudge(state, "red", "forward", zero).state
    expect(onHomeStretch(getTeam(state, "red"))).toBe(false)
    const next = awardCorrect({ ...state, doubleNext: "red" }, "red", 3, zero)
    expect(getTeam(next.state, "red").position).toBe(15)
    expect(squareFor(getTeam(next.state, "red"))).toEqual({ x: 5, y: 5 })
    expect(onHomeStretch(getTeam(next.state, "red"))).toBe(true)
    expect(next.effect.banner).toContain("Første prikkfelt")
    const again = awardCorrect(next.state, "red", 2, zero)
    expect(getTeam(again.state, "red").position).toBe(16)
  })

  it("doubles the next correct answer once", () => {
    const state = { ...fresh(), doubleNext: "red" as TeamColor }
    const next = awardCorrect(state, "red", 3, zero)
    expect(getTeam(next.state, "red").position).toBe(8)
    expect(next.state.doubleNext).toBeNull()
    expect(next.effect.banner).toContain("Dobbelt")
  })

  it("steps back and shocks on a miss", () => {
    let state = fresh()
    state = nudge(state, "blue", "forward", zero).state
    const next = awardWrong(state, "blue", 0)
    expect(getTeam(next.state, "blue").position).toBe(0)
    expect(next.effect.shock).toBe(true)
    expect(next.state.streak).toBe(0)
  })

  it("does not leave the start square backward", () => {
    const next = nudge(fresh(), "green", "back", zero)
    expect(getTeam(next.state, "green").position).toBe(0)
    expect(next.effect.blip).toBe(false)
  })

  it("swaps tiles across teams and spends the swap", () => {
    const state = fresh()
    const red = getTeam(state, "red").tiles[0]!.categoryId
    const pink = getTeam(state, "pink").tiles[3]!.categoryId
    const next = swapTiles(state, { color: "red", index: 0 }, { color: "pink", index: 3 })
    expect(getTeam(next.state, "red").tiles[0]?.categoryId).toBe(pink)
    expect(getTeam(next.state, "pink").tiles[3]?.categoryId).toBe(red)
    expect(getTeam(next.state, "red").swapsLeft).toBe(0)
    const again = swapTiles(next.state, { color: "red", index: 1 }, { color: "blue", index: 0 })
    expect(getTeam(again.state, "red").tiles[1]?.categoryId).toBe(getTeam(next.state, "red").tiles[1]?.categoryId)
    expect(again.effect.banner).toContain("brukt")
  })

  it("zwaps any open tile, including one that is not the current question", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const other = state.order.find((color) => color !== asked.color)!
    const ownIndex = asked.tileIndex === 3 ? 2 : 3
    const before = getTeam(state, asked.color).tiles[ownIndex]!.categoryId
    const taken = getTeam(state, other).tiles[1]!.categoryId
    const next = swapTiles(state, { color: asked.color, index: ownIndex }, { color: other, index: 1 })
    expect(getTeam(next.state, asked.color).tiles[ownIndex]?.categoryId).toBe(taken)
    expect(getTeam(next.state, other).tiles[1]?.categoryId).toBe(before)
    expect(getTeam(next.state, asked.color).swapsLeft).toBe(0)
    expect(currentQuestion(next.state)?.tileIndex).toBe(asked.tileIndex)
  })

  it("spends the turn team's zwap when two opponents trade tiles", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const others = state.order.filter((color) => color !== asked.color)
    const next = swapTiles(state, { color: others[0]!, index: 0 }, { color: others[1]!, index: 2 })
    expect(getTeam(next.state, asked.color).swapsLeft).toBe(0)
    expect(getTeam(next.state, others[0]!).swapsLeft).toBe(1)
    expect(getTeam(next.state, others[0]!).tiles[0]?.categoryId).toBe(getTeam(state, others[1]!).tiles[2]?.categoryId)
  })

  it("refuses a zwap of a turned tile and refunds a queue if the live category moves", () => {
    let state = startRound(fresh(), zero).state
    const first = currentQuestion(state)!
    state = answerCurrent(state, true, zero).state
    const live = currentQuestion(state)!
    const outsider = state.order.find((color) => color !== live.color && color !== first.color)!
    const turned = swapTiles(state, { color: first.color, index: first.tileIndex }, { color: outsider, index: 0 })
    expect(turned.effect.banner).toContain("Snudde")
    expect(getTeam(turned.state, live.color).swapsLeft).toBe(1)

    const queued = state.order.find((color) => color !== live.color)!
    const partner = state.order.find((color) => color !== live.color && color !== queued)!
    state = playBezzer(state, queued).state
    expect(state.bezzerQueue).toEqual([queued])
    const moved = swapTiles(state, { color: live.color, index: live.tileIndex }, { color: partner, index: 1 })
    expect(moved.state.bezzerQueue).toEqual([])
    expect(getTeam(moved.state, queued).bezzersLeft).toBe(2)
    expect(getTeam(moved.state, live.color).swapsLeft).toBe(0)
  })

  it("allows zwap during a live question", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const other = state.order.find((color) => color !== asked.color)!
    const before = getTeam(state, asked.color).tiles[asked.tileIndex]!.categoryId
    const taken = getTeam(state, other).tiles[1]!.categoryId
    const next = swapTiles(state, { color: asked.color, index: asked.tileIndex }, { color: other, index: 1 })
    expect(next.state.phase).toBe("play")
    expect(getTeam(next.state, asked.color).tiles[asked.tileIndex]?.categoryId).toBe(taken)
    expect(getTeam(next.state, other).tiles[1]?.categoryId).toBe(before)
    expect(getTeam(next.state, asked.color).swapsLeft).toBe(0)
    expect(currentQuestion(next.state)?.color).toBe(asked.color)
    expect(currentQuestion(next.state)?.tileIndex).toBe(asked.tileIndex)
  })

  it("asks category 1 for every team before category 2", () => {
    let state = startRound(fresh(), zero).state
    expect(currentQuestion(state)?.tileIndex).toBe(0)
    const count = state.order.length
    for (let step = 0; step < count; step += 1) {
      expect(currentQuestion(state)?.tileIndex).toBe(0)
      state = answerCurrent(state, true, zero).state
    }
    expect(currentQuestion(state)?.tileIndex).toBe(1)
    expect(state.phase).toBe("play")
  })

  it("lets the asked team answer before anyone in the besserwisser queue", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const waiting = state.order.filter((color) => color !== asked.color)
    for (const color of waiting) state = playBezzer(state, color).state
    expect(state.bezzerQueue).toEqual(waiting)
    expect(state.respondent).toBeNull()
    const turn = state.turn
    state = answerCurrent(state, true, zero).state
    expect(getTeam(state, asked.color).position).toBe(1)
    expect(getTeam(state, waiting[0]!).position).toBe(0)
    expect(state.bezzerQueue).toEqual([])
    expect(state.turn).toBe(turn + 1)
  })

  it("hands the question to the queue only after a wrong answer", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const waiting = state.order.filter((color) => color !== asked.color)
    const [first, second] = waiting
    state = playBezzer(state, first!).state
    state = playBezzer(state, second!).state
    const turn = state.turn
    state = answerCurrent(state, false, zero).state
    expect(state.turn).toBe(turn)
    expect(state.respondent).toBe(first)
    expect(state.bezzerQueue).toEqual([second])
    expect(getTeam(state, asked.color).tiles[asked.tileIndex]?.used).toBe(false)
    state = answerCurrent(state, false, zero).state
    expect(state.respondent).toBe(second)
    expect(state.bezzerQueue).toEqual([])
    state = answerCurrent(state, true, zero).state
    expect(state.pendingPoints).toBe(second)
    expect(getTeam(state, second!).position).toBe(0)
    expect(getTeam(state, asked.color).tiles[asked.tileIndex]?.used).toBe(false)
    expect(state.bezzerQueue).toEqual([])
    expect(state.turn).toBe(turn)
    const scored = awardBezzerPoints(state, 1, zero).state
    expect(getTeam(scored, second!).position).toBe(1)
    expect(getTeam(scored, asked.color).tiles[asked.tileIndex]?.used).toBe(true)
    expect(scored.pendingPoints).toBeNull()
    expect(scored.respondent).toBeNull()
    expect(scored.turn).toBe(turn + 1)
  })

  it("lets a correct besserwisser choose 1 or 3 points after the answer", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const thief = state.order.find((color) => color !== asked.color)!
    state = playBezzer(state, thief).state
    state = answerCurrent(state, false, zero).state
    state = answerCurrent(state, true, zero).state
    expect(state.pendingPoints).toBe(thief)
    const low = awardBezzerPoints(state, 1, zero)
    expect(getTeam(low.state, thief).position).toBe(1)
    const high = awardBezzerPoints(state, 3, zero)
    expect(getTeam(high.state, thief).position).toBe(3)
    expect(high.state.doubleNext).toBeNull()
  })

  it("stops a besserwisser on the first dotted square when the points would pass it", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const thief = state.order.find((color) => color !== asked.color)!
    for (let step = 0; step < 13; step += 1) state = nudge(state, thief, "forward", zero).state
    state = playBezzer(state, thief).state
    state = answerCurrent(state, false, zero).state
    state = answerCurrent(state, true, zero).state
    const scored = awardBezzerPoints(state, 3, zero)
    expect(getTeam(scored.state, thief).position).toBe(15)
    expect(scored.effect.banner).toContain("første prikkfelt")
  })

  it("doubles a chosen besserwisser score and still moves one square on the dots", () => {
    let state = startRound(fresh(), zero).state
    const asked = currentQuestion(state)!
    const thief = state.order.find((color) => color !== asked.color)!
    for (let step = 0; step < 16; step += 1) state = nudge(state, thief, "forward", zero).state
    expect(onHomeStretch(getTeam(state, thief))).toBe(true)
    state = playBezzer(state, thief).state
    state = answerCurrent(state, false, zero).state
    state = answerCurrent(state, true, zero).state
    const dotted = awardBezzerPoints({ ...state, doubleNext: thief }, 3, zero)
    expect(getTeam(dotted.state, thief).position).toBe(17)
    expect(dotted.state.doubleNext).toBe(thief)

    let open = startRound(fresh(), zero).state
    const askedOpen = currentQuestion(open)!
    const openThief = open.order.find((color) => color !== askedOpen.color)!
    open = playBezzer(open, openThief).state
    open = answerCurrent(open, false, zero).state
    open = answerCurrent(open, true, zero).state
    const doubled = awardBezzerPoints({ ...open, doubleNext: openThief }, 3, zero)
    expect(getTeam(doubled.state, openThief).position).toBe(6)
    expect(doubled.state.doubleNext).toBeNull()
  })

  it("refills swap and besserwisser bricks on a new round", () => {
    let state = fresh()
    state = swapTiles(state, { color: "green", index: 0 }, { color: "blue", index: 0 }).state
    state = startRound(state, zero).state
    state = playBezzer(state, state.order[1]!).state
    const next = newRound(state, zero)
    expect(getTeam(next.state, "green").swapsLeft).toBe(1)
    expect(getTeam(next.state, "blue").bezzersLeft).toBe(2)
    expect(next.state.phase).toBe("swap")
  })

  it("deals four unique categories to each team", () => {
    const state = createGame(
      {
        teamCount: 4,
        names: DEFAULT_NAMES,
        deck: "party",
        streakChance: 40,
        festMode: false,
      },
      Math.random,
    )
    const ids = state.teams.flatMap((team) => team.tiles.map((tile) => tile.categoryId))
    expect(ids).toHaveLength(16)
    expect(new Set(ids).size).toBe(16)
  })

  it("keeps positions and redraws cards on a new round", () => {
    let state = fresh()
    state = nudge(state, "green", "forward", zero).state
    const next = newRound(state, zero)
    expect(getTeam(next.state, "green").position).toBe(1)
    expect(next.state.round).toBe(2)
    expect(getTeam(next.state, "green").tiles.every((tile) => !tile.used)).toBe(true)
  })

  it("raises the streaker chance with the streak and in fest mode", () => {
    const calm = fresh(40)
    expect(effectiveChance(calm)).toBe(40)
    const hot = { ...calm, streak: 4 }
    expect(effectiveChance(hot)).toBe(80)
    expect(effectiveChance({ ...hot, festMode: true })).toBe(100)
  })
})

describe("decks", () => {
  it("has enough cards for four teams", () => {
    for (const deck of Object.values(DECK_INFO)) {
      expect(deck.list.length).toBeGreaterThanOrEqual(16)
    }
  })

  it("keeps bricks out until they are added", () => {
    expect(poolFor("classic", []).some((category) => category.id === "tv-serier")).toBe(false)
    const pool = poolFor("classic", ["tv-serier", "baerekraft", "storbyer"])
    expect(pool.some((category) => category.id === "tv-serier")).toBe(true)
    expect(pool.some((category) => category.id === "baerekraft")).toBe(true)
    const ids = new Set(pool.map((category) => category.id))
    const state = createGame(
      { teamCount: 4, names: DEFAULT_NAMES, deck: "classic", addons: ["tv-serier", "baerekraft", "storbyer"], streakChance: 0, festMode: false },
      zero,
    )
    for (const id of state.teams.flatMap((team) => team.tiles.map((tile) => tile.categoryId))) {
      expect(ids.has(id)).toBe(true)
    }
  })
})
