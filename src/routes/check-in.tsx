import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { EmptyState, PageHeader, Panel, Pill, Stat } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  blankCheckIn,
  formatLongDay,
  HABITS,
  isoDaysAgo,
  lifeScore,
  store,
  todayISO,
  type CheckIn,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/check-in")({ component: TodayPage });

const SCALES: { key: keyof CheckIn; label: string; hint: string }[] = [
  { key: "mood", label: "Mood", hint: "1 low · 10 great" },
  { key: "energy", label: "Energy", hint: "1 drained · 10 buzzing" },
  { key: "stress", label: "Stress", hint: "1 calm · 10 overwhelmed" },
  { key: "productivity", label: "Productivity", hint: "1 stalled · 10 flowing" },
  { key: "sleepQuality", label: "Sleep quality", hint: "1 poor · 10 restful" },
];

function ScaleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <span className="font-mono text-sm text-foreground">
          {value}
          <span className="text-muted-foreground">/10</span>
        </span>
      </div>
      <Slider value={[value]} min={1} max={10} step={1} onValueChange={(v) => onChange(v[0])} />
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          step={step}
          value={String(value)}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="bg-background pr-14"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function TodayPage() {
  useSyncExternalStore(store.subscribe, store.version);
  const [date, setDate] = useState(todayISO());
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const existing = store.get(date);
  const [draft, setDraft] = useState<CheckIn>(() => store.get(todayISO()) ?? blankCheckIn(todayISO()));
  const [loadedFor, setLoadedFor] = useState(date);

  if (loadedFor !== date) {
    setDraft(existing ?? blankCheckIn(date));
    setLoadedFor(date);
    setSaved(false);
  }

  const entries = store.all();
  const score = useMemo(() => lifeScore(entries), [entries]);

  const set = <K extends keyof CheckIn>(key: K, value: CheckIn[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const toggleHabit = (id: string) => {
    setDraft((d) => ({
      ...d,
      habits: d.habits.includes(id) ? d.habits.filter((h) => h !== id) : [...d.habits, id],
    }));
    setSaved(false);
  };

  const save = async () => {
    setSaveError(null);
    try {
      await store.upsert({ ...draft, date, source: draft.source === "demo" ? "manual" : draft.source });
      setSaved(true);
    } catch (error) {
      setSaved(false);
      setSaveError(error instanceof Error ? error.message : "We could not save this check-in.");
    }
  };

  const isToday = date === todayISO();
  const dayOptions = Array.from({ length: 14 }, (_, i) => isoDaysAgo(i));

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title={isToday ? "How has today been?" : `Editing ${formatLongDay(date)}`}
        description="One short check-in a day is all the app needs. Everything else — trends, reviews and cross-domain insights — is built from these answers. You can edit any past day."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-[9.5rem] bg-card"
              aria-label="Check-in date"
            />
            <Button onClick={() => void save()} className="shadow-sm transition-all duration-200 hover:scale-[1.03]">
              {existing ? "Update" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {existing ? (
          <Pill tone={existing.source === "demo" ? "warning" : "success"}>
            {existing.source === "demo" ? "Demo data — edit to make it yours" : "Saved check-in"}
          </Pill>
        ) : (
          <Pill>No entry yet for this day</Pill>
        )}
        {saved && <Pill tone="success">Changes saved</Pill>}
        {saveError && <Pill tone="warning">{saveError}</Pill>}
        <Pill tone="info">{score.sample}-day sample in Life Score</Pill>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="How you felt" hint="Slide to the closest honest answer — nothing here is scored against you.">
            <div className="grid gap-6 sm:grid-cols-2">
              {SCALES.map((s) => (
                <ScaleRow
                  key={s.key as string}
                  label={s.label}
                  hint={s.hint}
                  value={draft[s.key] as number}
                  onChange={(v) => set(s.key, v as CheckIn[typeof s.key])}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Body & day" hint="Leave anything blank at zero — partial days still count.">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Sleep" value={draft.sleepHours} step={0.25} suffix="hrs" onChange={(v) => set("sleepHours", v)} />
              <NumberField label="Exercise" value={draft.exerciseMinutes} step={5} suffix="min" onChange={(v) => set("exerciseMinutes", v)} />
              <NumberField label="Steps" value={draft.steps} step={100} onChange={(v) => set("steps", v)} />
              <NumberField label="Meals" value={draft.meals} suffix="meals" onChange={(v) => set("meals", v)} />
              <NumberField label="Water" value={draft.waterGlasses} suffix="glasses" onChange={(v) => set("waterGlasses", v)} />
              <NumberField label="Alcohol" value={draft.alcoholUnits} suffix="units" onChange={(v) => set("alcoholUnits", v)} />
              <NumberField label="Social time" value={draft.socialMinutes} step={15} suffix="min" onChange={(v) => set("socialMinutes", v)} />
              <NumberField label="Screen time" value={draft.screenHours} step={0.5} suffix="hrs" onChange={(v) => set("screenHours", v)} />
              <NumberField label="Spending" value={draft.spend} step={0.5} suffix="£" onChange={(v) => set("spend", v)} />
            </div>
          </Panel>

          <Panel title="Notes" hint="Context you'll want when a trend looks odd in three months.">
            <Textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Late finish at work, walked home along the canal, skipped dinner…"
              rows={4}
              className="resize-none bg-background"
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Routines" hint="Progress, not punishment — a missed day never resets anything.">
            <div className="space-y-2">
              {HABITS.map((h) => {
                const on = draft.habits.includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHabit(h.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                      on
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-secondary/40 hover:border-primary/30",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                      )}
                    >
                      {on && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M4 12.5l5 5L20 6.5" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{h.name}</span>
                      <span className="block text-xs text-muted-foreground">{h.cadence.replace("-", " ")}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Life Score" hint="Fully transparent — every part is shown and weighted below.">
            {score.sample === 0 ? (
              <EmptyState
                title="Nothing to score yet"
                description="Save your first check-in and a 7-day Life Score appears here with its full working shown."
              />
            ) : (
              <>
                <div className="mb-5 flex items-end gap-3">
                  <span className="font-display text-5xl font-semibold leading-none text-primary">{score.score}</span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    / 100 · last {score.sample} days
                  </span>
                </div>
                <div className="space-y-3">
                  {score.breakdown.map((b) => (
                    <div key={b.label}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="font-medium text-foreground">{b.label}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {b.value} × {Math.round(b.weight * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${b.value}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{b.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Yesterday at a glance">
            {(() => {
              const y = store.get(isoDaysAgo(1));
              if (!y)
                return (
                  <EmptyState
                    title="No entry for yesterday"
                    description="Pick yesterday's date above to fill it in — past-day editing is always open."
                  />
                );
              return (
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Mood" value={y.mood} unit="/10" tone="primary" />
                  <Stat label="Sleep" value={y.sleepHours} unit="hrs" tone="info" />
                  <Stat label="Exercise" value={y.exerciseMinutes} unit="min" />
                  <Stat label="Spend" value={`£${y.spend.toFixed(0)}`} tone="warning" />
                </div>
              );
            })()}
          </Panel>
        </div>
      </div>
    </div>
  );
}
