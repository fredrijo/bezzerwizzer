export function ShockFlash() {
  return (
    <div className="shock-flash pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M48 0 L38 42 H52 L34 100 L70 40 H54 L68 0 Z" fill="#f2d48a" opacity="0.9" />
        <path d="M20 10 L12 48 H24 L8 96 L40 46 H26 L36 10 Z" fill="#fff6d4" opacity="0.55" />
      </svg>
    </div>
  )
}
