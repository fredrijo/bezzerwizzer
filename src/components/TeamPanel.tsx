import { categoryById } from "@/game/categories.ts"
import { currentQuestion, onHomeStretch, stepsTaken } from "@/game/logic.ts"
import { TEAM_STYLE, type GameState, type TeamColor, type TileRef } from "@/game/types.ts"
import { CategoryMark } from "@/components/CategoryMark.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"

type TeamPanelProps = {
  state: GameState
  swapFrom: TileRef | null
  onRename: (color: TeamColor, name: string) => void
  onNudge: (color: TeamColor, direction: "forward" | "back") => void
  onSwap: (source: TileRef, target: TileRef) => void
  onArmSwap: (ref: TileRef) => void
  onBezzer: (color: TeamColor) => void
}

export function TeamPanel({ state, swapFrom, onRename, onNudge, onSwap, onArmSwap, onBezzer }: TeamPanelProps) {
  const question = currentQuestion(state)
  const swapping = state.phase === "swap"

  return (
    <div className="flex flex-col gap-2">
      {state.order.map((color) => {
        const team = state.teams.find((item) => item.color === color)
        if (!team) return null
        const style = TEAM_STYLE[color]
        const steps = stepsTaken(team)
        const onTurn = question?.color === color
        const onDots = onHomeStretch(team)
        const bezzerLive =
          state.phase === "play" &&
          question &&
          !state.pendingPoints &&
          question.color !== color &&
          state.respondent !== color &&
          !state.bezzerQueue.includes(color) &&
          team.bezzersLeft > 0 &&
          !team.won
        return (
          <section
            key={color}
            className="rounded-2xl border bg-card/80 px-2.5 py-2 shadow-md backdrop-blur-sm"
            style={{
              borderColor: `${style.base}66`,
              outline: onTurn ? `2px solid ${style.base}` : undefined,
              outlineOffset: onTurn ? 1 : undefined,
            }}
          >
            <header className="flex items-center gap-2">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                style={{ background: style.base, color: style.ink }}
              >
                {team.name.slice(0, 1).toUpperCase() || "?"}
              </span>
              <Input
                aria-label={`Navn for ${style.label}`}
                value={team.name}
                maxLength={32}
                onChange={(event) => onRename(color, event.target.value)}
                className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium shadow-none"
              />
              {onTurn && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase" style={{ background: style.base, color: style.ink }}>
                  Tur
                </span>
              )}
              <p className="shrink-0 text-xs font-semibold tabular-nums">{team.won ? "I mål" : `${steps}/20`}</p>
              <Button type="button" variant="secondary" className="h-7 w-7 px-0" onClick={() => onNudge(color, "back")} disabled={team.won} aria-label={`Flytt ${team.name} tilbake`}>
                ←
              </Button>
              <Button type="button" className="h-7 w-7 px-0" onClick={() => onNudge(color, "forward")} disabled={team.won} aria-label={`Flytt ${team.name} frem`}>
                →
              </Button>
            </header>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {team.tiles.map((tile, index) => {
                const category = categoryById(tile.categoryId)
                const live = onTurn && question?.tileIndex === index
                const armed = swapFrom?.color === color && swapFrom.index === index
                return (
                  <button
                    key={`${color}-${index}`}
                    type="button"
                    draggable={swapping}
                    title={category.blurb}
                    onClick={() => {
                      const ref = { color, index }
                      if (swapping && swapFrom && (swapFrom.color !== color || swapFrom.index !== index)) onSwap(swapFrom, ref)
                      else if (swapping) onArmSwap(ref)
                    }}
                    onDragStart={(event) => {
                      if (!swapping) return
                      event.dataTransfer.setData("text/plain", `${color}:${index}`)
                      event.dataTransfer.effectAllowed = "move"
                    }}
                    onDragOver={(event) => {
                      if (swapping) event.preventDefault()
                    }}
                    onDrop={(event) => {
                      if (!swapping) return
                      event.preventDefault()
                      const [fromColor, fromIndex] = event.dataTransfer.getData("text/plain").split(":")
                      if (!fromColor || fromIndex === undefined) return
                      onSwap({ color: fromColor as TeamColor, index: Number(fromIndex) }, { color, index })
                    }}
                    className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border bg-[#f6f1e4] px-1 py-1.5 text-[#1c2416] ${
                      tile.used ? "opacity-40" : ""
                    } ${live ? "ring-2 ring-[#e8c46a]" : ""} ${armed ? "ring-2 ring-primary" : ""} ${swapping ? "cursor-grab" : ""}`}
                    style={{ borderColor: style.base }}
                  >
                    <CategoryMark category={category} size="sm" />
                    <span className="line-clamp-2 text-center text-[10px] leading-tight font-semibold">{category.name}</span>
                    <span className="text-[10px] tabular-nums opacity-70">{index + 1}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <TokenFace label="Zwap" count={team.swapsLeft} spent={team.swapsLeft <= 0} />
              <TokenFace
                label="Besser"
                count={team.bezzersLeft}
                hot={state.respondent === color || state.bezzerQueue.includes(color) || state.pendingPoints === color}
                spent={team.bezzersLeft <= 0}
                disabled={!bezzerLive}
                onClick={() => onBezzer(color)}
              />
              {onDots && <span className="ml-auto text-[10px] text-muted-foreground">Prikkfelt: 1 felt</span>}
              {state.doubleNext === color && !onDots && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">×2 neste</span>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TokenFace({
  label,
  count,
  spent,
  disabled,
  hot,
  onClick,
}: {
  label: string
  count: number
  spent?: boolean
  disabled?: boolean
  hot?: boolean
  onClick?: () => void
}) {
  const className = `flex h-9 min-w-16 items-center justify-between gap-2 rounded-lg border px-2 text-left ${
    hot ? "border-primary bg-primary/15" : "bg-[#f6f1e4] text-[#1c2416]"
  } ${spent || disabled ? "opacity-40" : ""}`
  const body = (
    <>
      <span className="text-[10px] font-semibold tracking-wide uppercase">{label}</span>
      <span className="text-sm font-bold tabular-nums">{count}</span>
    </>
  )
  if (!onClick) return <div className={className}>{body}</div>
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {body}
    </button>
  )
}
