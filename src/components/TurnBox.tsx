import { useState } from "react"
import { categoryById } from "@/game/categories.ts"
import { currentQuestion } from "@/game/logic.ts"
import { TEAM_STYLE, type GameState, type TeamColor, type TileRef } from "@/game/types.ts"
import { CategoryMark } from "@/components/CategoryMark.tsx"
import { Button } from "@/components/ui/button.tsx"

type TurnBoxProps = {
  state: GameState
  onStart: () => void
  onAnswer: (correct: boolean) => void
  onZwap: (source: TileRef, target: TileRef) => void
  onBezzer: (color: TeamColor) => void
  onNewRound: () => void
}

export function TurnBox({ state, onStart, onAnswer, onZwap, onBezzer, onNewRound }: TurnBoxProps) {
  const question = currentQuestion(state)
  const questionKey = `${state.turn}:${question?.color ?? ""}:${question?.tileIndex ?? ""}`
  const [picking, setPicking] = useState(false)
  const [zwapFrom, setZwapFrom] = useState<TileRef | null>(null)
  const [pickingKey, setPickingKey] = useState(questionKey)
  if (pickingKey !== questionKey) {
    setPickingKey(questionKey)
    setPicking(false)
    setZwapFrom(null)
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
            {respondent ? `${asked.name} svarte galt. ${answering.name} får sjansen.` : category.blurb}
          </p>
        </div>
      </div>
      {queued.length > 0 && (
        <p className="mt-3 rounded-xl bg-foreground/10 px-3 py-2 text-sm">
          I kø: {queued.map((team) => team.name).join(", ")}
        </p>
      )}
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
              setPicking((open) => !open)
            }}
          >
            {picking ? "Avbryt zwap" : "Zwap"}
          </Button>
        )}
      </div>
      {challengers.length > 0 && (
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
      {picking && asked.swapsLeft > 0 && !respondent && (
        <div className="mt-3 grid gap-2">
          <p className="text-xs text-muted-foreground">
            {zwapFrom
              ? "Velg den andre ubrukte brikken. Egne, en motstanders, eller to andres."
              : "Velg først en ubrukt brikke. Alle åpne brikker på bordet kan zwappes, ikke bare den som er oppe nå."}
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
                    const selected = zwapFrom?.color === team.color && zwapFrom.index === index
                    const current = team.color === question.color && index === question.tileIndex
                    return (
                      <button
                        key={`${team.color}-${index}`}
                        type="button"
                        className={`flex items-center gap-1.5 rounded-lg border bg-[#f6f1e4] px-1.5 py-1 text-left text-[11px] font-semibold text-[#1c2416] ${
                          selected ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => {
                          const ref = { color: team.color, index }
                          if (!zwapFrom) {
                            setZwapFrom(ref)
                            return
                          }
                          if (zwapFrom.color === ref.color && zwapFrom.index === ref.index) {
                            setZwapFrom(null)
                            return
                          }
                          setPicking(false)
                          setZwapFrom(null)
                          onZwap(zwapFrom, ref)
                        }}
                      >
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
        Riktig gir poengene til {answering.name}. Galt sender spørsmålet videre i køen.
      </p>
    </section>
  )
}
