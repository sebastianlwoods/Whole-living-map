import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Activity, ArrowUpRight, BedDouble, CalendarDays, ChevronRight, CircleDollarSign, Dumbbell, GlassWater, Inbox, Salad, Smile, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { lifeScore, store, todayISO } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: TodayPage });

type CategoryCard = {
  title: string;
  focus: string[];
  to: "/health" | "/nutrition" | "/money" | "/time" | "/goals" | "/insights";
  icon: ReactNode;
  eyebrow: string;
  value: string;
  detail: string;
  tone: string;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function longToday() {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function metric(value: number | undefined, render: (value: number) => string) {
  return value === undefined ? "Not logged" : render(value);
}

function DailyItem({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function Category({ card }: { card: CategoryCard }) {
  return (
    <Link
      to={card.to}
      className={cn(
        "group relative flex min-h-52 flex-col overflow-hidden rounded-[1.6rem] border border-border/70 p-5 transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl sm:p-6",
        card.tone,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/75 text-foreground shadow-sm backdrop-blur">{card.icon}</div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-auto pt-8">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.eyebrow}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
          </div>
          <p className="shrink-0 font-display text-lg font-semibold text-foreground">{card.value}</p>
        </div>
      </div>
    </Link>
  );
}

function TodayPage() {
  useSyncExternalStore(store.subscribe, store.version);
  const { profile, user } = useAuth();
  const today = store.get(todayISO());
  const entries = store.all();
  const score = useMemo(() => lifeScore(entries), [entries]);
  const name = profile?.displayName || user?.email?.split("@")[0] || "there";

  const categories: CategoryCard[] = [
    { title: "Fitness", focus: ["Fitness"], to: "/health", icon: <Dumbbell className="h-5 w-5" />, eyebrow: "Movement", value: metric(today?.steps, (v) => v.toLocaleString("en-GB")), detail: today ? `${today.exerciseMinutes} active minutes today` : "Steps, workouts and heart health", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--success)_12%,var(--card)))]" },
    { title: "Sleep", focus: ["Sleep"], to: "/health", icon: <BedDouble className="h-5 w-5" />, eyebrow: "Recovery", value: metric(today?.sleepHours, (v) => `${v.toFixed(1)}h`), detail: today ? `Quality ${today.sleepQuality}/10` : "Duration, quality and recovery", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--info)_13%,var(--card)))]" },
    { title: "Money", focus: ["Money"], to: "/money", icon: <CircleDollarSign className="h-5 w-5" />, eyebrow: "Spending", value: metric(today?.spend, (v) => `£${v.toFixed(0)}`), detail: "Today, budgets and recurring costs", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--warning)_14%,var(--card)))]" },
    { title: "Nutrition", focus: ["Nutrition"], to: "/nutrition", icon: <Salad className="h-5 w-5" />, eyebrow: "Fuel", value: metric(today?.meals, (v) => `${v} meals`), detail: today ? `${today.waterGlasses} glasses of water` : "Meals, water and alcohol", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--accent)_28%,var(--card)))]" },
    { title: "Time & plans", focus: ["Focus", "Habits", "Balance"], to: "/time", icon: <CalendarDays className="h-5 w-5" />, eyebrow: "Your day", value: "Open", detail: "Calendar, reminders and screen time", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--primary)_10%,var(--card)))]" },
    { title: "Wellbeing", focus: ["Happiness"], to: "/insights", icon: <Smile className="h-5 w-5" />, eyebrow: "How life feels", value: metric(today?.mood, (v) => `${v}/10`), detail: "Mood, energy and emerging patterns", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--chart-5)_11%,var(--card)))]" },
    { title: "Goals", focus: ["Habits", "Focus"], to: "/goals", icon: <Target className="h-5 w-5" />, eyebrow: "Direction", value: "Review", detail: "Priorities, routines and progress", tone: "bg-[linear-gradient(145deg,var(--card),color-mix(in_oklab,var(--chart-4)_10%,var(--card)))]" },
  ];

  const selected = new Set(profile?.focuses ?? []);
  const ordered = [...categories].sort((a, b) => Number(b.focus.some((f) => selected.has(f))) - Number(a.focus.some((f) => selected.has(f)))).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rise-in mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">{longToday()}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{greeting()}, {name}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Here&rsquo;s the shape of your day. Open an area only when you want the detail.</p>
        </div>
        <Button asChild size="lg" className="rounded-full px-5 shadow-sm"><Link to="/check-in">Update today</Link></Button>
      </section>

      <section className="mb-7 rounded-[1.7rem] border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Today first</h2></div>
          {score.sample > 0 && <span className="text-xs text-muted-foreground">Life score {score.score}/100</span>}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <DailyItem icon={<Inbox className="h-4 w-4" />} title="Inbox" detail="Connect Gmail to surface only emails that need action" action={<Link to="/connections" className="text-xs font-semibold text-primary">Connect</Link>} />
          <DailyItem icon={<CalendarDays className="h-4 w-4" />} title="Reminders & calendar" detail="No calendar connected yet" action={<Link to="/connections" aria-label="Connect calendar" className="text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4" /></Link>} />
          <DailyItem icon={today ? <Activity className="h-4 w-4" /> : <GlassWater className="h-4 w-4" />} title={today ? "Today is updated" : "Nothing logged today"} detail={today ? "Your overview is using today’s saved data" : "Add what matters now; fill in the rest later"} action={<Link to="/check-in" className="text-xs font-semibold text-primary">{today ? "Edit" : "Add"}</Link>} />
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between gap-4">
        <div><h2 className="font-display text-2xl font-semibold text-foreground">Your life at a glance</h2><p className="mt-1 text-sm text-muted-foreground">Your chosen priorities appear first.</p></div>
        <Link to="/settings" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">Personalise</Link>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{ordered.map((card) => <Category key={card.title} card={card} />)}</section>
    </div>
  );
}
