import { cellKind, squareFor, TRACK } from "@/game/logic.ts"
import { TEAM_STYLE, type GameState, type Team } from "@/game/types.ts"

type BoardProps = {
  state: GameState
}

export function Board({ state }: BoardProps) {
  const green = state.teams.find((team) => team.color === "green" && !team.won)
  const greenSquare = green ? squareFor(green) : null

  return (
    <section className="felt rounded-[28px] p-3 sm:p-6" aria-label="Spillebrett">
      <div className="mb-3 flex items-end justify-between px-1 text-[#f7f1df]">
        <div>
          <p className="text-[11px] tracking-[0.22em] uppercase opacity-70">Banen</p>
          <h2 className="wordmark text-2xl leading-none">En runde rundt</h2>
        </div>
        <p className="text-xs opacity-80">Første lag tilbake til start vinner</p>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: 6 }, (_, y) =>
          Array.from({ length: 6 }, (_, x) => {
            const kind = cellKind(x, y)
            const pawns = state.teams.filter((team) => {
              const square = squareFor(team)
              return square.x === x && square.y === y
            })
            const stuck = greenSquare?.x === x && greenSquare.y === y && y === 0 && x > 0 && x < 5
            const turned = greenSquare?.x === x && greenSquare.y === y && x === 5 && y === 0
            return (
              <div
                key={`${x}-${y}`}
                className={cellClass(kind, stuck, turned)}
                aria-hidden={kind === "hidden"}
              >
                {kind === "start" && pawns.length === 0 && (
                  <span className="text-[9px] font-semibold tracking-widest text-[#f2d48a]">START</span>
                )}
                {kind === "brake" && pawns.length === 0 && <span className="text-[#f2d48a]">·</span>}
                {stuck && pawns.length === 0 && <span className="text-[9px] text-[#dcff9a]">fast</span>}
                <div className="absolute inset-0 flex items-center justify-center">
                  {pawns.map((team, index) => (
                    <Pawn key={team.color} team={team} index={index} />
                  ))}
                </div>
              </div>
            )
          }),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 px-1">
        {state.order.map((color) => {
          const team = state.teams.find((item) => item.color === color)
          if (!team) return null
          const steps = team.won ? TRACK.length : team.position
          return (
            <span key={color} className="text-[11px] text-[#f7f1df]/80">
              <i className="mr-1 inline-block size-2 rounded-full" style={{ background: TEAM_STYLE[color].base }} />
              {team.name} {team.won ? "i mål" : `${steps}/20`}
            </span>
          )
        })}
      </div>
    </section>
  )
}

function cellClass(kind: ReturnType<typeof cellKind>, stuck: boolean, turned: boolean) {
  if (kind === "hidden") return "aspect-square"
  const tone = stuck ? "cell-stuck" : turned ? "cell-turned" : kind === "start" ? "cell-start" : kind === "brake" ? "cell-brake" : "cell-track"
  return `relative flex aspect-square items-center justify-center overflow-hidden rounded-xl ${tone}`
}

function Pawn({ team, index }: { team: Team; index: number }) {
  const style = TEAM_STYLE[team.color]
  return (
    <span
      key={`${team.color}-${team.position}-${team.won}`}
      className="pawn-hop relative grid size-9 place-items-center rounded-full text-sm font-bold shadow-md sm:size-12"
      style={{
        background: style.base,
        color: style.ink,
        marginLeft: index === 0 ? 0 : -12,
        zIndex: index + 1,
        boxShadow: team.won ? "0 0 0 2px #f2d48a" : undefined,
      }}
      title={team.name}
    >
      {team.name.slice(0, 1).toUpperCase()}
      {team.won && <span className="absolute -top-2 text-[10px]">👑</span>}
    </span>
  )
}
