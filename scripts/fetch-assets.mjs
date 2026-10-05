import { existsSync, mkdirSync, writeFileSync } from "node:fs"

const root = new URL("..", import.meta.url)
const tileDir = new URL("public/tiles/", root)
const streakDir = new URL("public/streakers/", root)

if (existsSync(new URL("arkitektur.png", tileDir))) {
  process.exit(0)
}

const leafSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M32 54V28" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  <path d="M32 34c-8-2-16-12-16-20 10 0 16 6 16 14 0-8 6-14 16-14 0 8-8 18-16 20Z" fill="#fff"/>
</svg>
`
const noteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M28 46V16l22-4v30" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="20" cy="46" r="8" fill="#fff"/>
  <circle cx="42" cy="42" r="8" fill="#fff"/>
</svg>
`
const paperSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="10" y="12" width="44" height="40" rx="3" stroke="#fff" stroke-width="4"/>
  <path d="M18 22h28M18 32h20M18 40h24" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>
`

mkdirSync(tileDir, { recursive: true })
mkdirSync(streakDir, { recursive: true })

const tileBase =
  "https://raw.githubusercontent.com/fredrijo/bezzerwizzer-game/master/public/images/tiles/"
const streakBase =
  "https://raw.githubusercontent.com/fredrijo/bezzerwizzer-game/master/public/images/streakers/"

const remoteTiles = [
  "arkitektur-2020.png",
  "arkitektur.png",
  "design-2020.png",
  "design.png",
  "film-2020.png",
  "film.png",
  "fotballens-stjerner.png",
  "geografi-2020.png",
  "geografi.png",
  "historie-2020.png",
  "historie.png",
  "kjendiser-2020.png",
  "kokkekunst.png",
  "kunst&scene-2020.png",
  "kunst&scene.png",
  "litteratur-2020.png",
  "litteratur.png",
  "mat&drikke-2020.png",
  "mat&drikke.png",
  "mennesket.png",
  "musikk-2020.png",
  "musikk.png",
  "natur-2020.png",
  "natur.png",
  "naturvitenskap-2020.png",
  "naturvitenskap.png",
  "næringsliv-2020.png",
  "næringsliv.png",
  "politikk-2020.png",
  "politikk.png",
  "samfunn-2020.png",
  "samfunn.png",
  "sport&spill.png",
  "sport-2020.png",
  "språk-2020.png",
  "språk.png",
  "storbyer.png",
  "teknikk.png",
  "teknologi&spill-2020.png",
  "tradisjon&tro-2020.png",
  "tradisjon&tro.png",
  "tv&radio.png",
  "tv&serier-2020.png",
  "tv&serier.png",
  "tv-serier.png",
]

const remoteStreakers = [
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
  "lakk.jpg",
  "lær.jpg",
  "mobile.jpg",
  "ooh.jpg",
  "rodney.jpg",
  "schyyy.jpg",
  "stang.jpg",
  "tackle.jpg",
  "tennis.jpg",
]

for (const name of remoteTiles) {
  await save(tileBase + encodeURIComponent(name), new URL(localTileName(name), tileDir))
}
for (const name of remoteStreakers) {
  await save(streakBase + encodeURIComponent(name), new URL(localStreakName(name), streakDir))
}

writeFileSync(new URL("baerekraft.svg", tileDir), leafSvg)
writeFileSync(new URL("norske-hits.svg", tileDir), noteSvg)
writeFileSync(new URL("overskrifter.svg", tileDir), paperSvg)
writeFileSync(
  new URL("public/favicon.svg", root),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#0c4a30"/>
  <text x="32" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#f2d48a">B</text>
</svg>
`,
)

function localTileName(name) {
  if (name === "tv&serier.png") return "tv-og-serier.png"
  return name.replaceAll("&", "-").replaceAll("æ", "ae").replaceAll("ø", "o").replaceAll("å", "a")
}

function localStreakName(name) {
  return name.replaceAll("æ", "ae").replaceAll("ø", "o").replaceAll("å", "a")
}

async function save(url, fileUrl) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not download ${url} (${response.status})`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 100) {
    throw new Error(`Download looked empty: ${url}`)
  }
  writeFileSync(fileUrl, bytes)
}
