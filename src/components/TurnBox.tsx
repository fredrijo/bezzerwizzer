import { useState } from "react"
import { categoryById } from "@/game/categories.ts"
import { currentQuestion, onHomeStretch } from "@/game/logic.ts"
import { TEAM_STYLE, type GameState, type TeamColor, type TileRef } from "@/game/types.ts"
import { CategoryMark } from "@/components/CategoryMark.tsx"
import { Button } from "@/components/ui/button.tsx"

type TurnBoxProps = {
  state: GameState
  onStart: () => void
  onAnswer: (correct: boolean) => void
  onPoints: (points: 1 | 3) => void
  onZwap: (source: TileRef, target: TileRef) => void
  onBezzer: (color: TeamColor) => void
  onNewRound: () => void
}

function sameTile(left: TileRef | null, right: TileRef | null) {
  return Boolean(left && right && left.color === right.color && left.index === right.index)
}

export function TurnBox({ state, onStart, onAnswer, onPoints, onZwap, onBezzer, onNewRound }: TurnBoxProps) {
  const question = currentQuestion(state)
  const questionKey = `${state.turn}:${question?.color ?? ""}:${question?.tileIndex ?? ""}:${state.pendingPoints ?? ""}`
  const [picking, setPicking] = useState(false)
  const [zwapFrom, setZwapFrom] = useState<TileRef | null>(null)
  const [zwapTo, setZwapTo] = useState<TileRef | null>(null)
  const [pickingKey, setPickingKey] = useState(questionKey)
  if (pickingKey !== questionKey) {
    setPickingKey(questionKey)
    setPicking(false)
    setZwapFrom(null)
    setZwapTo(null)
  }
  const asked = question ? state.teams.find((team) => team.color === question.color) : null
  const respondent = state.respondent ? state.teams.find((team) => team.color === state.respondent) : null

  if (state.winner) {
    const winner = state.teams.find((team) => team.color === state.winner)
    return (
      <section className="turn-box" aria-live="polite">
        <p className="text-[11px] tracking-[0.22em] uppercase opacity-70">Ferdig</p>
        <h2 className="wordmark text-3xl leading-none">{winner?.name ?? "Et lag"} er i mål</h2>
      </section>
    )
  }

  if (state.phase === "swap") {
    return (
      <section className="turn-box" aria-live="polite">
        <p className="text-[11px] tracking-[0.22em] uppercase opacity-70">Før runden</p>
        <h2 className="wordmark text-3xl leading-none">Bytt kategorier</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Her bytter dere fritt innen laget. Zwap-brikken brukes på egen tur, før dere svarer, og kan bytte hvilke som helst to åpne brikker.
        </p>
        <Button type="button" className="mt-4 h-12 w-full text-base" onClick={onStart}>
          Start runden
        </Button>
      </section>
    )
  }

  if (state.phase === "done" || !question || !asked) {
    return (
      <section className="turn-box" aria-live="polite">
        <p className="text-[11px] tracking-[0.22em] uppercase opacity-70">Runde {state.round}</p>
        <h2 className="wordmark text-3xl leading-none">Alle fire er spilt</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ny runde deler ut nye kategorier og friske bytte- og besserwisser-brikker.</p>
        <Button type="button" className="mt-4 h-12 w-full text-base" onClick={onNewRound}>
          Ny runde
        </Button>
      </section>
    )
  }

  const category = categoryById(asked.tiles[question.tileIndex]!.categoryId)
  const answering = respondent ?? asked
  const style = TEAM_STYLE[answering.color]
  const queued = state.bezzerQueue
    .map((color) => state.teams.find((team) => team.color === color))
    .filter((team) => team != null)
  const challengers = state.order
    .map((color) => state.teams.find((team) => team.color === color))
    .filter(
      (team) =>
        team &&
        team.color !== asked.color &&
        team.color !== answering.color &&
        !state.bezzerQueue.includes(team.color) &&
        team.bezzersLeft > 0 &&
        !team.won,
    )
  return (
    <section className="turn-box" aria-live="polite" style={{ boxShadow: `inset 0 0 0 2px ${style.base}` }}>
      <p className="text-[11px] tracking-[0.22em] uppercase opacity-70">
        Kategori {question.tileIndex + 1} · {question.points} poeng
      </p>
      <div className="mt-3 flex items-center gap-3">
        <CategoryMark category={category} size="lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: style.base }}>
            {answering.name}
          </p>
          <h2 className="wordmark text-3xl leading-none">{category.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.pendingPoints
              ? `${answering.name} svarte riktig.`
              : respondent
                ? `${asked.name} svarte galt. ${answering.name} får sjansen.`
                : category.blurb}
          </p>
        </div>
      </div>
      {queued.length > 0 && (
        <p className="mt-3 rounded-xl bg-foreground/10 px-3 py-2 text-sm">
          I kø: {queued.map((team) => team.name).join(", ")}
        </p>
      )}
      {state.pendingPoints ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-semibold">Riktig. Velg poeng til {answering.name}.</p>
          {onHomeStretch(answering) ? (
            <p className="text-xs text-muted-foreground">Prikkfeltet gir ett felt, enten dere velger 1 eller 3.</p>
          ) : state.doubleNext === answering.color ? (
            <p className="text-xs text-muted-foreground">Dobbelt: 1 poeng gir 2 felt, 3 poeng gir 6 felt.</p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" className="h-12 text-base" onClick={() => onPoints(1)}>
              1 poeng
            </Button>
            <Button type="button" className="h-12 text-base" onClick={() => onPoints(3)}>
              3 poeng
            </Button>
          </div>
        </div>
      ) : (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" className="h-12 text-base" onClick={() => onAnswer(true)}>
          Riktig
        </Button>
        <Button type="button" variant="destructive" className="h-12 text-base" onClick={() => onAnswer(false)}>
          Galt
        </Button>
        {asked.swapsLeft > 0 && !respondent && (
          <Button
            type="button"
            variant={picking ? "secondary" : "outline"}
            className="col-span-2 h-12 text-base"
            onClick={() => {
              setZwapFrom(null)
              setZwapTo(null)
              setPicking((open) => !open)
            }}
          >
            {picking ? "Avbryt zwap" : "Zwap"}
          </Button>
        )}
      </div>
      )}
      {!state.pendingPoints && challengers.length > 0 && (
        <div className="mt-3 grid gap-1.5">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Besserwisser</p>
          {challengers.map((team) => {
            if (!team) return null
            const teamStyle = TEAM_STYLE[team.color]
            return (
              <button
                key={team.color}
                type="button"
                className="flex h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold"
                style={{ borderColor: teamStyle.base }}
                onClick={() => onBezzer(team.color)}
              >
                <i className="size-2.5 rounded-full" style={{ background: teamStyle.base }} />
                <span className="min-w-0 flex-1 truncate">{team.name}</span>
                <span className="tabular-nums">{team.bezzersLeft}</span>
              </button>
            )
          })}
        </div>
      )}
      {picking && asked.swapsLeft > 0 && !respondent && !state.pendingPoints && (
        <div className="mt-3 grid gap-2">
          {zwapFrom && zwapTo && (
            <div className="rounded-2xl border-2 border-[#d21f3c] bg-[#fff6df] p-3 text-[#1c2416]">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#d21f3c] uppercase">Bekreft zwap</p>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <ZwapChip state={state} tile={zwapFrom} mark="A" />
                <span className="text-lg font-bold" aria-hidden>
                  ↔
                </span>
                <ZwapChip state={state} tile={zwapTo} mark="B" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="h-11"
                  onClick={() => {
                    onZwap(zwapFrom, zwapTo)
                    setPicking(false)
                    setZwapFrom(null)
                    setZwapTo(null)
                  }}
                >
                  Bekreft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-[#1c2416]/30 bg-transparent text-[#1c2416]"
                  onClick={() => {
                    setZwapFrom(null)
                    setZwapTo(null)
                  }}
                >
                  Velg på nytt
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {zwapFrom && zwapTo
              ? "Begge brikkene er merket. Bekreft byttet, eller trykk en merket brikke for å slippe den."
              : zwapFrom
                ? "Første brikke er merket Zwappes. Velg den andre."
                : "Velg to ubrukte brikker. Alle åpne brikker kan zwappes, ikke bare den som er oppe nå."}
          </p>
          {state.teams.map((team) => {
            const openTiles = team.tiles
              .map((tile, index) => ({ tile, index }))
              .filter((item) => !item.tile.used)
            if (openTiles.length === 0) return null
            return (
              <div key={team.color} className="grid gap-1">
                <p className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: TEAM_STYLE[team.color].base }}>
                  {team.name}
                  {team.color === asked.color ? " · dine" : ""}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {openTiles.map(({ tile, index }) => {
                    const option = categoryById(tile.categoryId)
                    const ref = { color: team.color, index }
                    const mark = sameTile(zwapFrom, ref) ? "A" : sameTile(zwapTo, ref) ? "B" : null
                    const current = team.color === question.color && index === question.tileIndex
                    return (
                      <button
                        key={`${team.color}-${index}`}
                        type="button"
                        aria-pressed={mark != null}
                        className={`relative flex items-center gap-1.5 rounded-lg border px-1.5 py-1 text-left text-[11px] font-semibold text-[#1c2416] ${
                          mark
                            ? "border-[#d21f3c] bg-[#ffe08a] shadow-[0_0_0_3px_rgba(210,31,60,0.45)]"
                            : "border-transparent bg-[#f6f1e4]"
                        }`}
                        onClick={() => {
                          if (sameTile(zwapFrom, ref)) {
                            setZwapFrom(zwapTo)
                            setZwapTo(null)
                            return
                          }
                          if (sameTile(zwapTo, ref)) {
                            setZwapTo(null)
                            return
                          }
                          if (!zwapFrom) {
                            setZwapFrom(ref)
                            return
                          }
                          setZwapTo(ref)
                        }}
                      >
                        {mark && (
                          <span className="absolute -top-2 right-1 rounded-full bg-[#d21f3c] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                            Zwappes {mark}
                          </span>
                        )}
                        <CategoryMark category={option} size="sm" />
                        <span className="min-w-0 leading-tight">
                          {option.name}
                          <span className="mt-0.5 block font-normal opacity-60">
                            {index + 1} poeng{current ? " · nå" : ""}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {state.pendingPoints
          ? `${answering.name} svarte riktig og venter på 1 eller 3 poeng.`
          : respondent
            ? `Riktig lar ${answering.name} velge 1 eller 3 poeng. Galt sender spørsmålet videre i køen.`
            : `Riktig gir kategoriens poeng til ${answering.name}. Galt sender spørsmålet videre i køen.`}
      </p>
    </section>
  )
}

function ZwapChip({ state, tile, mark }: { state: GameState; tile: TileRef; mark: "A" | "B" }) {
  const team = state.teams.find((item) => item.color === tile.color)
  const category = team ? categoryById(team.tiles[tile.index]!.categoryId) : null
  const style = TEAM_STYLE[tile.color]
  if (!team || !category) return null
  return (
    <div className="rounded-xl border-2 border-[#d21f3c] bg-[#ffe08a] p-2">
      <p className="text-[10px] font-bold tracking-wide text-[#d21f3c] uppercase">Zwappes {mark}</p>
      <p className="truncate text-[11px] font-semibold" style={{ color: style.base }}>
        {team.name}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <CategoryMark category={category} size="sm" />
        <span className="min-w-0 text-xs leading-tight font-semibold">
          {category.name}
          <span className="block font-normal opacity-70">{tile.index + 1} poeng</span>
        </span>
      </div>
    </div>
  )
}
