const ORIGIN =
  "https://raw.githubusercontent.com/fredrijo/bezzerwizzer-game/master/public/images/"

const TILE_REMOTE: Record<string, string> = {
  "kunst-scene.png": "kunst&scene.png",
  "kunst-scene-2020.png": "kunst&scene-2020.png",
  "mat-drikke.png": "mat&drikke.png",
  "mat-drikke-2020.png": "mat&drikke-2020.png",
  "sport-spill.png": "sport&spill.png",
  "naeringsliv.png": "næringsliv.png",
  "naeringsliv-2020.png": "næringsliv-2020.png",
  "sprak.png": "språk.png",
  "sprak-2020.png": "språk-2020.png",
  "tradisjon-tro.png": "tradisjon&tro.png",
  "tradisjon-tro-2020.png": "tradisjon&tro-2020.png",
  "tv-radio.png": "tv&radio.png",
  "tv-og-serier.png": "tv&serier.png",
  "tv-serier-2020.png": "tv&serier-2020.png",
  "teknologi-spill-2020.png": "teknologi&spill-2020.png",
}

export function tileUrl(file: string): string {
  if (import.meta.env.DEV || file.endsWith(".svg")) {
    return `${import.meta.env.BASE_URL}tiles/${file}`
  }
  const remote = TILE_REMOTE[file] ?? file
  return `${ORIGIN}tiles/${encodeURIComponent(remote)}`
}

const REMOTE_STREAKERS = new Set([
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
])

export function streakerUrl(file: string): string {
  if (import.meta.env.DEV || !REMOTE_STREAKERS.has(file)) {
    return `${import.meta.env.BASE_URL}streakers/${file}`
  }
  const remote = file === "laer.jpg" ? "lær.jpg" : file
  return `${ORIGIN}streakers/${encodeURIComponent(remote)}`
}
