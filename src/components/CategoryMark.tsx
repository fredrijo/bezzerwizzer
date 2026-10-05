import { tileUrl } from "@/lib/assets.ts"
import type { Category } from "@/game/types.ts"

const TINTS = [
  "#b4532a",
  "#1f7a4d",
  "#1d4e89",
  "#8e3d6b",
  "#8a5a12",
  "#0f6e78",
  "#7c3a2d",
  "#3f4c8a",
  "#5c6b1e",
  "#6d3d8a",
  "#9a3d4a",
  "#2a6b62",
]

function tintFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  return TINTS[hash % TINTS.length] ?? TINTS[0]!
}

type CategoryMarkProps = {
  category: Category
  size?: "sm" | "md" | "lg" | "xl"
}

export function CategoryMark({ category, size = "md" }: CategoryMarkProps) {
  const tint = tintFor(category.id)
  const file = category.iconFile
  const src = file ? tileUrl(file) : null
  const drawn = file?.endsWith(".svg")
  return (
    <span
      className={`glass-mark glass-mark-${size}`}
      style={{
        background: `linear-gradient(165deg, color-mix(in srgb, ${tint} 55%, white), ${tint} 62%, color-mix(in srgb, ${tint} 72%, black))`,
      }}
    >
      {src ? (
        <img src={src} alt="" className={drawn ? "glass-drawn" : undefined} />
      ) : (
        <span className="glass-emoji" aria-hidden>
          {category.icon}
        </span>
      )}
      <span className="glass-sheen" />
    </span>
  )
}
