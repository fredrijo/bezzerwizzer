import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"

if (existsSync("public/tiles/arkitektur.png")) {
  process.exit(0)
}

const dir = "vendor"
if (!existsSync(dir)) process.exit(0)
const parts = readdirSync(dir)
  .filter((name) => name.startsWith("public.tar.b64."))
  .sort()
if (parts.length === 0) process.exit(0)

mkdirSync("public", { recursive: true })
const packed = Buffer.from(parts.map((name) => readFileSync(`${dir}/${name}`, "utf8")).join(""), "base64")
const archive = "public.tar.gz"
writeFileSync(archive, packed)
execFileSync("tar", ["-xzf", archive])
unlinkSync(archive)
