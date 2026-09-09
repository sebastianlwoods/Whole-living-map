import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { EmptyState, PageHeader, Panel, Pill, Stat } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { HABITS, lifeScore, pearson, store, type CheckIn } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const RANGES = [
  { key: "7", label: "Week", days: 7 },
  { key: "30", label: "Month", days: 30 },
  { key: "365", label: "Year", days: 365 },
] as const;

const MONTHLY_BUDGET = 1450;

function Sparkline({
  values,
  color = "var(--primary)",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return <div className="h-16 rounded-lg bg-secondary/50" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 88 - 6;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-16 w-full">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={color}
        opacity="0.12"
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: 96 }}>
      {values.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-info/70 transition-all duration-500"
              style={{ height: `${Math.max((v / max) * 100, 3)}%` }}
              title={`${labels[i]}: ${v}`}
            />
          </div>
          <span className="truncate text-[0.65rem] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

const EMAILS = [
  { from: "Barclays", subject: "Your February statement is ready", tag: "Money", urgent: false },
  { from: "Dr Aline Okafor", subject: "Appointment moved to Thu 09:40", tag: "Health", urgent: true },
  { from: "Octopus Energy", subject: "Direct debit changing to £96", tag: "Bills", urgent: true },
  { from: "Kew Gardens", subject: "Membership renews in 6 days", tag: "Subscriptions", urgent: false },
];

const EVENTS = [
  { time: "09:30", title: "Standup — product", where: "Google Meet" },
  { time: "12:15", title: "Physio follow-up", where: "Bridge Clinic" },
  { time: "18:45", title: "Climbing with Sam", where: "The Arch" },
];

function avg(list: CheckIn[], fn: (c: CheckIn) => number) {
  if (!list.length) return 0;
  return list.reduce((a, c) => a + fn(c), 0) / list.length;
}

function DashboardPage() {
  useSyncExternalStore(store.subscribe, store.version);
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30");
  const days = RANGES.find((r) => r.key === range)!.days;

  const all = store.all();
  const window = useMemo(() => all.slice(0, days), [all, days]);
  const prev = useMemo(() => all.slice(days, days * 2), [all, days]);
  const score = useMemo(() => lifeScore(all), [all]);

  const chron = useMemo(() => [...window].reverse(), [window]);

  const spend = window.reduce((a, c) => a + c.spend, 0);
  const budgetForRange = (MONTHLY_BUDGET / 30) * days;
  const spendPct = Math.min((spend / budgetForRange) * 100, 140);

  const delta = (fn: (c: CheckIn) => number) => {
    if (!prev.length) return null;
    const d = avg(window, fn) - avg(prev, fn);
    return d;
  };

  const workouts = window.filter((c) => c.exerciseMinutes >= 20).length;

  const habitRates = HABITS.map((h) => ({
    ...h,
    rate: window.length ? Math.round((window.filter((c) => c.habits.includes(h.id)).length / window.length) * 100) : 0,
  })).sort((a, b) => b.rate - a.rate);

  const insights = useMemo(() => {
    const out: { text: string; r: number; tentative: boolean }[] = [];
    if (window.length >= 10) {
      const pairs: [string, (c: CheckIn) => number, (c: CheckIn) => number][] = [
        ["Days with more exercise tend to come with better mood", (c) => c.exerciseMinutes, (c) => c.mood],
        ["More sleep tracks with higher productivity", (c) => c.sleepHours, (c) => c.productivity],
        ["Higher alcohol tracks with lower sleep quality", (c) => c.alcoholUnits, (c) => c.sleepQuality],
        ["Higher stress tracks with higher spending", (c) => c.stress, (c) => c.spend],
      ];
      for (const [text, x, y] of pairs) {
        const r = pearson(window.map(x), window.map(y));
        if (Math.abs(r) >= 0.15) out.push({ text, r, tentative: Math.abs(r) < 0.3 });
      }
    }
    return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 3);
  }, [window]);

  if (all.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Dashboard" title="Your week, in one place" />
        <Panel>
          <EmptyState
            title="No data yet"
            description="Your dashboard fills in as soon as you save a check-in. Trends need about a week of days before they mean much."
            action={
              <Button asChild>
                <Link to="/">Start today&rsquo;s check-in</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  const trendLabel = (d: number | null, invert = false) => {
    if (d === null) return <Pill>no comparison period</Pill>;
    const better = invert ? d < 0 : d > 0;
    if (Math.abs(d) < 0.15) return <Pill>steady vs previous</Pill>;
    return (
      <Pill tone={better ? "success" : "warning"}>
        {d > 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)} vs previous
      </Pill>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Your week, in one place"
        description="Health, habits and life admin side by side, so patterns across them are visible instead of buried in separate apps."
        actions={
          <div className="flex rounded-full border border-border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                  range === r.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Avg mood" value={avg(window, (c) => c.mood).toFixed(1)} unit="/10" tone="primary" sub={`${window.length}-day sample`} />
        <Stat label="Avg sleep" value={avg(window, (c) => c.sleepHours).toFixed(1)} unit="hrs" tone="info" sub={`${workouts} workouts logged`} />
        <Stat label="Avg steps" value={Math.round(avg(window, (c) => c.steps)).toLocaleString("en-GB")} sub="from check-ins & devices" />
        <Stat label="Life Score" value={score.score} unit="/100" tone="primary" sub="last 7 days, transparent" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Mood & energy" hint={`Daily values across the last ${window.length} days.`} actions={trendLabel(delta((c) => c.mood))}>
            <Sparkline values={chron.map((c) => c.mood)} />
            <div className="mt-3 opacity-80">
              <Sparkline values={chron.map((c) => c.energy)} color="var(--info)" />
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Mood</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" /> Energy</span>
            </div>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Sleep" hint="Hours per night" actions={trendLabel(delta((c) => c.sleepHours))}>
              <Bars
                values={chron.slice(-7).map((c) => +c.sleepHours.toFixed(1))}
                labels={chron.slice(-7).map((c) => c.date.slice(8))}
              />
            </Panel>
            <Panel title="Movement" hint="Exercise minutes" actions={trendLabel(delta((c) => c.exerciseMinutes))}>
              <Bars
                values={chron.slice(-7).map((c) => c.exerciseMinutes)}
                labels={chron.slice(-7).map((c) => c.date.slice(8))}
              />
            </Panel>
          </div>

          <Panel
            title="Spending vs budget"
            hint={`£${spend.toFixed(0)} of £${budgetForRange.toFixed(0)} pro-rated budget`}
            actions={<Pill tone={spendPct > 100 ? "warning" : "success"}>{Math.round(spendPct)}% used</Pill>}
          >
            <div className="h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all duration-700", spendPct > 100 ? "bg-warning" : "bg-primary")}
                style={{ width: `${Math.min(spendPct, 100)}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Daily avg" value={`£${avg(window, (c) => c.spend).toFixed(0)}`} />
              <Stat label="Biggest day" value={`£${Math.max(...window.map((c) => c.spend)).toFixed(0)}`} />
              <Stat label="Zero-spend days" value={window.filter((c) => c.spend === 0).length} tone="primary" />
              <Stat label="Subscriptions" value="£84" sub="7 active, monthly" tone="warning" />
            </div>
          </Panel>

          <Panel title="Useful insights" hint="Signals found in your own data — never diagnoses.">
            {insights.length === 0 ? (
              <EmptyState
                title="Not enough days yet"
                description="Cross-domain insights need at least 10 check-ins in the selected period before anything is worth showing."
              />
            ) : (
              <ul className="space-y-3">
                {insights.map((i) => (
                  <li key={i.text} className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={i.tentative ? "warning" : "info"}>{i.tentative ? "Tentative" : "Moderate signal"}</Pill>
                      <span className="font-mono text-xs text-muted-foreground">
                        r = {i.r.toFixed(2)} · n = {window.length} days
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{i.text}</p>
                  </li>
                ))}
                <li className="text-xs leading-relaxed text-muted-foreground">
                  Correlation is not causation. These are patterns in your own logs over the selected period, not medical findings.
                </li>
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Today&rsquo;s events" hint="From your connected calendar">
            <ul className="space-y-3">
              {EVENTS.map((e) => (
                <li key={e.title} className="flex gap-3">
                  <span className="w-12 shrink-0 font-mono text-sm text-primary">{e.time}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{e.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{e.where}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Demo calendar data — connect Google Calendar in Connections.</p>
          </Panel>

          <Panel title="Priority email" hint="Only what looks time-sensitive">
            <ul className="space-y-2.5">
              {EMAILS.map((m) => (
                <li key={m.subject} className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{m.from}</span>
                    <Pill tone={m.urgent ? "warning" : "muted"}>{m.tag}</Pill>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{m.subject}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Habits & goals" hint={`Completion across ${window.length} days`}>
            <div className="space-y-3">
              {habitRates.map((h) => (
                <div key={h.id}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium text-foreground">{h.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{h.rate}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/80 transition-all duration-500" style={{ width: `${h.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Rates, not streaks — one missed day never wipes your progress.
            </p>
          </Panel>

          <Panel title="Life Score, shown fully" hint="Weighted average of five sub-scores">
            <div className="mb-4 flex items-end gap-3">
              <span className="font-display text-4xl font-semibold leading-none text-primary">{score.score}</span>
              <span className="pb-1 text-sm text-muted-foreground">/ 100 · {score.sample}-day sample</span>
            </div>
            <ul className="space-y-2.5">
              {score.breakdown.map((b) => (
                <li key={b.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-foreground">{b.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {b.value} × {Math.round(b.weight * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
