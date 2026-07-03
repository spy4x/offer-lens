import type {
  AdVariant,
  Blocker,
  LandingPageAnalysis,
  NativeAdVariant,
  TrustSignal,
} from "../lib/api.ts"
import { CopyButton } from "./CopyButton.tsx"
import { type ComponentChildren, useState } from "preact/hooks"

interface Props {
  analysis: LandingPageAnalysis
}

export function AnalysisResults({ analysis }: Props) {
  return (
    <div class="mt-6">
      <PrimaryAngle angle={analysis.primaryAngle} />
      <HooksList hooks={analysis.hookIdeas} />
      <TargetAudience audience={analysis.targetAudience} />
      <AdCopySection adCopy={analysis.adCopy} />
      <EmailSmsSection email={analysis.emailAngle} />
      {analysis.trustSignals?.length > 0 && <TrustSignalsSection signals={analysis.trustSignals} />}
      {analysis.conversionBlockers?.length > 0 && (
        <BlockersSection blockers={analysis.conversionBlockers} />
      )}
      {analysis.abTestIdeas?.length > 0 && <AbTestsSection ideas={analysis.abTestIdeas} />}
      <CompetitiveIntel intel={analysis.competitiveIntel} />
      {analysis.competitorAngles?.length > 0 && (
        <CompetitorAnglesSection angles={analysis.competitorAngles} />
      )}
    </div>
  )
}

// Collapsible section wrapper
function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ComponentChildren
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section class="mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none p-0"
      >
        <h2 class="text-lg text-accent flex items-center gap-2">
          <span class={`collapse-arrow ${open ? "open" : ""} inline-block`}>▶</span>
          {title}
        </h2>
      </button>
      {open && <div class="mt-2.5">{children}</div>}
    </section>
  )
}

function PrimaryAngle({ angle }: { angle: LandingPageAnalysis["primaryAngle"] }) {
  return (
    <CollapsibleSection title="🎯 PRIMARY ANGLE">
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        <div class="flex items-center gap-2.5 mb-2">
          <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold uppercase">
            {esc(angle.type)}
          </span>
          <span class="text-sm text-green font-semibold">
            {angle.confidence ?? 0}% confidence
          </span>
        </div>
        <p class="text-xs text-fg-3">{esc(angle.explanation || "")}</p>
      </div>
    </CollapsibleSection>
  )
}

function HooksList({ hooks }: { hooks: string[] }) {
  if (!hooks?.length) return null
  return (
    <CollapsibleSection title="📋 HOOK IDEAS">
      <CopyButton
        text={hooks.join("\n")}
        label="Copy All"
        class="mb-2 text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover border-none cursor-pointer"
      />
      <ol class="list-decimal pl-6">
        {hooks.map((h, i) => (
          <li key={i} class="flex justify-between items-start py-1.5 gap-2.5 text-sm">
            <span>{esc(h)}</span>
            <CopyButton text={h} />
          </li>
        ))}
      </ol>
    </CollapsibleSection>
  )
}

function TargetAudience({ audience }: { audience: LandingPageAnalysis["targetAudience"] }) {
  return (
    <CollapsibleSection title="👤 TARGET AUDIENCE">
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        <p>
          <strong>Demographics:</strong> {esc(audience.demographics || "")}
        </p>
        <p>
          <strong>Interests:</strong> {esc(audience.interests || "")}
        </p>
        <p>
          <strong>Likely Platform:</strong>{" "}
          <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">
            {esc(audience.likelyPlatform || "")}
          </span>
        </p>
        <p class="text-xs text-fg-3">
          <strong>Notes:</strong> {esc(audience.confidenceNotes || "")}
        </p>
      </div>
    </CollapsibleSection>
  )
}

function AdCopySection({ adCopy }: { adCopy: LandingPageAnalysis["adCopy"] }) {
  const [tab, setTab] = useState<"facebook" | "google" | "native">("facebook")

  return (
    <CollapsibleSection title="📑 AD COPY">
      <div class="flex gap-0.5 mb-2.5">
        {(["facebook", "google", "native"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            class={`flex-1 py-2 px-3 cursor-pointer text-xs text-center rounded-lg ${
              tab === t
                ? "bg-accent text-white border border-accent"
                : "bg-input border border-border text-fg-2"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "facebook" && <AdVariants variants={adCopy.facebook} />}
      {tab === "google" && <AdVariants variants={adCopy.google} />}
      {tab === "native" && <NativeVariants variants={adCopy.native} />}
    </CollapsibleSection>
  )
}

function AdVariants({ variants }: { variants: AdVariant[] }) {
  if (!variants?.length) return <p>No variants</p>
  return (
    <>
      {variants.map((v, i) => (
        <div key={i} class="bg-input rounded px-3 py-2.5 mb-2">
          <p class="text-xs text-accent-hover mb-1.5 font-semibold">Variant {i + 1}</p>
          <p>
            <strong>Headline:</strong> {esc(v.headline)} <CopyButton text={v.headline} />
          </p>
          <p>
            <strong>Text:</strong> {esc(v.primaryText)} <CopyButton text={v.primaryText} />
          </p>
          <p>
            <strong>CTA:</strong>{" "}
            <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">
              {esc(v.cta)}
            </span>{" "}
            <CopyButton text={v.cta} />
          </p>
        </div>
      ))}
    </>
  )
}

function NativeVariants({ variants }: { variants: NativeAdVariant[] }) {
  if (!variants?.length) return <p>No variants</p>
  return (
    <>
      {variants.map((v, i) => (
        <div key={i} class="bg-input rounded px-3 py-2.5 mb-2">
          <p class="text-xs text-accent-hover mb-1.5 font-semibold">Variant {i + 1}</p>
          <p>
            <strong>Headline:</strong> {esc(v.headline)} <CopyButton text={v.headline} />
          </p>
          <p>
            <strong>Body:</strong> {esc(v.body)} <CopyButton text={v.body} />
          </p>
          <p>
            <strong>CTA:</strong>{" "}
            <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">
              {esc(v.cta)}
            </span>{" "}
            <CopyButton text={v.cta} />
          </p>
        </div>
      ))}
    </>
  )
}

function EmailSmsSection({ email }: { email: LandingPageAnalysis["emailAngle"] }) {
  return (
    <CollapsibleSection title="📧 EMAIL & SMS ANGLES">
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        <h4>
          Subject Lines{" "}
          <CopyButton
            text={(email.subjectLines || []).join("\n")}
            label="Copy All"
            class="text-xs px-2.5 py-1 bg-accent text-white rounded-lg font-medium inline-flex items-center gap-1.5 hover:bg-accent-hover border-none cursor-pointer"
          />
        </h4>
        <ul>
          {(email.subjectLines || []).map((s, i) => (
            <li key={i} class="flex justify-between items-start gap-2.5">
              <span>{esc(s)}</span>
              <CopyButton text={s} />
            </li>
          ))}
        </ul>
        <h4>Email Body Angle</h4>
        <p class="text-xs text-fg-3">{esc(email.bodyAngle || "")}</p>
        <h4>
          SMS Pitch <CopyButton text={email.smsAngle || ""} />
        </h4>
        <p class="bg-input border-l-4 border-accent px-3 py-2.5 rounded text-sm">
          {esc(email.smsAngle || "")}
        </p>
      </div>
    </CollapsibleSection>
  )
}

function TrustSignalsSection({ signals }: { signals: TrustSignal[] }) {
  return (
    <CollapsibleSection title="🕊 TRUST SIGNALS">
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        {signals.map((ts, i) => {
          const icon = ts.present ? "✅" : "❌"
          const sc = ts.strength === "strong"
            ? "text-green"
            : ts.strength === "medium"
            ? "text-yellow"
            : "text-red"
          return (
            <p key={i}>
              {icon} <strong>{esc(ts.type)}</strong> <span class={sc}>({ts.strength})</span>:{" "}
              {esc(ts.detail)}
            </p>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}

function BlockersSection({ blockers }: { blockers: Blocker[] }) {
  return (
    <CollapsibleSection title="⚠ CONVERSION BLOCKERS">
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        {blockers.map((b, i) => {
          const dot = b.severity === "high" ? "🔴" : b.severity === "medium" ? "🟡" : "🟢"
          return (
            <div key={i} class="mb-2.5">
              <p>
                {dot} <strong>{esc(b.issue)}</strong>
              </p>
              <p class="text-xs text-fg-3">Suggestion: {esc(b.suggestion)}</p>
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}

function AbTestsSection({ ideas }: { ideas: string[] }) {
  return (
    <CollapsibleSection title="💡 A/B TEST IDEAS">
      <ol class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        {ideas.map((i, idx) => <li key={idx}>{esc(i)}</li>)}
      </ol>
    </CollapsibleSection>
  )
}

function CompetitiveIntel({ intel }: { intel: LandingPageAnalysis["competitiveIntel"] }) {
  return (
    <CollapsibleSection title="🕺 COMPETITIVE INTEL">
      <div class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        <p>
          <strong>Likely Traffic:</strong> {esc((intel.likelyTrafficSources || []).join(", "))}
        </p>
        <p>
          <strong>Est. Daily Spend:</strong>{" "}
          <span class="bg-accent text-white px-2.5 py-0.5 rounded text-xs font-semibold">
            {esc(intel.estimatedDailySpend || "")}
          </span>
        </p>
        <p>
          <strong>Competitors Testing:</strong> {esc(intel.whatCompetitorsAreLikelyTesting || "")}
        </p>
      </div>
    </CollapsibleSection>
  )
}

function CompetitorAnglesSection({ angles }: { angles: string[] }) {
  return (
    <CollapsibleSection title="⚔ COMPETITOR COUNTER-ANGLES">
      <ul class="bg-card border border-border rounded-lg px-4.5 py-3.5">
        {angles.map((a, i) => <li key={i}>{esc(a)}</li>)}
      </ul>
    </CollapsibleSection>
  )
}

function esc(str: unknown): string {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
