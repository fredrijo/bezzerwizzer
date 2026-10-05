import { useState } from "react"
import { ADDONS, DECK_INFO } from "@/game/categories.ts"
import { COLORS, DEFAULT_NAMES, DECKS, NAME_LIMIT, TEAM_STYLE, type DeckId, type NewGameConfig } from "@/game/types.ts"
import { CategoryMark } from "@/components/CategoryMark.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Slider } from "@/components/ui/slider.tsx"

type SetupScreenProps = {
  hasSave: boolean
  onStart: (config: NewGameConfig) => void
  onResume: () => void
}

export function SetupScreen({ hasSave, onStart, onResume }: SetupScreenProps) {
  const [teamCount, setTeamCount] = useState(4)
  const [deck, setDeck] = useState<DeckId>("classic")
  const [names, setNames] = useState(DEFAULT_NAMES)
  const [streakChance, setStreakChance] = useState(45)
  const [festMode, setFestMode] = useState(false)
  const [addons, setAddons] = useState<string[]>([])

  function toggleAddon(id: string) {
    setAddons((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center gap-8 px-4 py-10">
      <header>
        <p className="text-xs tracking-[0.28em] text-primary uppercase">Quizkveld</p>
        <h1 className="wordmark mt-2 text-5xl text-foreground sm:text-7xl">Bezzerwizzer</h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Digital bane til bordet. Kategorier, byttehandel og poeng, pluss en altfor ivrig samling streakere.
        </p>
      </header>

      <section className="grid gap-3">
        <h2 className="text-sm tracking-wide text-muted-foreground uppercase">Lag</h2>
        <div className="flex gap-2">
          {[2, 3, 4].map((count) => (
            <Button key={count} type="button" variant={teamCount === count ? "default" : "outline"} className="h-11" onClick={() => setTeamCount(count)}>
              {count} lag
            </Button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {COLORS.slice(0, teamCount).map((color) => (
            <label key={color} className="flex items-center gap-2 rounded-2xl border bg-card px-3 py-2">
              <span className="size-3 rounded-full" style={{ background: TEAM_STYLE[color].base }} />
              <Input
                aria-label={TEAM_STYLE[color].label}
                value={names[color]}
                maxLength={NAME_LIMIT}
                onChange={(event) => setNames({ ...names, [color]: event.target.value })}
                className="border-0 bg-transparent shadow-none"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm tracking-wide text-muted-foreground uppercase">Kortstokk</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DECKS.map((id) => {
            const info = DECK_INFO[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDeck(id)}
                className={`rounded-2xl border p-4 text-left ${deck === id ? "border-primary bg-primary/10" : "bg-card"}`}
              >
                <span className="flex gap-1">
                  {info.list.slice(0, 4).map((item) => (
                    <CategoryMark key={item.id} category={item} size="sm" />
                  ))}
                </span>
                <span className="mt-2 block font-semibold">{info.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{info.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-sm tracking-wide text-muted-foreground uppercase">Tilleggspakker</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bezzerwizzer Bricks blandes inn i bunken. Kryss av de pakkene som ligger på bordet.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ADDONS.map((addon) => {
            const on = addons.includes(addon.id)
            const sample = addon.categories[0]
            return (
              <button
                key={addon.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleAddon(addon.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${on ? "border-primary bg-primary/10" : "bg-card"}`}
              >
                {sample && <CategoryMark category={sample} size="sm" />}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {addon.title}
                    {!addon.official && <span className="ml-2 text-[10px] font-normal tracking-wide text-muted-foreground uppercase">hjemme</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{addon.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Streakere</h2>
            <p className="text-sm text-muted-foreground">{festMode ? "Festmodus: en på hvert trekk." : `${streakChance}% sjanse, høyere når laget har streak.`}</p>
          </div>
          <Button type="button" variant={festMode ? "default" : "outline"} onClick={() => setFestMode((value) => !value)}>
            Streakerfest
          </Button>
        </div>
        <Slider value={[streakChance]} min={0} max={100} step={5} onValueChange={(value) => setStreakChance(value[0] ?? 45)} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="h-12 px-6 text-base"
          onClick={() => onStart({ teamCount, names, deck, addons, streakChance, festMode })}
        >
          Sett i gang
        </Button>
        {hasSave && (
          <Button type="button" variant="outline" className="h-12 px-6" onClick={onResume}>
            Fortsett kvelden
          </Button>
        )}
      </div>
    </main>
  )
}
