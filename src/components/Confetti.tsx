import { useEffect, useRef } from "react"

export function Confetti({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random() * -0.4,
      size: 4 + Math.random() * 7,
      speed: 0.003 + Math.random() * 0.007,
      spin: Math.random() * 6,
      gold: Math.random() > 0.45,
    }))
    let frame = 0
    let raf = 0
    const draw = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      context.clearRect(0, 0, canvas.width, canvas.height)
      for (const piece of pieces) {
        piece.y += piece.speed
        if (piece.y > 1.1) piece.y = -0.05
        context.save()
        context.translate(piece.x * canvas.width, piece.y * canvas.height)
        context.rotate(frame / 12 + piece.spin)
        context.fillStyle = piece.gold ? "#f2d48a" : color
        context.fillRect(-piece.size, -piece.size / 2, piece.size * 2, piece.size)
        context.restore()
      }
      frame += 1
      if (frame < 420) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [color])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" />
}
