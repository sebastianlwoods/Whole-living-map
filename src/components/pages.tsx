import { Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { EmptyState, PageHeader, Panel, Pill, Stat } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme, type Accent } from "@/components/theme-provider";
import { HABITS, formatDay, pearson, store, type CheckIn } from "@/lib/store";
import { cn } from "@/lib/utils";

function useEntries() {
  useSyncExternalStore(store.subscribe, store.version);
  return store.all();
}

const avg = (l: CheckIn[], f: (c: CheckIn) => number) =>
  l.length ? l.reduce((a, c) => a + f(c), 0) / l.length : 0;

function MiniBars({ values, labels, tone = "primary" }: { values: number[]; labels: string[]; tone?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-24 items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn("w-full rounded-t-md transition-all duration-500", `bg-${tone}/70`)}
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

function NoData({ what }: { what: string }) {
  return (
    <Panel>
      <EmptyState
        title={`No ${what} data yet`}
        description="Save a check-in or connect a source and this page fills in automatically."
        action={
          <Button asChild>
            <Link to="/">Go to today&rsquo;s check-in</Link>
          </Button>
        }
      />
    </Panel>
  );
}

/* ---------------- Health ---------------- */
export function HealthPage() {
  const all = useEntries();
  const w = all.slice(0, 14);
  const chron = [...w].reverse();
  if (!all.length) return <><PageHeader eyebrow="Health" title="Activity, recovery and sleep" /><NoData what="health" /></>;
  return (
    <div>
      <PageHeader
        eyebrow="Health"
        title="Activity, recovery and sleep"
        description="Movement, rest and recovery over the last two weeks. Nothing here is a diagnosis — it is your own logged data, summarised."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Avg sleep" value={avg(w, (c) => c.sleepHours).toFixed(1)} unit="hrs" tone="info" sub="14-day sample" />
        <Stat label="Avg sleep quality" value={avg(w, (c) => c.sleepQuality).toFixed(1)} unit="/10" tone="primary" />
        <Stat label="Workouts" value={w.filter((c) => c.exerciseMinutes >= 20).length} sub="20+ minutes" />
        <Stat label="Avg steps" value={Math.round(avg(w, (c) => c.steps)).toLocaleString("en-GB")} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Sleep hours" hint="Last 14 nights">
          <MiniBars values={chron.map((c) => +c.sleepHours.toFixed(1))} labels={chron.map((c) => c.date.slice(8))} tone="info" />
        </Panel>
        <Panel title="Exercise minutes" hint="Last 14 days">
          <MiniBars values={chron.map((c) => c.exerciseMinutes)} labels={chron.map((c) => c.date.slice(8))} />
        </Panel>
        <Panel title="Recovery signals" hint="Simple, transparent rules — no scoring black box.">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="text-foreground">Nights under 6.5 hours</span>
              <Pill tone="warning">{w.filter((c) => c.sleepHours < 6.5).length} of {w.length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="text-foreground">Days with alcohol logged</span>
              <Pill tone="warning">{w.filter((c) => c.alcoholUnits > 0).length} of {w.length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="text-foreground">Rest days (no exercise)</span>
              <Pill tone="info">{w.filter((c) => c.exerciseMinutes === 0).length} of {w.length}</Pill>
            </li>
          </ul>
        </Panel>
        <Panel title="Data sources" hint="Where these numbers came from">
          <ul className="space-y-2.5 text-sm">
            {["Fitbit — steps, sleep stages, resting heart rate", "Apple Health — workouts via HealthKit import", "Manual check-ins — how you actually felt"].map((s) => (
              <li key={s} className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/40 p-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground">{s}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/connections">Manage connections</Link>
          </Button>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Nutrition ---------------- */
export function NutritionPage() {
  const all = useEntries();
  const w = all.slice(0, 14);
  const chron = [...w].reverse();
  if (!all.length) return <><PageHeader eyebrow="Nutrition" title="Meals, water and alcohol" /><NoData what="nutrition" /></>;
  return (
    <div>
      <PageHeader
        eyebrow="Nutrition"
        title="Meals, water and alcohol"
        description="Kept deliberately light — counts and patterns, no calorie policing and no judgement about what you ate."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Avg meals" value={avg(w, (c) => c.meals).toFixed(1)} unit="/day" tone="primary" />
        <Stat label="Avg water" value={avg(w, (c) => c.waterGlasses).toFixed(1)} unit="glasses" tone="info" />
        <Stat label="Alcohol units" value={w.reduce((a, c) => a + c.alcoholUnits, 0)} sub="last 14 days" tone="warning" />
        <Stat label="Alcohol-free days" value={w.filter((c) => c.alcoholUnits === 0).length} unit={`/${w.length}`} tone="primary" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Water intake" hint="Glasses per day, last 14 days">
          <MiniBars values={chron.map((c) => c.waterGlasses)} labels={chron.map((c) => c.date.slice(8))} tone="info" />
        </Panel>
        <Panel title="Alcohol units" hint="Per day, last 14 days">
          <MiniBars values={chron.map((c) => c.alcoholUnits)} labels={chron.map((c) => c.date.slice(8))} tone="warning" />
        </Panel>
        <Panel title="Alcohol and next-day sleep" hint="Same-day comparison across your logged days." className="lg:col-span-2">
          {w.length < 10 ? (
            <EmptyState title="Need more days" description="At least 10 logged days are required before this comparison is worth showing." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat label="Sleep quality — alcohol-free days" value={avg(w.filter((c) => c.alcoholUnits === 0), (c) => c.sleepQuality).toFixed(1)} unit="/10" tone="primary" />
              <Stat label="Sleep quality — days with alcohol" value={avg(w.filter((c) => c.alcoholUnits > 0), (c) => c.sleepQuality).toFixed(1)} unit="/10" tone="warning" />
              <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                Descriptive averages from {w.length} days. Correlation is not causation, and this is not medical advice.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Money ---------------- */
const TRANSACTIONS = [
  { date: "Today", merchant: "Sainsbury's Local", cat: "Groceries", amount: 18.4 },
  { date: "Today", merchant: "Northern Rail", cat: "Transport", amount: 6.2 },
  { date: "Yesterday", merchant: "Kiln Coffee", cat: "Eating out", amount: 4.1 },
  { date: "Yesterday", merchant: "Octopus Energy", cat: "Bills", amount: 96.0 },
  { date: "2 days ago", merchant: "The Arch Climbing", cat: "Fitness", amount: 14.5 },
  { date: "3 days ago", merchant: "Waterstones", cat: "Books", amount: 22.99 },
];
const SUBS = [
  { name: "Spotify Duo", amount: 16.99 },
  { name: "iCloud 2TB", amount: 8.99 },
  { name: "The Arch membership", amount: 42.0 },
  { name: "Guardian supporter", amount: 12.0 },
  { name: "Kew Gardens", amount: 4.5 },
];
export function MoneyPage() {
  const all = useEntries();
  const w = all.slice(0, 30);
  const spend = w.reduce((a, c) => a + c.spend, 0);
  const budget = 1450;
  const pct = Math.min((spend / budget) * 100, 140);
  if (!all.length) return <><PageHeader eyebrow="Money" title="Spending, budgets and subscriptions" /><NoData what="money" /></>;
  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Spending, budgets and subscriptions"
        description="Read-only account data arrives via regulated Open Banking. Your bank passwords are never requested, stored or seen by this app."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Spent this period" value={`£${spend.toFixed(0)}`} sub="last 30 days" tone="primary" />
        <Stat label="Monthly budget" value={`£${budget}`} />
        <Stat label="Subscriptions" value={`£${SUBS.reduce((a, s) => a + s.amount, 0).toFixed(2)}`} unit="/mo" tone="warning" sub={`${SUBS.length} active`} />
        <Stat label="Zero-spend days" value={w.filter((c) => c.spend === 0).length} unit={`/${w.length}`} tone="info" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Budget progress" hint={`£${spend.toFixed(0)} of £${budget}`} actions={<Pill tone={pct > 100 ? "warning" : "success"}>{Math.round(pct)}% used</Pill>}>
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div className={cn("h-full rounded-full transition-all duration-700", pct > 100 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <h3 className="mt-6 mb-3 font-display text-base font-semibold text-foreground">Recent transactions</h3>
          <ul className="divide-y divide-border">
            {TRANSACTIONS.map((t) => (
              <li key={t.merchant + t.date} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{t.merchant}</span>
                  <span className="block text-xs text-muted-foreground">{t.date} · {t.cat}</span>
                </span>
                <span className="font-mono text-sm text-foreground">£{t.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Labelled demo transactions — connect Barclays or Santander in Connections for real data.</p>
        </Panel>
        <div className="space-y-6">
          <Panel title="Subscriptions" hint="Recurring payments detected">
            <ul className="divide-y divide-border">
              {SUBS.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">{s.name}</span>
                  <span className="font-mono text-muted-foreground">£{s.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Stress and spending" hint="From your own check-ins">
            {w.length < 10 ? (
              <EmptyState title="Need more days" description="At least 10 logged days before this comparison means anything." />
            ) : (
              <>
                <p className="font-mono text-sm text-foreground">
                  r = {pearson(w.map((c) => c.stress), w.map((c) => c.spend)).toFixed(2)} · n = {w.length} days
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Comparison of daily stress rating against daily spend. Correlation is not causation.
                </p>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Time ---------------- */
export function TimePage() {
  const all = useEntries();
  const w = all.slice(0, 14);
  const chron = [...w].reverse();
  if (!all.length) return <><PageHeader eyebrow="Time" title="Where your hours actually go" /><NoData what="time" /></>;
  return (
    <div>
      <PageHeader
        eyebrow="Time"
        title="Where your hours actually go"
        description="Screen time, social time and calendar load, next to how productive the day felt."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Avg screen time" value={avg(w, (c) => c.screenHours).toFixed(1)} unit="hrs" tone="warning" />
        <Stat label="Avg social time" value={Math.round(avg(w, (c) => c.socialMinutes))} unit="min" tone="primary" />
        <Stat label="Avg productivity" value={avg(w, (c) => c.productivity).toFixed(1)} unit="/10" tone="info" />
        <Stat label="Meetings this week" value="11" sub="from calendar" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Screen hours" hint="Last 14 days">
          <MiniBars values={chron.map((c) => +c.screenHours.toFixed(1))} labels={chron.map((c) => c.date.slice(8))} tone="warning" />
        </Panel>
        <Panel title="Social minutes" hint="Last 14 days">
          <MiniBars values={chron.map((c) => c.socialMinutes)} labels={chron.map((c) => c.date.slice(8))} />
        </Panel>
        <Panel title="Screen time and productivity" className="lg:col-span-2">
          {w.length < 10 ? (
            <EmptyState title="Need more days" description="At least 10 logged days before this is worth reading." />
          ) : (
            <>
              <p className="font-mono text-sm text-foreground">
                r = {pearson(w.map((c) => c.screenHours), w.map((c) => c.productivity)).toFixed(2)} · n = {w.length} days
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A weak-to-moderate relationship here is normal and easily explained by other factors. Correlation is not causation.
              </p>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Goals ---------------- */
const GOALS = [
  { name: "Sleep 7.5h on average", target: 7.5, metric: (c: CheckIn) => c.sleepHours, unit: "hrs", milestone: "4 weeks running" },
  { name: "Move 30 min a day", target: 30, metric: (c: CheckIn) => c.exerciseMinutes, unit: "min", milestone: "Longest run: 9 days" },
  { name: "Keep mood above 6.5", target: 6.5, metric: (c: CheckIn) => c.mood, unit: "/10", milestone: "Best month: November" },
  { name: "Under 5h screen time", target: 5, metric: (c: CheckIn) => c.screenHours, unit: "hrs", milestone: "Improving slowly" },
];
export function GoalsPage() {
  const all = useEntries();
  const w = all.slice(0, 28);
  if (!all.length) return <><PageHeader eyebrow="Goals" title="Goals and milestones" /><NoData what="goals" /></>;
  return (
    <div>
      <PageHeader
        eyebrow="Goals"
        title="Goals and milestones"
        description="Measured as rolling averages over four weeks, so one hard day never undoes a good month."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {GOALS.map((g) => {
          const actual = avg(w, g.metric);
          const invert = g.unit === "hrs" && g.name.startsWith("Under");
          const pct = invert
            ? Math.min((g.target / Math.max(actual, 0.1)) * 100, 100)
            : Math.min((actual / g.target) * 100, 100);
          return (
            <Panel key={g.name} title={g.name} hint={`28-day average: ${actual.toFixed(1)} ${g.unit}`} actions={<Pill tone={pct >= 95 ? "success" : pct >= 70 ? "info" : "warning"}>{Math.round(pct)}%</Pill>}>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Target {g.target} {g.unit} · {g.milestone}
              </p>
            </Panel>
          );
        })}
      </div>
      <Panel title="Routines" hint="Completion rate over 28 days — rates, not streaks." className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {HABITS.map((h) => {
            const rate = w.length ? Math.round((w.filter((c) => c.habits.includes(h.id)).length / w.length) * 100) : 0;
            return (
              <div key={h.id}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">{h.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{rate}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary/80 transition-all duration-500" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Insights ---------------- */
const PAIRS: { text: string; x: (c: CheckIn) => number; y: (c: CheckIn) => number; domains: string }[] = [
  { text: "More exercise on a day goes with a better mood that day", x: (c) => c.exerciseMinutes, y: (c) => c.mood, domains: "Activity → Mood" },
  { text: "Longer sleep goes with feeling more productive", x: (c) => c.sleepHours, y: (c) => c.productivity, domains: "Sleep → Productivity" },
  { text: "Alcohol units go with lower sleep quality", x: (c) => c.alcoholUnits, y: (c) => c.sleepQuality, domains: "Diet → Recovery" },
  { text: "Higher stress goes with higher spending", x: (c) => c.stress, y: (c) => c.spend, domains: "Stress → Money" },
  { text: "More screen time goes with lower mood", x: (c) => c.screenHours, y: (c) => c.mood, domains: "Time → Mood" },
  { text: "More social time goes with lower stress", x: (c) => c.socialMinutes, y: (c) => c.stress, domains: "Social → Stress" },
  { text: "Completing more routines goes with a better week", x: (c) => c.habits.length, y: (c) => c.mood, domains: "Routines → Mood" },
];
export function InsightsPage() {
  const all = useEntries();
  const [days, setDays] = useState(60);
  const w = useMemo(() => all.slice(0, days), [all, days]);
  const found = useMemo(
    () =>
      PAIRS.map((p) => {
        const r = pearson(w.map(p.x), w.map(p.y));
        const abs = Math.abs(r);
        return {
          ...p,
          r,
          strength: abs >= 0.45 ? "Strong" : abs >= 0.3 ? "Moderate" : abs >= 0.15 ? "Tentative" : "No clear signal",
          confidence: w.length < 14 ? "low" : w.length < 45 ? "medium" : "higher",
        };
      }).sort((a, b) => Math.abs(b.r) - Math.abs(a.r)),
    [w],
  );
  if (!all.length) return <><PageHeader eyebrow="Insights" title="What links to what" /><NoData what="insight" /></>;
  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="What links to what"
        description="Cross-domain patterns found in your own logs. Every finding shows the period, sample size and confidence. Weak findings are labelled tentative."
        actions={
          <div className="flex rounded-full border border-border bg-card p-1">
            {[30, 60, 120].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-all", days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />
      <Panel className="mb-6">
        <p className="text-sm leading-relaxed text-foreground">
          <strong className="font-semibold">How to read this.</strong> Each line compares two things you logged on the same days
          using a correlation coefficient (r), from −1 to +1. A relationship being present does not mean one thing caused the
          other — sleep, work, weather and dozens of unlogged factors all overlap. Nothing here is a diagnosis, and this app
          never offers medical advice.
        </p>
      </Panel>
      <div className="space-y-4">
        {found.map((f) => {
          const none = f.strength === "No clear signal";
          return (
            <Panel key={f.text}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">{f.domains}</p>
                  <p className="font-display text-lg font-semibold leading-snug text-foreground">{f.text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone={none ? "muted" : f.strength === "Tentative" ? "warning" : "info"}>{f.strength}</Pill>
                    <Pill>period: last {w.length} days</Pill>
                    <Pill>sample: n = {w.length}</Pill>
                    <Pill tone={f.confidence === "low" ? "warning" : "muted"}>confidence: {f.confidence}</Pill>
                  </div>
                </div>
                <span className={cn("font-mono text-2xl font-semibold shrink-0", none ? "text-muted-foreground" : f.r > 0 ? "text-primary" : "text-warning")}>
                  r {f.r >= 0 ? "+" : ""}{f.r.toFixed(2)}
                </span>
              </div>
              {f.strength === "Tentative" && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Tentative: the signal is weak enough that random variation could explain it. Keep logging before acting on it.
                </p>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- History ---------------- */
export function HistoryPage() {
  const all = useEntries();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter((c) => !t || c.date.includes(t) || c.notes.toLowerCase().includes(t));
  }, [all, q]);
  const exportCsv = () => {
    const cols: (keyof CheckIn)[] = ["date", "mood", "energy", "stress", "productivity", "sleepHours", "sleepQuality", "exerciseMinutes", "steps", "meals", "waterGlasses", "alcoholUnits", "socialMinutes", "screenHours", "spend", "source"];
    const csv = [cols.join(","), ...all.map((r) => cols.map((c) => String(r[c])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "everythings-here-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Every day you have logged"
        description="Your full record, editable and exportable. Deleting a day removes it immediately and permanently."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!all.length}>Export CSV</Button>
            <Button asChild><Link to="/">Add today</Link></Button>
          </div>
        }
      />
      <Panel>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by date or note…"
          className="mb-4 max-w-sm bg-background"
        />
        {rows.length === 0 ? (
          <EmptyState title={all.length ? "No days match that search" : "Nothing logged yet"} description={all.length ? "Try a different date or keyword." : "Your first check-in will appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Day</th>
                  <th className="py-2.5 pr-3 font-medium">Mood</th>
                  <th className="py-2.5 pr-3 font-medium">Sleep</th>
                  <th className="py-2.5 pr-3 font-medium">Exercise</th>
                  <th className="py-2.5 pr-3 font-medium">Spend</th>
                  <th className="py-2.5 pr-3 font-medium">Routines</th>
                  <th className="py-2.5 pr-3 font-medium">Source</th>
                  <th className="py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map((r) => (
                  <tr key={r.date} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-foreground">{formatDay(r.date)}</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">{r.mood}/10</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">{r.sleepHours}h</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">{r.exerciseMinutes}m</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">£{r.spend.toFixed(0)}</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">{r.habits.length}/{HABITS.length}</td>
                    <td className="py-2.5 pr-3"><Pill tone={r.source === "demo" ? "warning" : "success"}>{r.source}</Pill></td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => store.remove(r.date)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 60 && (
              <p className="mt-3 text-xs text-muted-foreground">Showing the 60 most recent of {rows.length} days.</p>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------------- Connections ---------------- */
const SOURCES = [
  { name: "Google Health / Fitbit", kind: "Activity, sleep, heart rate", status: "setup", sync: "Available after Google Health setup", perms: ["Read activity & steps", "Read sleep", "Read heart rate"], method: "Google OAuth" },
  { name: "Apple Health", kind: "Workouts, steps, sleep", status: "planned", sync: "Companion app required", perms: ["HealthKit read via companion app", "Manual export file import"], method: "HealthKit / file import" },
  { name: "Google — Gmail & Calendar", kind: "Priority email, events", status: "planned", sync: "Not connected", perms: ["Read email metadata & subjects", "Read calendar events"], method: "Google OAuth" },
  { name: "Barclays", kind: "Transactions, balances", status: "planned", sync: "TrueLayer sandbox first", perms: ["Read account balances", "Read transaction history"], method: "Regulated Open Banking" },
  { name: "Santander", kind: "Transactions, balances", status: "planned", sync: "TrueLayer sandbox first", perms: ["Read account balances", "Read transaction history"], method: "Regulated Open Banking" },
];
export function ConnectionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Connections"
        title="Sources, permissions and sync"
        description="Nothing is connected until you explicitly approve it. Bank data will flow through regulated Open Banking — this app never asks for or stores bank passwords."
      />
      <Panel className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Pill tone="success">Read-only access</Pill>
          <Pill tone="info">Encrypted in transit and at rest</Pill>
          <Pill tone="primary">No data sales, no targeted ads</Pill>
          <Pill tone="warning">No connection is active yet</Pill>
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        {SOURCES.map((s) => {
          return (
            <Panel key={s.name} title={s.name} hint={s.kind} actions={<Pill tone={s.status === "setup" ? "info" : "muted"}>{s.status === "setup" ? "Setup in progress" : "Planned"}</Pill>}>
              <p className="mb-3 text-xs text-muted-foreground">{s.sync} · via {s.method}</p>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Permissions granted</p>
              <ul className="mb-4 space-y-1.5">
                {s.perms.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled
                >
                  {s.status === "setup" ? "Connect after setup" : "Coming soon"}
                </Button>
                <Button variant="ghost" className="flex-1">Manual / CSV entry</Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
export function SettingsPage() {
  useSyncExternalStore(store.subscribe, store.version);
  const { accent, setAccent } = useTheme();
  const [analysis, setAnalysis] = useState<Record<string, boolean>>({
    "Health & activity": true,
    "Nutrition & alcohol": true,
    "Money & spending": true,
    "Time & email": false,
  });
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Privacy, data and control"
        description="You decide what is analysed, what is kept and what is deleted. Nothing is shared with advertisers, and nothing is ever sold."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Colour scheme" hint="Choose the energy of your dashboard. This preference stays on this device.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
            {([
              ["forest", "Forest", "#397a5b"],
              ["volt", "Volt", "#b9f227"],
              ["ocean", "Ocean", "#2878d4"],
              ["ember", "Ember", "#ef5b35"],
              ["violet", "Violet", "#8054d8"],
            ] as [Accent, string, string][]).map(([value, label, colour]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccent(value)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5",
                  accent === value ? "border-foreground bg-secondary shadow-md" : "border-border bg-background",
                )}
              >
                <span className="mb-3 block h-8 rounded-xl" style={{ backgroundColor: colour }} />
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Analysis controls" hint="Turn a domain off and it is excluded from all insights.">
          <div className="space-y-2">
            {Object.entries(analysis).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setAnalysis((s) => ({ ...s, [k]: !v }))}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-left transition-colors hover:border-primary/30"
              >
                <span className="text-sm font-medium text-foreground">{k}</span>
                <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", v ? "bg-primary" : "bg-border")}>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all duration-200", v ? "left-[1.4rem]" : "left-0.5")} />
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="How your data is protected">
          <ul className="space-y-3 text-sm">
            {[
              "Encrypted in transit (TLS) and at rest on the server.",
              "Access rules scope every record to your account only.",
              "Explicit consent is required per connected source.",
              "No data sales, no ad networks, no third-party trackers.",
              "Export or delete everything at any time, with no retention period.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/40 p-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Your account starts empty" hint="No sample information is mixed into personal insights.">
          <p className="text-sm leading-6 text-muted-foreground">
            New accounts only contain check-ins you save or information you explicitly import from a connected service.
          </p>
        </Panel>

        <Panel title="Delete everything" hint="Immediate and irreversible.">
          {confirm ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm text-foreground">
                This removes every check-in on this account. It cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    void store.clearAll();
                    setConfirm(false);
                  }}
                >
                  Yes, delete all data
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="text-destructive" onClick={() => setConfirm(true)}>
              Delete all my data
            </Button>
          )}
        </Panel>
      </div>
    </div>
  );
}
