import { getTeam, stepsTaken } from "@/game/logic.ts"
import { TEAM_STYLE, type GameState } from "@/game/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { Confetti } from "@/components/Confetti.tsx"

export function WinOverlay({ state, onClose, onAgain }: { state: GameState; onClose: () => void; onAgain: () => void }) {
  if (!state.winner) return null
  const winner = getTeam(state, state.winner)
  const style = TEAM_STYLE[winner.color]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Confetti color={style.base} />
      <div className="relative w-full max-w-md rounded-3xl border bg-card p-6 text-center shadow-2xl">
        <p className="text-xs tracking-[0.25em] text-primary uppercase">Vinner</p>
        <h2 className="wordmark mt-2 text-5xl" style={{ color: style.base }}>
          {winner.name}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {winner.stats.correct} riktige · {winner.stats.wrong} feil · {state.streakersSeen} streakere sett · beste streak {state.bestStreak}
        </p>
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          {state.teams.map((team) => (
            <li key={team.color}>
              {team.name}: {team.won ? "i mål" : `${stepsTaken(team)}/20`}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            La de andre fortsette
          </Button>
          <Button type="button" onClick={onAgain}>
            Nytt spill
          </Button>
        </div>
      </div>
    </div>
  )
}
