import { useEffect, useRef, useState } from "react"
import { MOODS, tableAudio, type MoodId } from "@/game/audio.ts"
import { DECK_INFO } from "@/game/categories.ts"
import {
  answerCurrent,
  awardBezzerPoints,
  createGame,
  effectiveChance,
  newRound,
  nudge,
  playBezzer,
  releaseStreaker,
  renameTeam,
  setFestMode,
  setStreakChance,
  startRound,
  swapTiles,
  uid,
  unleashChaos,
} from "@/game/logic.ts"
import { clearGame, loadGame, saveGame } from "@/game/storage.ts"
import type { GameState, NewGameConfig, Result, TeamColor, TileRef } from "@/game/types.ts"
import { Board } from "@/components/Board.tsx"
import { SetupScreen } from "@/components/SetupScreen.tsx"
import { ShockFlash } from "@/components/ShockFlash.tsx"
import { STREAKER_MOTIONS, STREAKERS } from "@/components/streakers.tsx"
import { streakerUrl } from "@/lib/assets.ts"
import { SwapOverlay } from "@/components/SwapOverlay.tsx"
import { TeamPanel } from "@/components/TeamPanel.tsx"
import { TurnBox } from "@/components/TurnBox.tsx"
import { WinOverlay } from "@/components/WinOverlay.tsx"
import { Button } from "@/components/ui/button.tsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Slider } from "@/components/ui/slider.tsx"

type Runner = {
  id: string
  file: string
  motion: string
  actor: TeamColor
}

type ConfirmKind = "round" | "reset" | null

export default function App() {
  const saved = useRef(loadGame())
  const [state, setState] = useState<GameState | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const pastRef = useRef<GameState[]>([])
  const bagRef = useRef<string[]>([])
  const [swapFrom, setSwapFrom] = useState<TileRef | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [runners, setRunners] = useState<Runner[]>([])
  const [shockKey, setShockKey] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [winOpen, setWinOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmKind>(null)
  const [mood, setMood] = useState<MoodId | null>(null)
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const [running, setRunning] = useState(false)
  const [hasSave, setHasSave] = useState(() => saved.current !== null)
  const [canUndo, setCanUndo] = useState(false)
  const lastTick = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (!banner) return
    const timer = window.setTimeout(() => setBanner(null), 4200)
    return () => window.clearTimeout(timer)
  }, [banner])

  useEffect(() => {
    if (!state) return
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [state])

  useEffect(() => {
    if (state?.winner) setWinOpen(true)
    if (state && !state.winner) setWinOpen(false)
  }, [state?.winner, state])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        const next = Math.max(0, current - 0.1)
        if (next === 0) setRunning(false)
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (!running || muted) return
    const whole = Math.ceil(seconds)
    if (whole === lastTick.current) return
    lastTick.current = whole
    if (whole > 0 && whole <= 5) tableAudio.tick()
    if (whole === 0) tableAudio.chime()
  }, [seconds, running, muted])

  function play(result: Result) {
    if (!muted) {
      if (result.effect.clap) tableAudio.clap()
      if (result.effect.shock) tableAudio.shock()
      if (result.effect.blip) tableAudio.blip()
      if (result.effect.fanfare) tableAudio.fanfare()
      if (result.effect.chime) tableAudio.chime()
    }
    if (result.effect.shock) {
      setShockKey((key) => key + 1)
      setShaking(true)
      window.setTimeout(() => setShaking(false), 450)
    }
    if (result.effect.banner) setBanner(result.effect.banner)
    if (result.effect.streakers > 0) spawn(result.effect.streakers, result.actor ?? result.state.teams[0]!.color)
  }

  function commit(result: Result) {
    const current = stateRef.current
    if (!current) return
    pastRef.current = [...pastRef.current, current].slice(-40)
    setCanUndo(pastRef.current.length > 0)
    stateRef.current = result.state
    setState(result.state)
    saveGame(result.state)
    play(result)
  }

  function patch(next: GameState) {
    stateRef.current = next
    setState(next)
    saveGame(next)
  }

  function drawPhoto() {
    if (bagRef.current.length === 0) {
      bagRef.current = STREAKERS.map((item) => item.file).sort(() => Math.random() - 0.5)
    }
    return bagRef.current.pop() ?? STREAKERS[0]!.file
  }

  function spawn(count: number, actor: TeamColor) {
    const created: Runner[] = Array.from({ length: count }, () => ({
      id: uid(),
      file: drawPhoto(),
      motion: STREAKER_MOTIONS[Math.floor(Math.random() * STREAKER_MOTIONS.length)] ?? "streak-bounce",
      actor,
    }))
    const wait = tableAudio.anticipate()
    window.setTimeout(() => {
      setRunners((current) => [...current, ...created].slice(-8))
    }, wait)
  }

  function start(config: NewGameConfig) {
    tableAudio.unlock()
    tableAudio.muted = muted
    const next = createGame(config)
    pastRef.current = []
    setCanUndo(false)
    stateRef.current = next
    setState(next)
    setSwapFrom(null)
    saveGame(next)
    setHasSave(true)
  }

  function resume() {
    if (!saved.current) return
    tableAudio.unlock()
    stateRef.current = saved.current
    setState(saved.current)
  }

  function undo() {
    const previous = pastRef.current[pastRef.current.length - 1]
    if (!previous) return
    pastRef.current = pastRef.current.slice(0, -1)
    setCanUndo(pastRef.current.length > 0)
    setRunners([])
    patch(previous)
  }

  function toggleMood(id: MoodId) {
    tableAudio.muted = muted
    if (muted) return
    if (mood === id) {
      tableAudio.stopMood()
      setMood(null)
      return
    }
    void tableAudio.playMood(id)
    setMood(id)
  }

  function dismissRunner() {
    setRunners((items) => items.slice(1))
  }

  const deckTitle = state ? DECK_INFO[state.deck].title : ""

  if (!state) {
    return (
      <SetupScreen
        hasSave={hasSave}
        onStart={start}
        onResume={resume}
      />
    )
  }

  return (
    <div className={shaking ? "shake" : undefined}>
      <div className="mx-auto flex min-h-svh w-full max-w-[1500px] flex-col gap-4 px-3 py-4 sm:px-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
              Runde {state.round} · {deckTitle}
              {state.addons.length > 0 ? ` · ${state.addons.length} tillegg` : ""}
            </p>
            <h1 className="wordmark text-4xl leading-none sm:text-5xl">Bezzerwizzer</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={running ? "default" : "outline"} className="h-11 min-w-24" onClick={() => setRunning((value) => !value)}>
              {running ? formatTime(seconds) : `Tenk ${Math.round(seconds)}s`}
            </Button>
            {[20, 30, 45].map((preset) => (
              <Button key={preset} type="button" variant="ghost" className="h-11 px-2" onClick={() => { setSeconds(preset); setRunning(false) }}>
                {preset}
              </Button>
            ))}
            <Button type="button" variant={muted ? "destructive" : "outline"} className="h-11" onClick={() => {
              const next = !muted
              setMuted(next)
              tableAudio.muted = next
              if (next) {
                tableAudio.stopMood()
                setMood(null)
              }
            }}>
              {muted ? "Lyd av" : "Lyd på"}
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {MOODS.map((item) => (
            <Button key={item.id} type="button" variant={mood === item.id ? "default" : "secondary"} className="h-9" onClick={() => toggleMood(item.id)} title={item.hint}>
              {item.label}
            </Button>
          ))}
        </div>

        {banner && (
          <p className="banner-in rounded-2xl border border-primary/40 bg-primary/15 px-4 py-3 text-sm" role="status">
            {banner}
          </p>
        )}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,420px)]">
          <Board state={state} />
          <div className="flex flex-col gap-3">
            <TurnBox
              state={state}
              onStart={() => {
                setSwapFrom(null)
                commit(startRound(state))
              }}
              onAnswer={(correct) => commit(answerCurrent(state, correct))}
              onPoints={(points) => commit(awardBezzerPoints(state, points))}
              onZwap={(source, target) => {
                commit(swapTiles(state, source, target))
                setSwapFrom(null)
              }}
              onBezzer={(color) => commit(playBezzer(state, color))}
              onNewRound={() => setConfirm("round")}
            />
            <TeamPanel
              state={state}
              swapFrom={swapFrom}
              onRename={(color, name) => patch(renameTeam(state, color, name))}
              onNudge={(color, direction) => commit(nudge(state, color, direction))}
              onSwap={(source, target) => {
                commit(swapTiles(state, source, target))
                setSwapFrom(null)
              }}
              onArmSwap={(ref) => setSwapFrom(ref)}
              onBezzer={(color) => commit(playBezzer(state, color))}
            />
          </div>
        </div>

        <section className="rounded-3xl border bg-card/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-11" onClick={undo} disabled={!canUndo}>
              Angre
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={() => commit(releaseStreaker(state))}>
              Slipp streaker
            </Button>
            <Button type="button" className="h-11" onClick={() => commit(unleashChaos(state))}>
              Kaos
            </Button>
            <Button type="button" variant="secondary" className="h-11" onClick={() => setConfirm("round")}>
              Ny runde
            </Button>
            <Button type="button" variant="secondary" className="h-11" onClick={() => setConfirm("reset")}>
              Nytt spill
            </Button>
            <Button
              type="button"
              variant={state.festMode ? "default" : "outline"}
              className="h-11"
              onClick={() => patch(setFestMode(state, !state.festMode))}
            >
              {state.festMode ? "Streakerfest på" : "Streakerfest"}
            </Button>
          </div>
          <div className="mt-4 max-w-md">
            <div className="mb-2 flex justify-between text-sm">
              <span>Sjanse for streaker</span>
              <span>{effectiveChance(state)}%</span>
            </div>
            <Slider
              value={[state.streakChance]}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => patch(setStreakChance(state, value[0] ?? state.streakChance))}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Streak {state.streak}. Kategori 1 til 4 går på omgang. På prikkfeltene gir riktig svar ett felt. Zwap merker to åpne brikker og ber om bekreftelse. Besserwisser stiller et lag i kø. Svarer de riktig, velger bordet 1 eller 3 poeng.
            </p>
          </div>
          <ol className="mt-4 space-y-1 text-sm text-muted-foreground">
            {state.log.slice(0, 4).map((entry) => (
              <li key={entry.id}>{entry.text}</li>
            ))}
          </ol>
        </section>
      </div>

      {state.phase === "swap" && !state.winner && (
        <SwapOverlay
          state={state}
          selected={swapFrom}
          onSelect={setSwapFrom}
          onSwap={(source, target) => {
            commit(swapTiles(state, source, target))
            setSwapFrom(null)
          }}
          onStart={() => {
            setSwapFrom(null)
            commit(startRound(state))
          }}
        />
      )}

      {runners[0] && (
        <button type="button" className="streaker-stage" aria-label="Lukk streaker" onClick={dismissRunner}>
          <span key={runners[0].id} className={`streaker-card ${runners[0].motion}`}>
            <img
              src={streakerUrl(runners[0].file)}
              alt=""
              onError={dismissRunner}
            />
          </span>
        </button>
      )}

      {shockKey > 0 && <ShockFlash key={shockKey} />}
      {winOpen && (
        <WinOverlay
          state={state}
          onClose={() => setWinOpen(false)}
          onAgain={() => {
            setWinOpen(false)
            setConfirm("reset")
          }}
        />
      )}

      <Dialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm === "round" ? "Ny runde?" : "Nytt spill?"}</DialogTitle>
            <DialogDescription>
              {confirm === "round"
                ? "Lagene blir stående. Kategoriene deles ut på nytt."
                : "Banen nullstilles og du kommer tilbake til startskjermen."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>Avbryt</Button>
            <Button
              type="button"
              onClick={() => {
                if (confirm === "round") commit(newRound(state))
                if (confirm === "reset") {
                  clearGame()
                  tableAudio.stopMood()
                  setMood(null)
                  setState(null)
                  stateRef.current = null
                  pastRef.current = []
                  setCanUndo(false)
                  saved.current = null
                  setHasSave(false)
                  setRunners([])
                }
                setConfirm(null)
                setSwapFrom(null)
              }}
            >
              Ja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTime(seconds: number) {
  const whole = Math.ceil(seconds)
  const mins = Math.floor(whole / 60)
  const rest = whole % 60
  return `${mins}:${rest.toString().padStart(2, "0")}`
}
