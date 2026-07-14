import type {
  AdVariant,
  Blocker,
  LandingPageAnalysis,
  NativeAdVariant,
  TrustSignal,
} from "../lib/api.ts"
import { CopyButton } from "./CopyButton.tsx"
import { ConfidenceMeter } from "./ConfidenceMeter.tsx"
import { Icon, type IconName } from "./Icon.tsx"
import { type ComponentChildren, useState } from "preact/hooks"

interface Props {
  analysis: LandingPageAnalysis
}

export function AnalysisResults({ analysis }: Props) {
  return (
    <div class="mt-8 space-y-3">
      <ResultsHeader analysis={analysis} />
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
      {analysis.customSections?.length > 0 && (
        <CustomSectionsSection results={analysis.customSections} />
      )}
    </div>
  )
}

function ResultsHeader({ analysis }: { analysis: LandingPageAnalysis }) {
  return (
    <div class="card p-5 sm:p-6 mb-2 fade-up">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-subtle text-green border border-green/20">
            <Icon name="check" size={18} stroke={2.5} />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight">Analysis complete</h2>
            <p class="text-xs text-fg-3 mt-0.5">
              Primary angle detected · {analysis.hookIdeas?.length || 0} hooks ·{" "}
              {analysis.adCopy?.facebook?.length || 0} ad variants
            </p>
          </div>
        </div>
        <span class="badge badge-green">
          <Icon name="sparkle" size={10} />
          Live
        </span>
      </div>
    </div>
  )
}

// ── Collapsible section ──
function Section({
  icon,
  title,
  count,
  defaultOpen = true,
  children,
}: {
  icon: IconName
  title: string
  count?: number
  defaultOpen?: boolean
  children: ComponentChildren
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section class="card overflow-hidden fade-up">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 text-left
          cursor-pointer bg-transparent border-none hover:bg-input/40 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg
            bg-accent-subtle text-accent border border-accent/20 shrink-0">
            <Icon name={icon} size={15} />
          </span>
          <span class="font-semibold text-sm tracking-tight truncate">{title}</span>
          {typeof count === "number" && (
            <span class="text-xs text-fg-3 nums font-mono">{count}</span>
          )}
        </div>
        <Icon
          name="chevron-down"
          size={14}
          class={`text-fg-3 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div class="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 border-t border-border">
          {children}
        </div>
      )}
    </section>
  )
}

function PrimaryAngle({ angle }: { angle: LandingPageAnalysis["primaryAngle"] }) {
  const type = esc(angle.type)
  return (
    <Section icon="target" title="Primary angle">
      <div class="pt-4 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="badge badge-accent text-sm">{type}</span>
          <div class="flex-1 min-w-[200px] max-w-xs">
            <ConfidenceMeter value={angle.confidence ?? 0} label="confidence" />
          </div>
        </div>
        <p class="text-sm text-fg-2 leading-relaxed">{esc(angle.explanation || "")}</p>
      </div>
    </Section>
  )
}

function HooksList({ hooks }: { hooks: string[] }) {
  if (!hooks?.length) return null
  return (
    <Section icon="zap" title="Hook ideas" count={hooks.length}>
      <div class="pt-4">
        <div class="flex justify-end mb-3">
          <CopyButton text={hooks.join("\n")} variant="pill" label="Copy all" />
        </div>
        <ol class="space-y-2.5">
          {hooks.map((h, i) => (
            <li
              key={i}
              class="flex justify-between items-start gap-3 py-2.5 px-3 rounded-lg
                bg-surface-2 border border-border hover:border-border-strong transition-colors"
            >
              <div class="flex items-start gap-3 min-w-0">
                <span class="text-xs font-mono font-semibold text-fg-3 nums pt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span class="text-sm text-fg leading-relaxed">{esc(h)}</span>
              </div>
              <CopyButton text={h} variant="inline" />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

function TargetAudience({ audience }: { audience: LandingPageAnalysis["targetAudience"] }) {
  return (
    <Section icon="users" title="Target audience">
      <div class="pt-4 space-y-3 text-sm">
        <Row label="Demographics">{esc(audience.demographics || "—")}</Row>
        <Row label="Interests">{esc(audience.interests || "—")}</Row>
        <Row label="Likely platform">
          <span class="badge badge-accent">{esc(audience.likelyPlatform || "—")}</span>
        </Row>
        {audience.confidenceNotes && (
          <div class="pt-2 mt-2 border-t border-border">
            <p class="text-xs text-fg-3 leading-relaxed">
              <span class="text-fg-2 font-medium">Notes:</span>
              {esc(audience.confidenceNotes)}
            </p>
          </div>
        )}
      </div>
    </Section>
  )
}

function Row({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span class="text-xs font-medium text-fg-3 uppercase tracking-wider sm:w-32 shrink-0 pt-0.5">
        {label}
      </span>
      <span class="text-sm text-fg flex-1">{children}</span>
    </div>
  )
}

function AdCopySection({ adCopy }: { adCopy: LandingPageAnalysis["adCopy"] }) {
  const [tab, setTab] = useState<"facebook" | "google" | "native">("facebook")

  const total = (adCopy.facebook?.length || 0) + (adCopy.google?.length || 0) +
    (adCopy.native?.length || 0)

  return (
    <Section icon="document" title="Ad copy" count={total}>
      <div class="pt-4">
        <div class="tab-list mb-4">
          {(["facebook", "google", "native"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              class={`tab ${tab === t ? "active" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span class="ml-1.5 text-xs text-fg-3 nums">
                {t === "facebook"
                  ? adCopy.facebook?.length || 0
                  : t === "google"
                  ? adCopy.google?.length || 0
                  : adCopy.native?.length || 0}
              </span>
            </button>
          ))}
        </div>
        {tab === "facebook" && <AdVariants variants={adCopy.facebook} />}
        {tab === "google" && <AdVariants variants={adCopy.google} />}
        {tab === "native" && <NativeVariants variants={adCopy.native} />}
      </div>
    </Section>
  )
}

function AdVariants({ variants }: { variants: AdVariant[] }) {
  if (!variants?.length) return <Empty>No variants for this platform.</Empty>
  return (
    <div class="space-y-3">
      {variants.map((v, i) => (
        <div key={i} class="bg-surface-2 border border-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono font-semibold text-accent uppercase tracking-wider">
              Variant {String(i + 1).padStart(2, "0")}
            </span>
            <CopyButton
              text={`${v.headline}\n${v.primaryText}\n${v.cta}`}
              variant="pill"
              label="Copy"
            />
          </div>
          <div class="space-y-2.5">
            <Copyable label="Headline">{esc(v.headline)}</Copyable>
            <Copyable label="Body">{esc(v.primaryText)}</Copyable>
            <Copyable label="CTA">
              <span class="badge badge-accent normal-case tracking-normal">{esc(v.cta)}</span>
            </Copyable>
          </div>
        </div>
      ))}
    </div>
  )
}

function NativeVariants({ variants }: { variants: NativeAdVariant[] }) {
  if (!variants?.length) return <Empty>No variants for this platform.</Empty>
  return (
    <div class="space-y-3">
      {variants.map((v, i) => (
        <div key={i} class="bg-surface-2 border border-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono font-semibold text-accent uppercase tracking-wider">
              Variant {String(i + 1).padStart(2, "0")}
            </span>
            <CopyButton text={`${v.headline}\n${v.body}\n${v.cta}`} variant="pill" label="Copy" />
          </div>
          <div class="space-y-2.5">
            <Copyable label="Headline">{esc(v.headline)}</Copyable>
            <Copyable label="Body">{esc(v.body)}</Copyable>
            <Copyable label="CTA">
              <span class="badge badge-accent normal-case tracking-normal">{esc(v.cta)}</span>
            </Copyable>
          </div>
        </div>
      ))}
    </div>
  )
}

function Copyable({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div class="group">
      <span class="text-xs text-fg-3 uppercase tracking-wider font-medium block mb-1">
        {label}
      </span>
      <div class="flex items-start gap-2 text-sm text-fg leading-relaxed">
        <span class="flex-1">{children}</span>
      </div>
    </div>
  )
}

function EmailSmsSection({ email }: { email: LandingPageAnalysis["emailAngle"] }) {
  return (
    <Section icon="mail" title="Email & SMS angles">
      <div class="pt-4 space-y-5">
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <p class="eyebrow">Subject lines</p>
            <CopyButton
              text={(email.subjectLines || []).join("\n")}
              variant="pill"
              label="Copy all"
            />
          </div>
          <ul class="space-y-2">
            {(email.subjectLines || []).map((s, i) => (
              <li
                key={i}
                class="flex items-start gap-3 py-2 px-3 rounded-lg
                  bg-surface-2 border border-border hover:border-border-strong transition-colors"
              >
                <Icon name="mail" size={13} class="text-fg-3 mt-1 shrink-0" />
                <span class="text-sm text-fg flex-1">{esc(s)}</span>
                <CopyButton text={s} variant="inline" />
              </li>
            ))}
          </ul>
        </div>

        {email.bodyAngle && (
          <div>
            <p class="eyebrow mb-2">Email body angle</p>
            <p class="text-sm text-fg-2 leading-relaxed">{esc(email.bodyAngle)}</p>
          </div>
        )}

        {email.smsAngle && (
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="eyebrow">SMS pitch</p>
              <CopyButton text={email.smsAngle || ""} variant="pill" />
            </div>
            <div class="bg-accent-subtle border-l-2 border-accent rounded-r-lg px-4 py-3 text-sm text-fg">
              <div class="flex items-start gap-2">
                <Icon name="message" size={14} class="text-accent mt-0.5 shrink-0" />
                <span class="leading-relaxed">{esc(email.smsAngle)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

function TrustSignalsSection({ signals }: { signals: TrustSignal[] }) {
  return (
    <Section icon="shield" title="Trust signals" count={signals.length}>
      <div class="pt-4 space-y-2">
        {signals.map((ts, i) => {
          const strengthColor = ts.strength === "strong"
            ? "text-green"
            : ts.strength === "medium"
            ? "text-yellow"
            : "text-red"
          return (
            <div
              key={i}
              class="flex items-start gap-3 py-2.5 px-3 rounded-lg
                bg-surface-2 border border-border"
            >
              <div
                class={`inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5 ${
                  ts.present ? "bg-green-subtle text-green" : "bg-red-subtle text-red"
                }`}
              >
                <Icon name={ts.present ? "check" : "x"} size={12} stroke={2.5} />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-0.5">
                  <span class="font-medium text-sm text-fg">{esc(ts.type)}</span>
                  <span class={`text-xs font-semibold uppercase tracking-wider ${strengthColor}`}>
                    {ts.strength}
                  </span>
                </div>
                <p class="text-xs text-fg-3 leading-relaxed">{esc(ts.detail)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function BlockersSection({ blockers }: { blockers: Blocker[] }) {
  return (
    <Section icon="alert" title="Conversion blockers" count={blockers.length}>
      <div class="pt-4 space-y-2.5">
        {blockers.map((b, i) => {
          const sev = b.severity
          const badgeClass = sev === "high"
            ? "badge-red"
            : sev === "medium"
            ? "badge-neutral"
            : "badge-green"
          return (
            <div
              key={i}
              class="bg-surface-2 border border-border rounded-xl p-4"
            >
              <div class="flex items-start gap-3 mb-2">
                <span class={`badge ${badgeClass} normal-case tracking-normal`}>
                  {sev}
                </span>
                <p class="text-sm font-semibold text-fg flex-1">{esc(b.issue)}</p>
              </div>
              <p class="text-xs text-fg-2 leading-relaxed pl-1">
                <span class="text-fg-3">Fix:</span>
                {esc(b.suggestion)}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function AbTestsSection({ ideas }: { ideas: string[] }) {
  return (
    <Section icon="flask" title="A/B test ideas" count={ideas.length}>
      <div class="pt-4">
        <div class="flex justify-end mb-3">
          <CopyButton text={ideas.join("\n")} variant="pill" label="Copy all" />
        </div>
        <ol class="space-y-2">
          {ideas.map((idea, idx) => (
            <li
              key={idx}
              class="flex items-start gap-3 py-2.5 px-3 rounded-lg
                bg-surface-2 border border-border"
            >
              <span class="text-xs font-mono font-semibold text-accent nums pt-0.5 shrink-0">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span class="text-sm text-fg flex-1 leading-relaxed">{esc(idea)}</span>
              <CopyButton text={idea} variant="inline" />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

function CompetitiveIntel({ intel }: { intel: LandingPageAnalysis["competitiveIntel"] }) {
  return (
    <Section icon="eye" title="Competitive intel">
      <div class="pt-4 space-y-4 text-sm">
        <Row label="Likely traffic">
          <div class="flex flex-wrap gap-1.5">
            {(intel.likelyTrafficSources || []).map((src, i) => (
              <span key={i} class="badge badge-neutral normal-case tracking-normal">
                {esc(src)}
              </span>
            ))}
          </div>
        </Row>
        <Row label="Est. daily spend">
          <span class="badge badge-accent normal-case tracking-normal">
            {esc(intel.estimatedDailySpend || "—")}
          </span>
        </Row>
        <Row label="A/B testing">
          <p class="text-sm text-fg-2 leading-relaxed">
            {esc(intel.whatCompetitorsAreLikelyTesting || "—")}
          </p>
        </Row>
      </div>
    </Section>
  )
}

function CompetitorAnglesSection({ angles }: { angles: string[] }) {
  return (
    <Section icon="fire" title="Counter-angles" count={angles.length}>
      <div class="pt-4">
        <ul class="space-y-2">
          {angles.map((a, i) => (
            <li
              key={i}
              class="flex items-start gap-3 py-2.5 px-3 rounded-lg
                bg-surface-2 border border-border"
            >
              <Icon name="fire" size={13} class="text-accent mt-1 shrink-0" />
              <span class="text-sm text-fg flex-1 leading-relaxed">{esc(a)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function CustomSectionsSection({ results }: { results: Array<{ title: string; answer: string }> }) {
  return (
    <Section icon="sparkle" title="Custom analysis" count={results.length}>
      <div class="pt-4 space-y-3">
        {results.map((r, i) => (
          <div key={i} class="bg-surface-2 border border-border rounded-xl p-4">
            <div class="flex items-center justify-between mb-2 gap-2">
              <p class="font-semibold text-sm text-fg">{esc(r.title)}</p>
              <CopyButton text={r.answer} variant="pill" />
            </div>
            <p class="text-sm text-fg-2 leading-relaxed">{esc(r.answer)}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Empty({ children }: { children: ComponentChildren }) {
  return (
    <div class="text-center py-6 text-sm text-fg-3">
      {children}
    </div>
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
