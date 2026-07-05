// OfferLens brand mark — geometric lens with gradient prism

interface LogoProps {
  size?: number
  showWordmark?: boolean
  class?: string
}

export function Logo({ size = 28, showWordmark = true, class: cls = "" }: LogoProps) {
  return (
    <span class={`inline-flex items-center gap-2.5 ${cls}`}>
      <Mark size={size} />
      {showWordmark && <Wordmark size={size} />}
    </span>
  )
}

export function Mark({ size = 28, class: cls = "" }: { size?: number; class?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      class={cls}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="ol-mark-grad"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#a78bfa" />
          <stop offset="0.5" stop-color="#8b5cf6" />
          <stop offset="1" stop-color="#d946ef" />
        </linearGradient>
        <linearGradient
          id="ol-mark-inner"
          x1="8"
          y1="8"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#fff" stop-opacity="0.95" />
          <stop offset="1" stop-color="#fff" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#ol-mark-grad)" />
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="url(#ol-mark-inner)"
        fill-opacity="0.08"
      />
      {/* Diamond/lens hybrid */}
      <path
        d="M16 8.5L23.5 16L16 23.5L8.5 16L16 8.5Z"
        stroke="white"
        stroke-width="1.6"
        stroke-linejoin="round"
        fill="none"
        opacity="0.95"
      />
      <circle cx="16" cy="16" r="3" fill="white" />
      <path
        d="M11 11L13 13M21 11L19 13M11 21L13 19M21 21L19 19"
        stroke="white"
        stroke-width="1.4"
        stroke-linecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span
      class="font-extrabold tracking-tight"
      style={{ fontSize: `${size}px`, letterSpacing: "-0.035em" }}
    >
      <span class="text-gradient">Offer</span>
      <span class="text-fg">Lens</span>
    </span>
  )
}
