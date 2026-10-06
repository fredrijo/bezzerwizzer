# Bezzerwizzer

A table-side board for a Bezzerwizzer night. Four teams (or fewer), category tiles worth 1–4, a lap around the felt, and a crowd of streakers who refuse to stay off the pitch.

Each team has one Zwap and two Bezzerwizzer bricks. On your own turn, before anyone answers, Zwap swaps any two face-up category tiles: one of yours with an opponent, two of your own, or two belonging to other teams. Turned tiles stay put. If the live category moves, teams waiting with a Bezzerwizzer take the brick back. After you start the round, the team order is shuffled and everyone answers category 1, then 2, then 3, then 4. Other teams can spend a Bezzerwizzer to join a queue. The team whose turn it is still answers first. Only a wrong answer hands the question to the next team in the queue. A queued team that answers correctly then chooses 1 or 3 points. Zwap marks the two tiles and waits for confirmation before they trade. A move that reaches the dotted squares stops on the first one. On those squares, a correct answer moves a team one square.

Category art is the original tile icons, set in glass. Extra Bezzerwizzer Bricks (Storbyer, Norske hits, Fotballens stjerner, Kokkekunst, Det norske språk, Filmperler, Store overskrifter, TV-serier, Bærekraftsmål) can be mixed into the deck from the start screen, along with the table's own house categories.

Sounds are synthesized in the browser. Streakers are the photos from the old scoreboard, plus more pitch photos. Ten of the stranger ones (a Lego invader, a night blur, a train in socks, masked runs, a balloon race, a festival dash, an ice slide, and an 1887 motion study) come from Wikimedia Commons and are served with the app.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. `npm test` checks the track against the old movement rules. `npm run build` writes a static site to `dist/`.

## GitHub Pages

The production build uses relative asset paths. The live board is [fredrijo.github.io/bezzerwizzer](https://fredrijo.github.io/bezzerwizzer/).

`.github/workflows/pages.yml` publishes `dist/` on every push to `main`. Tile icons and the original streaker photos are downloaded from `fredrijo/bezzerwizzer-game` the first time you build, unless `public/tiles/` is already present.

No server, database, or API key is required. The evening is stored in the browser.
