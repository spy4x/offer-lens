// Icon — consistent stroke-based SVG icons. 1.5 stroke-width, rounded.
// All icons render at currentColor so they inherit text color.

import type { JSX } from "preact"

export type IconName =
  | "lens"
  | "search"
  | "link"
  | "sparkle"
  | "zap"
  | "target"
  | "shield"
  | "trending"
  | "flask"
  | "mail"
  | "message"
  | "document"
  | "image"
  | "video"
  | "check"
  | "x"
  | "copy"
  | "share"
  | "external"
  | "arrow-right"
  | "arrow-up-right"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "menu"
  | "close"
  | "sun"
  | "moon"
  | "cog"
  | "list"
  | "plus"
  | "trash"
  | "edit"
  | "logout"
  | "user"
  | "key"
  | "clock"
  | "alert"
  | "info"
  | "lightbulb"
  | "fire"
  | "rocket"
  | "lightning"
  | "eye"
  | "tag"
  | "globe"
  | "users"
  | "package"
  | "circle-dot"
  | "credit-card"
  | "building"
  | "filter"

interface Props extends Omit<JSX.SVGAttributes<SVGSVGElement>, "name"> {
  name: IconName
  size?: number
  stroke?: number
}

export function Icon({ name, size = 18, stroke = 1.75, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths(name)}
    </svg>
  )
}

function paths(name: IconName) {
  switch (name) {
    case "lens":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </>
      )
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </>
      )
    case "link":
      return (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      )
    case "sparkle":
      return (
        <>
          <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
          <path d="M19 14l.8 1.8L21.5 17l-1.7.7L19 19.5l-.8-1.8L16.5 17l1.7-1.2L19 14z" />
        </>
      )
    case "zap":
      return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    case "target":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </>
      )
    case "shield":
      return (
        <>
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </>
      )
    case "trending":
      return (
        <>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </>
      )
    case "flask":
      return (
        <>
          <path d="M9 3v6L4 18a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 18l-5-9V3" />
          <path d="M9 3h6" />
          <path d="M7 14h10" />
        </>
      )
    case "mail":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <polyline points="3 7 12 13 21 7" />
        </>
      )
    case "message":
      return (
        <>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </>
      )
    case "document":
      return (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </>
      )
    case "image":
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" />
        </>
      )
    case "video":
      return (
        <>
          <rect x="3" y="6" width="14" height="12" rx="2" />
          <polygon points="22 8 17 12 22 16 22 8" />
        </>
      )
    case "check":
      return <polyline points="20 6 9 17 4 12" />
    case "x":
      return (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )
    case "copy":
      return (
        <>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </>
      )
    case "share":
      return (
        <>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </>
      )
    case "external":
      return (
        <>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </>
      )
    case "arrow-right":
      return (
        <>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </>
      )
    case "arrow-up-right":
      return (
        <>
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </>
      )
    case "chevron-right":
      return <polyline points="9 18 15 12 9 6" />
    case "chevron-down":
      return <polyline points="6 9 12 15 18 9" />
    case "chevron-left":
      return <polyline points="15 18 9 12 15 6" />
    case "menu":
      return (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )
    case "close":
      return (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
        </>
      )
    case "moon":
      return <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    case "cog":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      )
    case "list":
      return (
        <>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </>
      )
    case "plus":
      return (
        <>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </>
      )
    case "trash":
      return (
        <>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </>
      )
    case "edit":
      return (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </>
      )
    case "logout":
      return (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </>
      )
    case "user":
      return (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      )
    case "key":
      return (
        <>
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </>
      )
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </>
      )
    case "alert":
      return (
        <>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      )
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </>
      )
    case "lightbulb":
      return (
        <>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14a4 4 0 1 0-6.18 0c.5.5.83 1.2.95 1.95l.14.85a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.14-.85c.12-.75.45-1.45.95-1.95z" />
        </>
      )
    case "fire":
      return (
        <>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </>
      )
    case "rocket":
      return (
        <>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </>
      )
    case "lightning":
      return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    case "eye":
      return (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )
    case "tag":
      return (
        <>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </>
      )
    case "globe":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z" />
        </>
      )
    case "users":
      return (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )
    case "package":
      return (
        <>
          <path d="M16.5 9.4l-9-5.19" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </>
      )
    case "circle-dot":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </>
      )
    case "credit-card":
      return (
        <>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </>
      )
    case "building":
      return (
        <>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="9" y1="6" x2="9" y2="6.01" />
          <line x1="9" y1="10" x2="9" y2="10.01" />
          <line x1="9" y1="14" x2="9" y2="14.01" />
          <line x1="15" y1="6" x2="15" y2="6.01" />
          <line x1="15" y1="10" x2="15" y2="10.01" />
          <line x1="15" y1="14" x2="15" y2="14.01" />
          <path d="M10 22v-4h4v4" />
        </>
      )
    case "filter":
      return (
        <>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </>
      )
  }
}
