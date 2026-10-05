import type { Category, DeckId } from "@/game/types.ts"

export const CLASSIC: Category[] = [
  { id: "arkitektur", name: "Arkitektur", icon: "🏛️", iconFile: "arkitektur.png", blurb: "Bygg, broer og byrom" },
  { id: "design", name: "Design", icon: "✏️", iconFile: "design.png", blurb: "Form, møbler og plakater" },
  { id: "film", name: "Film", icon: "🎬", iconFile: "film.png", blurb: "Lerret, regi og replikker" },
  { id: "geografi", name: "Geografi", icon: "🌍", iconFile: "geografi.png", blurb: "Land, elver og hovedsteder" },
  { id: "historie", name: "Historie", icon: "📜", iconFile: "historie.png", blurb: "År, konger og vendepunkt" },
  { id: "kunst-scene", name: "Kunst & scene", icon: "🎭", iconFile: "kunst-scene.png", blurb: "Teater, maleri og premierer" },
  { id: "litteratur", name: "Litteratur", icon: "📚", iconFile: "litteratur.png", blurb: "Romaner, dikt og forfattere" },
  { id: "mat-drikke", name: "Mat & drikke", icon: "🍽️", iconFile: "mat-drikke.png", blurb: "Kjøkken, vin og oppskrifter" },
  { id: "mennesket", name: "Mennesket", icon: "🧠", iconFile: "mennesket.png", blurb: "Kropp, sinn og vaner" },
  { id: "musikk", name: "Musikk", icon: "🎵", iconFile: "musikk.png", blurb: "Toner, band og sjangre" },
  { id: "natur", name: "Natur", icon: "🌿", iconFile: "natur.png", blurb: "Dyr, planter og landskap" },
  { id: "naturvitenskap", name: "Naturvitenskap", icon: "🔬", iconFile: "naturvitenskap.png", blurb: "Fysikk, kjemi og stjerner" },
  { id: "naeringsliv", name: "Næringsliv", icon: "📈", iconFile: "naeringsliv.png", blurb: "Selskaper, merker og marked" },
  { id: "politikk", name: "Politikk", icon: "🗳️", iconFile: "politikk.png", blurb: "Styre, valg og ideer" },
  { id: "samfunn", name: "Samfunn", icon: "🏘️", iconFile: "samfunn.png", blurb: "Skikker, tall og hverdag" },
  { id: "sport-spill", name: "Sport & spill", icon: "🏆", iconFile: "sport-spill.png", blurb: "Rekorder, lag og regler" },
  { id: "sprak", name: "Språk", icon: "💬", iconFile: "sprak.png", blurb: "Ord, uttrykk og grammatikk" },
  { id: "teknikk", name: "Teknikk", icon: "⚙️", iconFile: "teknikk.png", blurb: "Maskiner og hvordan ting virker" },
  { id: "tradisjon-tro", name: "Tradisjon & tro", icon: "🕯️", iconFile: "tradisjon-tro.png", blurb: "Høytider, myter og ritualer" },
  { id: "tv-radio", name: "TV & radio", icon: "📺", iconFile: "tv-radio.png", blurb: "Kanaler, program og stemmer" },
]

export const EDITION_2020: Category[] = [
  { id: "arkitektur-2020", name: "Arkitektur", icon: "🏛️", iconFile: "arkitektur-2020.png", blurb: "Nyere bygg og byrom" },
  { id: "design-2020", name: "Design", icon: "📐", iconFile: "design-2020.png", blurb: "Form, plakater og produkter" },
  { id: "film-2020", name: "Film", icon: "🎬", iconFile: "film-2020.png", blurb: "Nyere lerret og klassikere" },
  { id: "geografi-2020", name: "Geografi", icon: "🗺️", iconFile: "geografi-2020.png", blurb: "Kartet slik det ser ut nå" },
  { id: "historie-2020", name: "Historie", icon: "📜", iconFile: "historie-2020.png", blurb: "Nær fortid og lang fortid" },
  { id: "kjendiser", name: "Kjendiser", icon: "⭐", iconFile: "kjendiser-2020.png", blurb: "Forsider, premierer og tabber" },
  { id: "kunst-scene-2020", name: "Kunst & scene", icon: "🎨", iconFile: "kunst-scene-2020.png", blurb: "Scene, galleri og opening" },
  { id: "litteratur-2020", name: "Litteratur", icon: "📖", iconFile: "litteratur-2020.png", blurb: "Bøker folk faktisk snakker om" },
  { id: "mat-drikke-2020", name: "Mat & drikke", icon: "🍷", iconFile: "mat-drikke-2020.png", blurb: "Råvarer, restauranter og glass" },
  { id: "musikk-2020", name: "Musikk", icon: "🎧", iconFile: "musikk-2020.png", blurb: "Lister, album og øreormer" },
  { id: "natur-2020", name: "Natur", icon: "🍃", iconFile: "natur-2020.png", blurb: "Vær, arter og landskap" },
  { id: "naturvitenskap-2020", name: "Naturvitenskap", icon: "🧪", iconFile: "naturvitenskap-2020.png", blurb: "Forsøk, tall og universet" },
  { id: "naeringsliv-2020", name: "Næringsliv", icon: "💼", iconFile: "naeringsliv-2020.png", blurb: "Merkevarer og marked" },
  { id: "politikk-2020", name: "Politikk", icon: "🏛️", iconFile: "politikk-2020.png", blurb: "Valg, styrer og overskrifter" },
  { id: "samfunn-2020", name: "Samfunn", icon: "🤝", iconFile: "samfunn-2020.png", blurb: "Hverdag, tall og skikker" },
  { id: "sport-2020", name: "Sport", icon: "🏅", iconFile: "sport-2020.png", blurb: "Resultater, navn og regler" },
  { id: "sprak-2020", name: "Språk", icon: "🗨️", iconFile: "sprak-2020.png", blurb: "Ordene vi bruker nå" },
  { id: "teknologi-spill", name: "Teknologi & spill", icon: "🎮", iconFile: "teknologi-spill-2020.png", blurb: "Skjerm, konsoll og oppfinnelser" },
  { id: "tradisjon-tro-2020", name: "Tradisjon & tro", icon: "✨", iconFile: "tradisjon-tro-2020.png", blurb: "Høytid, myte og vane" },
  { id: "tv-serier-2020", name: "TV & serier", icon: "📺", iconFile: "tv-serier-2020.png", blurb: "Serier, kanaler og avslutninger" },
]

export const HOUSE: Category[] = [
  { id: "memer", name: "Memer", icon: "🐸", blurb: "Bilder som slapp unna" },
  { id: "nabolaget", name: "Nabolaget", icon: "🏡", blurb: "Gata, butikken og ryktene" },
  { id: "nitti", name: "90-tallet", icon: "📼", blurb: "Kassetter, gelé og TV-kvelder" },
  { id: "barneboeker", name: "Barnebøker", icon: "🧸", blurb: "Figurer vi fortsatt kan navnet på" },
  { id: "nattmat", name: "Nattmat", icon: "🌮", blurb: "Det som smaker etter midnatt" },
  { id: "reisemaal", name: "Reisemål", icon: "✈️", blurb: "Byer folk sier de skal til" },
  { id: "oppfinnere", name: "Oppfinnerne", icon: "💡", blurb: "Hvem som fant på det åpenbare" },
  { id: "saape", name: "Såpeserier", icon: "💋", blurb: "Slott, hemmeligheter og klipp" },
  { id: "kjaeledyr", name: "Kjæledyr", icon: "🐾", blurb: "Navn, raser og unnskyldninger" },
  { id: "ol", name: "OL-øyeblikk", icon: "🥇", blurb: "Finale, tårer og kommentatorer" },
  { id: "skrivefeil", name: "Skrivefeil", icon: "🔤", blurb: "Ord som nesten var riktige" },
  { id: "krydder", name: "Krydderhylla", icon: "🧂", blurb: "Smak, opprinnelse og overmot" },
  { id: "eksamen", name: "Eksamensnerver", icon: "📝", blurb: "Pugg, blanke ark og flaks" },
  { id: "dialekter", name: "Dialekter", icon: "🗣️", blurb: "Ord som bare virker hjemme" },
  { id: "hytta", name: "Hytta", icon: "🪵", blurb: "Ved, vær og hvem som vasker" },
  { id: "konspirasjoner", name: "Konspirasjoner", icon: "🕵️", blurb: "Teorier til kaffen, ikke til rettssaken" },
]

export type Addon = {
  id: string
  title: string
  blurb: string
  official: boolean
  categories: Category[]
}

/** Bezzerwizzer Bricks, the boxed add-on categories, plus the table's own house set. */
export const ADDONS: Addon[] = [
  {
    id: "storbyer",
    title: "Storbyer",
    blurb: "Brick. Gater, linjer og kjennetegn.",
    official: true,
    categories: [{ id: "storbyer", name: "Storbyer", icon: "🌃", iconFile: "storbyer.png", blurb: "Gater, linjer og kjennetegn" }],
  },
  {
    id: "norske-hits",
    title: "Norske hits",
    blurb: "Brick. Låter, artister og øreormer.",
    official: true,
    categories: [{ id: "norske-hits", name: "Norske hits", icon: "🎤", iconFile: "norske-hits.svg", blurb: "Låter som sitter igjen" }],
  },
  {
    id: "fotball",
    title: "Fotballens stjerner",
    blurb: "Brick. Legender, mål og kallenavn.",
    official: true,
    categories: [{ id: "fotball", name: "Fotballens stjerner", icon: "⚽", iconFile: "fotballens-stjerner.png", blurb: "Klubber, mål og legender" }],
  },
  {
    id: "kokkekunst",
    title: "Kokkekunst",
    blurb: "Brick. Teknikk, saus og temperatur.",
    official: true,
    categories: [{ id: "kokkekunst", name: "Kokkekunst", icon: "👨‍🍳", iconFile: "kokkekunst.png", blurb: "Teknikk, saus og temperatur" }],
  },
  {
    id: "norsk-sprak",
    title: "Det norske språk",
    blurb: "Brick. Ord, bøyning og uttrykk.",
    official: true,
    categories: [{ id: "norsk-sprak", name: "Det norske språk", icon: "💬", iconFile: "sprak.png", blurb: "Ord, bøyning og uttrykk" }],
  },
  {
    id: "filmperler",
    title: "Filmperler",
    blurb: "Brick. Scener folk siterer.",
    official: true,
    categories: [{ id: "filmperler", name: "Filmperler", icon: "🎬", iconFile: "film.png", blurb: "Scener folk siterer" }],
  },
  {
    id: "overskrifter",
    title: "Store overskrifter",
    blurb: "Brick. Nyheter som ble stående.",
    official: true,
    categories: [{ id: "overskrifter", name: "Store overskrifter", icon: "📰", iconFile: "overskrifter.svg", blurb: "Nyheter som ble stående" }],
  },
  {
    id: "tv-serier",
    title: "TV-serier",
    blurb: "Brick. Sesonger, cliffhangere og cast.",
    official: true,
    categories: [{ id: "tv-serier", name: "TV-serier", icon: "🍿", iconFile: "tv-serier.png", blurb: "Sesonger, cliffhangere og cast" }],
  },
  {
    id: "baerekraft",
    title: "Bærekraftsmål",
    blurb: "Brick. FNs mål, tall og løfter.",
    official: true,
    categories: [{ id: "baerekraft", name: "Bærekraftsmål", icon: "🌱", iconFile: "baerekraft.svg", blurb: "FNs mål, tall og løfter" }],
  },
  {
    id: "hus",
    title: "Huskategorier",
    blurb: "Bordets egne. Nattmat, hytta, dialekter.",
    official: false,
    categories: HOUSE,
  },
]

const partyByName = new Map<string, Category>()
for (const category of [...HOUSE, ...EDITION_2020, ...CLASSIC]) {
  if (!partyByName.has(category.name)) partyByName.set(category.name, category)
}

export const PARTY: Category[] = [...partyByName.values()]

const ALL: Category[] = [
  ...CLASSIC,
  ...EDITION_2020,
  ...HOUSE,
  ...ADDONS.flatMap((addon) => addon.categories),
]

export const DECK_INFO: Record<
  DeckId,
  { title: string; description: string; list: Category[] }
> = {
  classic: {
    title: "Klassisk",
    description: "De 20 originale kategoriene.",
    list: CLASSIC,
  },
  edition2020: {
    title: "2020-utgaven",
    description: "Nyere kortstokk med kjendiser, sport og teknologi.",
    list: EDITION_2020,
  },
  party: {
    title: "Festmiks",
    description: "Klassisk, 2020 og huskategoriene i én bunke.",
    list: PARTY,
  },
}

export function deckList(deck: DeckId): Category[] {
  return DECK_INFO[deck].list
}

export function poolFor(deck: DeckId, addonIds: readonly string[]): Category[] {
  const pool = [...deckList(deck)]
  const seen = new Set(pool.map((category) => category.id))
  for (const id of addonIds) {
    const addon = ADDONS.find((candidate) => candidate.id === id)
    if (!addon) continue
    for (const category of addon.categories) {
      if (seen.has(category.id)) continue
      seen.add(category.id)
      pool.push(category)
    }
  }
  return pool
}

export function categoryById(id: string): Category {
  return (
    ALL.find((category) => category.id === id) ?? {
      id,
      name: "Ukjent kort",
      icon: "❓",
      blurb: "Dette kortet henger igjen fra en eldre runde.",
    }
  )
}
