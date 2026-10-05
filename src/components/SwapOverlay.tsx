import { categoryById } from "@/game/categories.ts"
import { TEAM_STYLE, type GameState, type TeamColor, type TileRef } from "@/game/types.ts"
import { CategoryMark } from "@/components/CategoryMark.tsx"
import { Button } from "@/components/ui/button.tsx"

type SwapOverlayProps = {
  state: GameState
  selected: TileRef | null
  onSelect: (ref: TileRef) => void
  onSwap: (source: TileRef, target: TileRef) => void
  onStart: () => void
}

export function SwapOverlay({ state, selected, onSelect, onSwap, onStart }: SwapOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="px-4 pt-5 sm:px-8">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">Runde {state.round} · fire nye kategorier</p>
        <h2 className="wordmark text-4xl leading-none sm:text-6xl">Bytt innen laget</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Trykk to brikker i samme lag for å bytte plass. Tallet er poengene den kategorien gir.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-auto px-4 py-4 sm:grid-cols-2 sm:px-8">
        {state.order.map((color) => {
          const team = state.teams.find((item) => item.color === color)
          if (!team) return null
          const style = TEAM_STYLE[color]
          const armedHere = selected?.color === color
          return (
            <section key={color} className="rounded-3xl border p-3 sm:p-4" style={{ borderColor: style.base }}>
              <h3 className="mb-3 text-lg font-semibold" style={{ color: style.base }}>
                {team.name}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {team.tiles.map((tile, index) => {
                  const category = categoryById(tile.categoryId)
                  const armed = armedHere && selected.index === index
                  return (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      draggable
                      onClick={() => {
                        const ref = { color, index }
                        if (selected && selected.color === color && selected.index !== index) onSwap(selected, ref)
                        else onSelect(ref)
                      }}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", `${color}:${index}`)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const [fromColor, fromIndex] = event.dataTransfer.getData("text/plain").split(":")
                        if (fromColor !== color || fromIndex === undefined) return
                        const source = { color: fromColor as TeamColor, index: Number(fromIndex) }
                        if (source.index === index) return
                        onSwap(source, { color, index })
                      }}
                      className={`flex min-h-40 cursor-grab flex-col items-center justify-center gap-2 rounded-2xl border bg-[#f6f1e4] px-2 py-3 text-[#1c2416] sm:min-h-52 ${
                        armed ? "ring-4 ring-primary" : ""
                      }`}
                      style={{ borderColor: style.base }}
                    >
                      <span className="text-3xl leading-none font-bold tabular-nums" style={{ color: style.base }}>
                        {index + 1}
                      </span>
                      <CategoryMark category={category} size="xl" />
                      <span className="text-center text-sm leading-tight font-semibold sm:text-base">{category.name}</span>
                    </button>
                  )
                })}
              </div>
              {armedHere && <p className="mt-2 text-xs text-muted-foreground">Trykk en annen brikke i laget.</p>}
            </section>
          )
        })}
      </div>

      <footer className="border-t px-4 py-4 sm:px-8">
        <Button type="button" className="h-14 w-full text-lg" onClick={onStart}>
          Start runden
        </Button>
      </footer>
    </div>
  )
}
