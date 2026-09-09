// Local-first data layer for Everything's Here.
// Phase 1 uses an in-memory + subscribable store seeded with labelled demo data.
// This is swapped for Shipper Cloud (per-user, encrypted) in a later phase.

export type CheckIn = {
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  energy: number; // 1-10
  stress: number; // 1-10
  productivity: number; // 1-10
  sleepHours: number;
  sleepQuality: number; // 1-10
  exerciseMinutes: number;
  steps: number;
  meals: number;
  waterGlasses: number;
  alcoholUnits: number;
  socialMinutes: number;
  screenHours: number;
  spend: number; // GBP
  habits: string[]; // habit ids completed
  notes: string;
  source: "manual" | "demo" | "fitbit" | "apple-health";
};

export type Habit = {
  id: string;
  name: string;
  cadence: "daily" | "weekdays" | "3x-week";
  colorToken: "primary" | "info" | "warning" | "chart-4";
};

export const HABITS: Habit[] = [
  { id: "morning-walk", name: "Morning walk", cadence: "daily", colorToken: "primary" },
  { id: "no-phone-am", name: "No phone before 8am", cadence: "daily", colorToken: "info" },
  { id: "read", name: "Read 20 minutes", cadence: "daily", colorToken: "warning" },
  { id: "strength", name: "Strength session", cadence: "3x-week", colorToken: "chart-4" },
  { id: "journal", name: "Evening journal", cadence: "daily", colorToken: "primary" },
];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function formatLongDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// Deterministic pseudo-random so demo data is stable across renders.
function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function buildDemoCheckIn(dayOffset: number): CheckIn {
  const s = (k: number) => seeded(dayOffset * 7.31 + k);
  const date = isoDaysAgo(dayOffset);
  const dow = new Date(date + "T00:00:00").getDay();
  const weekend = dow === 0 || dow === 6;

  const exerciseMinutes = Math.round(clamp(s(1) * 70 - (weekend ? 0 : 5), 0, 75));
  const sleepHours = +(clamp(6.2 + s(2) * 2.4 - (weekend ? -0.4 : 0), 4.4, 9.1)).toFixed(1);
  const alcoholUnits = weekend ? Math.round(s(3) * 5) : s(3) > 0.78 ? 2 : 0;

  // Signal we want insights to be able to find: exercise ↑ mood, alcohol ↓ sleep quality.
  const moodBase = 5.1 + exerciseMinutes / 34 + (sleepHours - 7) * 0.55 - alcoholUnits * 0.28;
  const mood = Math.round(clamp(moodBase + (s(4) - 0.5) * 1.6, 1, 10));
  const sleepQuality = Math.round(clamp(7.4 - alcoholUnits * 0.75 + (s(5) - 0.5) * 1.8, 1, 10));
  const stress = Math.round(clamp(6.4 - exerciseMinutes / 40 + (s(6) - 0.5) * 2.4, 1, 10));
  const energy = Math.round(clamp(mood * 0.6 + sleepQuality * 0.35 + (s(7) - 0.5) * 1.4, 1, 10));
  const productivity = Math.round(clamp(sleepQuality * 0.55 + energy * 0.4 - (weekend ? 1.8 : 0) + (s(8) - 0.5) * 1.6, 1, 10));

  const habits = HABITS.filter((h, i) => s(20 + i) > (weekend ? 0.55 : 0.36)).map((h) => h.id);

  return {
    date,
    mood,
    energy,
    stress,
    productivity,
    sleepHours,
    sleepQuality,
    exerciseMinutes,
    steps: Math.round(3200 + exerciseMinutes * 92 + s(9) * 3600),
    meals: 2 + (s(10) > 0.45 ? 1 : 0),
    waterGlasses: Math.round(3 + s(11) * 5),
    alcoholUnits,
    socialMinutes: Math.round((weekend ? 90 : 30) + s(12) * 120),
    screenHours: +(clamp(3.1 + s(13) * 4 + (weekend ? 0.8 : 0), 1, 9)).toFixed(1),
    spend: +(clamp(6 + s(14) * 74 + stress * 2.6 + (weekend ? 22 : 0), 0, 210)).toFixed(2),
    habits,
    notes: "",
    source: "demo",
  };
}

const DEMO_DAYS = 120;

function seedData(): Record<string, CheckIn> {
  const map: Record<string, CheckIn> = {};
  for (let i = 1; i <= DEMO_DAYS; i++) {
    const c = buildDemoCheckIn(i);
    map[c.date] = c;
  }
  return map;
}

let checkIns: Record<string, CheckIn> = seedData();
const listeners = new Set<() => void>();
let snapshotVersion = 0;

function emit() {
  snapshotVersion++;
  listeners.forEach((l) => l());
}

export const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  version() {
    return snapshotVersion;
  },
  all(): CheckIn[] {
    return Object.values(checkIns).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  get(date: string): CheckIn | undefined {
    return checkIns[date];
  },
  upsert(entry: CheckIn) {
    checkIns[entry.date] = { ...entry };
    emit();
  },
  remove(date: string) {
    delete checkIns[date];
    emit();
  },
  clearAll() {
    checkIns = {};
    emit();
  },
  resetDemo() {
    checkIns = seedData();
    emit();
  },
  hasDemo() {
    return Object.values(checkIns).some((c) => c.source === "demo");
  },
  removeDemo() {
    checkIns = Object.fromEntries(Object.entries(checkIns).filter(([, v]) => v.source !== "demo"));
    emit();
  },
};

export function blankCheckIn(date: string): CheckIn {
  return {
    date,
    mood: 6,
    energy: 6,
    stress: 4,
    productivity: 6,
    sleepHours: 7,
    sleepQuality: 6,
    exerciseMinutes: 0,
    steps: 0,
    meals: 3,
    waterGlasses: 5,
    alcoholUnits: 0,
    socialMinutes: 30,
    screenHours: 4,
    spend: 0,
    habits: [],
    notes: "",
    source: "manual",
  };
}

// ---- Derived metrics ----

export type LifeScoreBreakdown = {
  label: string;
  value: number; // 0-100 sub-score
  weight: number;
  detail: string;
};

export function lifeScore(entries: CheckIn[]): {
  score: number;
  breakdown: LifeScoreBreakdown[];
  sample: number;
} {
  const recent = entries.slice(0, 7);
  if (recent.length === 0) return { score: 0, breakdown: [], sample: 0 };
  const avg = (fn: (c: CheckIn) => number) => recent.reduce((a, c) => a + fn(c), 0) / recent.length;

  const moodPart = clamp((avg((c) => c.mood) / 10) * 100, 0, 100);
  const sleepPart = clamp((Math.min(avg((c) => c.sleepHours), 8.5) / 8) * 100, 0, 100);
  const movePart = clamp((avg((c) => c.exerciseMinutes) / 30) * 100, 0, 100);
  const calmPart = clamp(((10 - avg((c) => c.stress)) / 9) * 100, 0, 100);
  const habitPart = clamp((avg((c) => c.habits.length) / HABITS.length) * 100, 0, 100);

  const breakdown: LifeScoreBreakdown[] = [
    { label: "Mood & energy", value: Math.round(moodPart), weight: 0.25, detail: `Avg mood ${avg((c) => c.mood).toFixed(1)}/10` },
    { label: "Sleep", value: Math.round(sleepPart), weight: 0.25, detail: `Avg ${avg((c) => c.sleepHours).toFixed(1)}h vs 8h target` },
    { label: "Movement", value: Math.round(movePart), weight: 0.2, detail: `Avg ${Math.round(avg((c) => c.exerciseMinutes))} min vs 30 min` },
    { label: "Calm", value: Math.round(calmPart), weight: 0.15, detail: `Avg stress ${avg((c) => c.stress).toFixed(1)}/10 (inverted)` },
    { label: "Routines", value: Math.round(habitPart), weight: 0.15, detail: `Avg ${avg((c) => c.habits.length).toFixed(1)} of ${HABITS.length} habits` },
  ];

  const score = Math.round(breakdown.reduce((a, b) => a + b.value * b.weight, 0));
  return { score, breakdown, sample: recent.length };
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}
