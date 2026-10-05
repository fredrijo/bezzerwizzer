export type StreakerPhoto = {
  file: string
  quip: string
}

const originals = [
  "asian.jpg",
  "beard.jpg",
  "bikini.jpg",
  "blackandwhite.jpg",
  "blotter.jpg",
  "carrier.jpg",
  "cops.jpg",
  "cricket.jpg",
  "elegant.jpg",
  "ett_bryst.jpg",
  "hodegrep.jpg",
  "homer.jpg",
  "jagland.jpg",
  "jump.jpg",
  "kreisklasse.jpg",
  "lady.jpg",
  "laer.jpg",
  "lakk.jpg",
  "mobile.jpg",
  "ooh.jpg",
  "rodney.jpg",
  "schyyy.jpg",
  "stang.jpg",
  "tackle.jpg",
  "tennis.jpg",
]

const extras = [
  "london-richmond.jpg",
  "hongkong-1994.jpg",
  "japan.jpg",
  "grey-cup-1975.jpg",
  "harvard-yale.jpg",
  "oktoberfest-a.jpg",
  "oktoberfest-b.jpg",
  "not-on-tv-a.jpg",
  "not-on-tv-b.jpg",
  "female-streaker.jpg",
  "lego-wembley.jpg",
  "night-glitch.jpg",
  "train-socks.jpg",
  "masked-run.jpg",
  "hooded-run.jpg",
  "rose-run.jpg",
  "balloon-run.jpg",
  "festival-run.jpg",
  "ice-slide.jpg",
  "muybridge-ball.jpg",
]

const quips = [
  "Fanget på banen.",
  "Feil sportsgren. Riktig kveld.",
  "Dommeren så ingenting.",
  "Dette teller ikke som geografi.",
  "Jeg var bare på gjennomfart.",
  "Sokker teller som antrekk.",
  "Legoen slapp unna.",
  "Masken gjør det offisielt.",
  "1887, og fortsatt foran.",
  "Isen var glatt. Unnskyldningen også.",
]

export const STREAKERS: StreakerPhoto[] = [...originals, ...extras].map((file, index) => ({
  file,
  quip: quips[index % quips.length] ?? "Fanget.",
}))

export const STREAKER_MOTIONS = [
  "streak-bounce",
  "streak-flip",
  "streak-roll",
  "streak-slide",
  "streak-zoom",
  "streak-spin",
]
