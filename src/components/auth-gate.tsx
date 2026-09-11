import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const FOCUSES = ["Happiness", "Sleep", "Fitness", "Nutrition", "Money", "Focus", "Habits", "Balance"];

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Seb&apos;s Life</p>
            <h1 className="font-display text-2xl font-semibold">Your whole life, understood</h1>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

function SignIn() {
  const { signIn, signUp, resendConfirmation, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = mode === "sign-in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    setMessage(result ?? (mode === "sign-up" ? "Check your inbox to confirm your account." : null));
  };

  const google = async () => {
    setBusy(true);
    setMessage(await signInWithGoogle());
    setBusy(false);
  };

  const resend = async () => {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }
    setBusy(true);
    const result = await resendConfirmation(email.trim());
    setMessage(result ?? "A fresh confirmation email has been sent. Open the newest email only; older links will no longer work.");
    setBusy(false);
  };

  const needsConfirmation = message?.toLowerCase().includes("email not confirmed") ?? false;

  return (
    <Frame>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">
        Sign in to see your private dashboard. New accounts begin empty and only contain information you add or connect.
      </p>
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-secondary p-1">
        {(["sign-in", "sign-up"] as const).map((item) => (
          <button key={item} type="button" onClick={() => { setMode(item); setMessage(null); }} className={cn("rounded-lg px-3 py-2 text-sm font-medium", mode === item && "bg-card shadow-sm")}>
            {item === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5" />
        </div>
        {message && <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">{message}</p>}
        {needsConfirmation && (
          <Button type="button" variant="outline" disabled={busy} onClick={resend} className="w-full">
            Resend confirmation email
          </Button>
        )}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create my dashboard"}</Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <Button type="button" variant="outline" disabled={busy} onClick={google} className="w-full">Continue with Google</Button>
      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Your health, mood and financial data is private by default and never used for advertising.</p>
    </Frame>
  );
}

function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const suggestedName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "";
  const [name, setName] = useState(suggestedName);
  const [focuses, setFocuses] = useState<string[]>(["Happiness", "Sleep"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggle = (focus: string) => setFocuses((current) => current.includes(focus) ? current.filter((item) => item !== focus) : [...current, focus]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(await completeOnboarding(name, focuses));
    setBusy(false);
  };

  return (
    <Frame>
      <p className="mb-1 text-sm font-semibold text-primary">Welcome</p>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">Tell us what matters most. You can change this later and connect services one at a time.</p>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="display-name">What should we call you?</Label>
          <Input id="display-name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5" />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">What do you want to understand?</legend>
          <div className="flex flex-wrap gap-2">
            {FOCUSES.map((focus) => (
              <button key={focus} type="button" onClick={() => toggle(focus)} className={cn("rounded-full border px-3 py-1.5 text-sm", focuses.includes(focus) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground")}>
                {focus}
              </button>
            ))}
          </div>
        </fieldset>
        {message && <p className="text-sm text-destructive">{message}</p>}
        <Button type="submit" disabled={busy || !name.trim() || focuses.length === 0} className="w-full">{busy ? "Saving…" : "Open my dashboard"}</Button>
      </form>
    </Frame>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, user, profile, error } = useAuth();

  if (!configured) {
    return <Frame><h2 className="text-lg font-semibold">Account setup required</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the deployment environment to activate private accounts.</p></Frame>;
  }
  if (loading) return <Frame><p className="text-sm text-muted-foreground">Loading your private dashboard…</p></Frame>;
  if (!user) return <SignIn />;
  if (error && !profile) return <Frame><h2 className="text-lg font-semibold">We could not load your account</h2><p className="mt-2 text-sm text-destructive">{error}</p></Frame>;
  if (!profile?.onboardingComplete) return <Onboarding />;
  return children;
}
