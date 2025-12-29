What you’re building
Core pages

Today (big buttons, zero thinking)

Shows: “Day 1 Upper” or “Day 2 Lower” based on schedule

Start workout → live tracking

Workout Tracker

Each exercise card:

GIF demo

Starting weight suggestion

Target sets/reps

Log each set (weight + reps)

Auto “next session” suggestion

Weight Tracker

Daily/weekly weigh-ins

Trend view (simple)

Diet Log

Protein-first logging (simple)

Daily totals (protein, calories optional)

Exercises Library

Your exact list only (no bloat)

Edit starting weights, notes, swap machine vs free weight variants

“Login”

You said “only me” — best practical setup is:

Supabase magic link once, then you’re basically always signed in on your phone.

No signup UI, no password UI. Just a single “Send link” screen one time.

This keeps your data safe and lets you sync between phone + desktop if you want.

Tech stack (modern + fast)

Next.js (App Router)

TailwindCSS

shadcn/ui (forms + dialogs + cards)

Supabase

Auth (magic link)

Postgres tables for logs

Storage bucket for GIFs/videos

React Hook Form + Zod (validation)

TanStack Query (smooth data caching)

PWA: next-pwa (offline-friendly logging)

Database design (Supabase)
Tables
exercises

Stores your specific exercises + demo media

id uuid pk

name text (e.g., “Leg Press”)

category text (“upper”, “lower”, “core”)

equipment text (“machine”, “barbell”, “dumbbell”, “cable”)

demo_url text (gif/mp4 in Supabase Storage or /public)

form_cues text

is_active boolean default true

workout_templates

id

name (“Day 1 Upper”, “Day 2 Lower”)

cycle_order int (1 or 2)

workout_template_items

Each exercise in the day, with targets + starting weight suggestion

id

template_id

exercise_id

sort_order

sets int

rep_min int

rep_max int

rest_seconds int

start_weight_lbs int (your suggested starting point)

increment_lbs int (how you progress)

notes text (“Stop 1–2 reps shy of failure”)

workout_sessions

Each time you train

id

template_id

started_at timestamptz

ended_at timestamptz nullable

bodyweight_lbs int nullable

notes text

workout_sets

Logged sets inside a session

id

session_id

exercise_id

set_number int

weight_lbs int

reps int

rir int nullable (reps in reserve)

is_warmup boolean default false

bodyweight_logs

id

logged_at date

weight_lbs int

waist_in numeric nullable

notes text

diet_logs

Keep it simple, protein-first

id

logged_at date

protein_g int

calories int nullable

steps int nullable

notes text

Seed data (your exact plan + suggested starts)
Day 1 — Upper (your template items)

Chest Press (machine) — 4 x 6–10 — start 220 — rest 120s — inc 10

Lat Pulldown — 4 x 8–12 — start 270 — rest 90s — inc 10

Seated Row — 3 x 10–12 — start 200 — rest 90s — inc 10

Shoulder Press (machine) — 3 x 8–12 — start 140 — rest 90s — inc 5–10

Triceps Pushdown — 3 x 12–15 — start 90 — rest 60s — inc 5

DB Curl — 3 x 12–15 — start 35s — rest 60s — inc 5

Day 2 — Lower + Core

Leg Press — 4 x 8–12 — start 950 total — rest 120s — inc 20

RDL (barbell) — 3 x 8–10 — start 185 — rest 120s — inc 10

Seated Ham Curl — 3 x 12–15 — start 90 — rest 75s — inc 10

Calf Raise — 3 x 12–15 — start 135 — rest 60s — inc 10

Cable Crunch — 3 x 12–15 — start 80 — rest 60s — inc 5

Plank — 3 rounds — 20–40s — inc by time

Progression rule baked into the app:

If you hit rep_max on all working sets → increase by increment_lbs next time.

Otherwise → keep same weight until you earn it.

Page map (Next.js App Router)
app/
  layout.tsx
  page.tsx                    // Today (auto Day 1/Day 2)
  workout/
    [sessionId]/page.tsx      // Live workout tracker
  templates/page.tsx          // View/edit Day 1/Day 2
  exercises/page.tsx          // Exercise library + demos
  weight/page.tsx             // Weight log + trend
  diet/page.tsx               // Protein + diet log
  settings/page.tsx           // targets, schedule, export

PWA behavior (the “feels like an app” part)

Add to Home Screen (iOS)

Offline-first logging:

If no internet, sets save locally

Sync when online

Home screen widget-like “Today” page:

Big “Start Day 1” / “Start Day 2”

Shows last workout stats

GIF demos (simple + realistic)

Best options:

Supabase Storage bucket exercise-demos

upload small .mp4 (better than GIF; smaller + smoother)

Or store in public/demos/ if you don’t want uploading

Inside each exercise card:

embedded looping mp4

“Key cues” under it (your cue list)

If you want it hyper-personal, you can even film your own quick demos and upload them.

UI (fast, big buttons, gym-friendly)

no emojis, only stylized icons

Large tap targets

One-hand friendly

“Add Set” / “Complete Exercise” buttons

“Rest timer” quick button (60/90/120)

Auto-scroll to next exercise

Build plan (short and surgical)
Phase 1 (MVP you can use immediately)

Supabase setup + schema

Seed Day 1 / Day 2 templates

Today page (auto schedule)

Live workout logging (sets/reps/weights)

Weight log page

Diet log page (protein + notes)

Simple auth (magic link)

Phase 2

Auto progression suggestions

Exercise swap (machine vs bench variants)

Trends + PR charts

Export to CSV


Google Fonts (modern + strong)

I’d use Space Grotesk for headlines (bold, modern) and Inter for UI/body (ultra readable).

app/layout.tsx
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${space.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}

Color system (charcoal base + lime accents)

Palette intent:

Background: near-black charcoal

Surfaces: slightly lighter charcoal cards

Borders: subtle charcoal outline

Headlines: lime

Buttons: green gradient

app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Force dark theme for this personal app */
:root {
  color-scheme: dark;
}

@layer base {
  :root {
    --bg: 12 12 14;         /* near-black charcoal */
    --surface: 20 20 24;    /* card surface */
    --surface2: 28 28 34;   /* elevated surface */
    --border: 45 45 54;     /* subtle borders */

    --text: 236 236 240;    /* primary text */
    --muted: 160 160 170;   /* secondary text */

    --lime: 190 255 88;     /* lime headline */
    --green: 34 197 94;     /* emerald */
    --green2: 16 185 129;   /* teal-green */

    --danger: 239 68 68;
  }

  body {
    background: rgb(var(--bg));
    color: rgb(var(--text));
    font-family: var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }
}

/* Typography helpers */
.h1, .h2, .h3 {
  font-family: var(--font-space), system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  letter-spacing: -0.02em;
}

Tailwind config (tokens + gradient buttons)
tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "rgb(var(--bg))",
        surface: "rgb(var(--surface))",
        surface2: "rgb(var(--surface2))",
        borderc: "rgb(var(--border))",
        text: "rgb(var(--text))",
        muted: "rgb(var(--muted))",
        lime: "rgb(var(--lime))",
        green: "rgb(var(--green))",
        green2: "rgb(var(--green2))",
        danger: "rgb(var(--danger))",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
} satisfies Config;

Core UI styles (cards, buttons, inputs)

Put these in app/globals.css under @layer components;

@layer components {
  .app-shell {
    @apply min-h-screen bg-bg text-text;
  }

  .card {
    @apply rounded-2xl border border-borderc bg-surface shadow-soft;
  }

  .card-2 {
    @apply rounded-2xl border border-borderc bg-surface2 shadow-soft;
  }

  .headline {
    @apply font-display text-lime;
  }

  .subtle {
    @apply text-muted;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold text-black
      transition active:scale-[0.99];
    background: linear-gradient(135deg, rgb(var(--green)) 0%, rgb(var(--green2)) 55%, rgb(var(--lime)) 100%);
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold
      border border-borderc bg-surface2 text-text transition active:scale-[0.99];
  }

  .input {
    @apply w-full rounded-xl border border-borderc bg-surface2 px-3 py-3 text-text
      placeholder:text-muted focus:outline-none focus:ring-2;
    --tw-ring-color: rgba(190, 255, 88, 0.22);
  }

  .pill {
    @apply inline-flex items-center rounded-full border border-borderc bg-surface2 px-3 py-1 text-sm text-muted;
  }
}

Example “Today” header (lime headline + gradient CTA)
export function TodayHeader() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="pill">2 on / 1 off • Strength + Fat Loss</p>
          <h1 className="headline mt-3 text-2xl">Day 1 — Upper Body</h1>
          <p className="subtle mt-1">
            Heavy, controlled sets. Leave 1–2 reps in reserve.
          </p>
        </div>

        <button className="btn-primary whitespace-nowrap">
          Start Workout
        </button>
      </div>
    </div>
  );
}

Quick UI vibe guidelines (to keep it looking “premium”)

Use lots of padding (cards p-5, sections gap-4)

Keep borders subtle (border-borderc)

Use lime only for:

page titles

key numbers

streak/progress indicators

Use the gradient button for only 1 primary action per screen (Start / Save / Finish)


0) Folder structure
app/
  layout.tsx
  globals.css
  page.tsx                 // Today
  workout/page.tsx         // Workout hub (latest session / start)
  weight/page.tsx
  diet/page.tsx
  settings/page.tsx
components/
  app-shell.tsx
  bottom-nav.tsx
  page-header.tsx
  ui/                      // shadcn components live here
  workout/
    exercise-card.tsx
    set-logger.tsx
    rest-timer-drawer.tsx
lib/
  cn.ts
  format.ts

1) Google Fonts + Root Layout + App Shell
app/layout.tsx
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${space.variable} font-sans`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

2) shadcn/ui theme tokens (dark charcoal + lime accent)

This is the important part: shadcn components read CSS variables like --background, --card, --primary, etc. We’ll map yours into those so every Button, Card, Input, Sheet, etc matches.

app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }

@layer base {
  /* Your palette */
  :root {
    --bg: 12 12 14;
    --surface: 20 20 24;
    --surface2: 28 28 34;
    --border: 45 45 54;

    --text: 236 236 240;
    --muted: 160 160 170;

    --lime: 190 255 88;
    --green: 34 197 94;
    --green2: 16 185 129;

    --danger: 239 68 68;

    /* shadcn tokens */
    --background: var(--bg);
    --foreground: var(--text);

    --card: var(--surface);
    --card-foreground: var(--text);

    --popover: var(--surface2);
    --popover-foreground: var(--text);

    --muted: 24 24 30;
    --muted-foreground: var(--muted);

    --border: var(--border);
    --input: var(--border);

    /* Primary/Accent */
    --primary: var(--lime);                 /* used for focus rings + some components */
    --primary-foreground: 0 0 0;

    --accent: 30 30 38;
    --accent-foreground: var(--text);

    --ring: var(--lime);

    /* Radius */
    --radius: 16px;
  }

  body {
    background: rgb(var(--background));
    color: rgb(var(--foreground));
    font-family: var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }
}

/* Typography helpers */
@layer components {
  .headline { @apply font-display tracking-[-0.02em] text-lime; }
  .subtle { @apply text-[rgb(var(--muted))]; }
}

/* Signature gradient button utility */
@layer utilities {
  .btn-gradient {
    background: linear-gradient(135deg, rgb(var(--green)) 0%, rgb(var(--green2)) 55%, rgb(var(--lime)) 100%);
  }
}

3) Tailwind config (fonts + token colors)
tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "system-ui", "sans-serif"],
      },
      colors: {
        lime: "rgb(var(--lime))",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;


If you use shadcn’s standard setup, it already expects tailwindcss-animate.

4) cn() helper
lib/cn.ts
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

5) App Shell + Bottom Nav (Today / Workout / Weight / Diet / Settings)
components/app-shell.tsx
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]")}>
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Today", icon: "🏠" },
  { href: "/workout", label: "Workout", icon: "🏋️" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/diet", label: "Diet", icon: "🥩" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex w-full flex-col items-center justify-center rounded-xl px-2 py-2 text-xs transition",
                active ? "text-lime" : "text-[rgb(var(--muted))]"
              )}
            >
              <span className={cn("text-lg", active && "drop-shadow")}>{it.icon}</span>
              <span className="mt-1 font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

6) Make shadcn Button match your gradient (globally)

If you use shadcn, your components/ui/button.tsx is where you set the variants.

components/ui/button.tsx (key edits)

Add a gradient variant that uses your .btn-gradient, and keep everything dark-friendly.

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--lime))]/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-[rgb(var(--surface2))] text-[rgb(var(--text))] border border-[rgb(var(--border))]",
        gradient: "btn-gradient text-black shadow-soft",
        outline: "border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--text))]",
        ghost: "bg-transparent text-[rgb(var(--text))] hover:bg-[rgb(var(--surface2))]",
        destructive: "bg-[rgb(var(--danger))] text-white",
      },
      size: {
        default: "h-12 px-4 py-2",
        sm: "h-10 rounded-lg px-3",
        lg: "h-14 rounded-2xl px-6 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };


Now every primary action can use:

<Button variant="gradient" size="lg">Start Workout</Button>

7) Signature Component #1 — ExerciseCard (with demo loop)

This is the “money” component: feels like a real app.

components/workout/exercise-card.tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ExerciseCardProps = {
  name: string;
  demoUrl?: string;              // mp4 preferred (smaller than gif)
  cues?: string[];
  prescription: string;          // "4 x 6–10"
  startWeight: string;           // "Chest Press: 220 lbs"
  notes?: string;
  onAddSet?: () => void;
  onRest?: (seconds: number) => void;
};

export function ExerciseCard({
  name,
  demoUrl,
  cues = [],
  prescription,
  startWeight,
  notes,
  onAddSet,
  onRest,
}: ExerciseCardProps) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="headline text-lg">{name}</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
              {prescription}
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
              Start: <span className="text-[rgb(var(--text))]">{startWeight}</span>
            </span>
          </div>
        </div>

        <Button variant="gradient" size="sm" onClick={onAddSet}>
          + Set
        </Button>
      </div>

      {demoUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-black">
          <video
            src={demoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="h-44 w-full object-cover"
          />
        </div>
      ) : null}

      {cues.length ? (
        <ul className="mt-4 space-y-2 text-sm text-[rgb(var(--muted))]">
          {cues.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[2px] text-lime">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {notes ? (
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">{notes}</p>
      ) : null}

      <div className={cn("mt-4 grid grid-cols-3 gap-2")}>
        <Button variant="outline" onClick={() => onRest?.(60)}>Rest 60</Button>
        <Button variant="outline" onClick={() => onRest?.(90)}>Rest 90</Button>
        <Button variant="outline" onClick={() => onRest?.(120)}>Rest 120</Button>
      </div>
    </section>
  );
}

8) Signature Component #2 — SetLogger rows

A tight, gym-friendly set table: weight, reps, optional RIR.

components/workout/set-logger.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type LoggedSet = {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
};

type SetLoggerProps = {
  defaultWeight: number;
  defaultReps: number;
  onChange?: (sets: LoggedSet[]) => void;
};

export function SetLogger({ defaultWeight, defaultReps, onChange }: SetLoggerProps) {
  const [sets, setSets] = useState<LoggedSet[]>([]);

  function addSet() {
    const next: LoggedSet = {
      setNumber: sets.length + 1,
      weight: defaultWeight,
      reps: defaultReps,
      rir: 2,
    };
    const updated = [...sets, next];
    setSets(updated);
    onChange?.(updated);
  }

  function updateSet(idx: number, patch: Partial<LoggedSet>) {
    const updated = sets.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setSets(updated);
    onChange?.(updated);
  }

  return (
    <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-[rgb(var(--text))]">Logged Sets</p>
        <Button variant="gradient" size="sm" onClick={addSet}>
          Add Set
        </Button>
      </div>

      {sets.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted))]">No sets yet. Tap “Add Set”.</p>
      ) : (
        <div className="space-y-2">
          {sets.map((s, idx) => (
            <div
              key={s.setNumber}
              className={cn("grid grid-cols-12 items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2")}
            >
              <div className="col-span-2 text-xs font-semibold text-lime">#{s.setNumber}</div>

              <div className="col-span-4">
                <label className="text-[10px] text-[rgb(var(--muted))]">Weight</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-2 py-2 text-sm text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--lime))]/30"
                  inputMode="numeric"
                  value={s.weight}
                  onChange={(e) => updateSet(idx, { weight: Number(e.target.value || 0) })}
                />
              </div>

              <div className="col-span-3">
                <label className="text-[10px] text-[rgb(var(--muted))]">Reps</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-2 py-2 text-sm text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--lime))]/30"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={(e) => updateSet(idx, { reps: Number(e.target.value || 0) })}
                />
              </div>

              <div className="col-span-3">
                <label className="text-[10px] text-[rgb(var(--muted))]">RIR</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-2 py-2 text-sm text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--lime))]/30"
                  inputMode="numeric"
                  value={s.rir ?? 2}
                  onChange={(e) => updateSet(idx, { rir: Number(e.target.value || 0) })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

9) Signature Component #3 — RestTimer Drawer (shadcn Sheet)

This uses shadcn Sheet so it slides up like a native app.

components/workout/rest-timer-drawer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function fmt(n: number) {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type RestTimerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSeconds: number;
};

export function RestTimerDrawer({ open, onOpenChange, initialSeconds }: RestTimerDrawerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (open) setSecondsLeft(initialSeconds);
  }, [open, initialSeconds]);

  useEffect(() => {
    if (!open) return;
    if (secondsLeft <= 0) return;

    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [open, secondsLeft]);

  const done = secondsLeft <= 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <SheetHeader>
          <SheetTitle className="font-display text-lime">Rest Timer</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex items-center justify-center">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-8 py-6 text-center shadow-soft">
            <div className="text-5xl font-display tracking-tight text-[rgb(var(--text))]">
              {fmt(Math.max(0, secondsLeft))}
            </div>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              {done ? "Go lift." : "Breathe. Reset. Next set clean."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setSecondsLeft((s) => s + 15)}>+15s</Button>
          <Button variant="outline" onClick={() => setSecondsLeft((s) => Math.max(0, s - 15))}>-15s</Button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setSecondsLeft(60)}>1:00</Button>
          <Button variant="outline" onClick={() => setSecondsLeft(90)}>1:30</Button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setSecondsLeft(120)}>2:00</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {done ? "Close" : "Hide"}
          </Button>
        </div>

        <div className="mt-4">
          <Button variant="gradient" size="lg" className="w-full" onClick={() => setSecondsLeft(0)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

10) Example page wiring (Today + Workout)
app/page.tsx (Today)
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TodayPage() {
  // MVP: hardcode Day 1. Later: compute from last session date and 2-on-1-off pattern.
  const dayLabel = "Day 1 — Upper Body";
  const sub = "Heavy, controlled sets. Leave 1–2 reps in reserve.";

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <p className="text-xs text-[rgb(var(--muted))]">2 on / 1 off • Fat loss + strength</p>
        <h1 className="headline mt-2 text-2xl">{dayLabel}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{sub}</p>

        <div className="mt-4">
          <Button asChild variant="gradient" size="lg" className="w-full">
            <Link href="/workout">Start Workout</Link>
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
        <h2 className="font-display text-lime">Targets</h2>
        <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
          <li>Protein: <span className="text-[rgb(var(--text))]">200–240g</span></li>
          <li>Cardio: <span className="text-[rgb(var(--text))]">10–20 min low impact</span></li>
          <li>Stop sets with <span className="text-[rgb(var(--text))]">1–2 reps left</span></li>
        </ul>
      </section>
    </div>
  );
}

app/workout/page.tsx (Workout screen using signature components)
"use client";

import { useState } from "react";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { SetLogger } from "@/components/workout/set-logger";
import { RestTimerDrawer } from "@/components/workout/rest-timer-drawer";

export default function WorkoutPage() {
  const [restOpen, setRestOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);

  function openRest(sec: number) {
    setRestSeconds(sec);
    setRestOpen(true);
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <h1 className="headline text-2xl">Day 1 — Upper</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Hit the low end of reps with clean form. Add weight only after you earn the top end.
        </p>
      </header>

      <ExerciseCard
        name="Machine Chest Press"
        prescription="4 × 6–10"
        startWeight="220 lb"
        demoUrl="/demos/chest-press.mp4"
        cues={[
          "Shoulder blades pinned back, chest up",
          "Controlled down, smooth press up",
          "Stop 1–2 reps before failure",
        ]}
        notes="If reps fly, slow the tempo before adding weight."
        onAddSet={() => {}}
        onRest={(s) => openRest(s)}
      />

      <SetLogger defaultWeight={220} defaultReps={8} />

      <RestTimerDrawer
        open={restOpen}
        onOpenChange={setRestOpen}
        initialSeconds={restSeconds}
      />
    </div>
  );
}

11) shadcn components you’ll need

Install shadcn and add:

button

sheet

card

input

tabs (later)

dialog (later)

Your theme tokens above will make them match automatically.


1) Supabase SQL schema + seed (copy/paste into Supabase SQL editor)

This creates tables + RLS. Exercises/templates are readable for any signed-in user. Logs are private to your auth.uid().

-- Enable extensions you may want
create extension if not exists "pgcrypto";

-- =========================
-- Core reference tables
-- =========================

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('upper','lower','core','cardio')),
  equipment text not null, -- machine, barbell, dumbbell, cable, bodyweight, other
  demo_url text,           -- e.g. /demos/chest-press.mp4
  form_cues text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cycle_order int not null check (cycle_order in (1,2)), -- 1 = Day 1 Upper, 2 = Day 2 Lower
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order int not null,
  sets int not null,
  rep_min int not null,
  rep_max int not null,
  rest_seconds int not null,
  start_weight_lbs int,       -- suggested start; null for timed holds
  increment_lbs int,          -- recommended progression step
  notes text,
  created_at timestamptz not null default now(),
  unique(template_id, sort_order)
);

-- =========================
-- Logging tables (private)
-- =========================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  bodyweight_lbs int,
  notes text
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number int not null,
  weight_lbs int not null default 0,
  reps int not null default 0,
  rir int,
  is_warmup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, exercise_id, set_number)
);

create table if not exists public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null,
  weight_lbs int not null,
  waist_in numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, logged_at)
);

create table if not exists public.diet_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null,
  protein_g int not null default 0,
  calories int,
  steps int,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, logged_at)
);

-- auto-update updated_at on workout_sets
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_workout_sets_updated_at on public.workout_sets;
create trigger trg_workout_sets_updated_at
before update on public.workout_sets
for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_items enable row level security;

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.bodyweight_logs enable row level security;
alter table public.diet_logs enable row level security;

-- Reference tables: readable by authenticated users
drop policy if exists "read exercises" on public.exercises;
create policy "read exercises"
on public.exercises for select
to authenticated
using (true);

drop policy if exists "read templates" on public.workout_templates;
create policy "read templates"
on public.workout_templates for select
to authenticated
using (true);

drop policy if exists "read template items" on public.workout_template_items;
create policy "read template items"
on public.workout_template_items for select
to authenticated
using (true);

-- (Optional) allow only yourself to edit ref data by using service role in admin tasks; for now keep inserts disabled via RLS.

-- Logs: user-owned
drop policy if exists "sessions own rows" on public.workout_sessions;
create policy "sessions own rows"
on public.workout_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "sets own rows" on public.workout_sets;
create policy "sets own rows"
on public.workout_sets
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bodyweight own rows" on public.bodyweight_logs;
create policy "bodyweight own rows"
on public.bodyweight_logs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diet own rows" on public.diet_logs;
create policy "diet own rows"
on public.diet_logs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================
-- Seed data: YOUR exact plan
-- =========================

-- Exercises
insert into public.exercises (name, category, equipment, demo_url, form_cues)
values
  ('Machine Chest Press','upper','machine','/demos/chest-press.mp4',
   'Shoulder blades back; controlled down; press smooth; stop 1–2 reps before failure.'),
  ('Lat Pulldown (Neutral/Wide)','upper','machine','/demos/lat-pulldown.mp4',
   'Chest up; pull elbows to ribs; no swinging; full stretch at top.'),
  ('Seated Row Machine','upper','machine','/demos/seated-row.mp4',
   'Drive elbows back; squeeze mid-back; don’t jerk; keep torso stable.'),
  ('Shoulder Press (Machine)','upper','machine','/demos/shoulder-press.mp4',
   'Elbows slightly forward; press up without shrugging; controlled tempo.'),
  ('Triceps Pushdown (Cable)','upper','cable','/demos/triceps-pushdown.mp4',
   'Elbows pinned; full extension; no shoulder swing; slow return.'),
  ('Dumbbell Curls','upper','dumbbell','/demos/dumbbell-curl.mp4',
   'Elbows close; curl without swinging; slow down; full stretch.'),
  ('Leg Press','lower','machine','/demos/leg-press.mp4',
   'Feet slightly high; knees track toes; controlled depth; don’t bottom out hard.'),
  ('Romanian Deadlift (Barbell)','lower','barbell','/demos/rdl.mp4',
   'Hinge hips back; soft knees; feel hamstrings; flat back; stop before losing position.'),
  ('Seated Hamstring Curl','lower','machine','/demos/ham-curl.mp4',
   'Slow negative; full squeeze; don’t lift hips off pad.'),
  ('Calf Raise (Seated/Standing)','lower','machine','/demos/calf-raise.mp4',
   'Big stretch; pause at top; controlled reps.'),
  ('Cable Crunch','core','cable','/demos/cable-crunch.mp4',
   'Ribs down; crunch spine; don’t hinge at hips; controlled.'),
  ('Plank (Elevated OK)','core','bodyweight','/demos/plank.mp4',
   'Brace abs; squeeze glutes; breathe; keep straight line.');

-- Templates
insert into public.workout_templates (name, cycle_order)
values
  ('Day 1 — Upper', 1),
  ('Day 2 — Lower + Core', 2);

-- Template items (join by name)
with
t1 as (select id from public.workout_templates where name = 'Day 1 — Upper' limit 1),
t2 as (select id from public.workout_templates where name = 'Day 2 — Lower + Core' limit 1),
e as (select id, name from public.exercises)
insert into public.workout_template_items
(template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
select (select id from t1), (select id from e where name='Machine Chest Press'), 1, 4, 6, 10, 120, 220, 10,
  'If reps fly, slow tempo before adding weight.'
union all
select (select id from t1), (select id from e where name like 'Lat Pulldown%'), 2, 4, 8, 12, 90, 270, 10,
  'Chest up; no swinging. Add weight after you hit 12 on all sets.'
union all
select (select id from t1), (select id from e where name='Seated Row Machine'), 3, 3, 10, 12, 90, 200, 10,
  'Squeeze mid-back; clean reps.'
union all
select (select id from t1), (select id from e where name='Shoulder Press (Machine)'), 4, 3, 8, 12, 90, 140, 5,
  'Shoulders: control > ego. Keep joints happy.'
union all
select (select id from t1), (select id from e where name='Triceps Pushdown (Cable)'), 5, 3, 12, 15, 60, 90, 5,
  'Elbows pinned; full extension.'
union all
select (select id from t1), (select id from e where name='Dumbbell Curls'), 6, 3, 12, 15, 60, 35, 5,
  'No swinging. Slow negative.'
union all
select (select id from t2), (select id from e where name='Leg Press'), 1, 4, 8, 12, 120, 950, 20,
  'Feet slightly high; knee-friendly depth; control the bottom.'
union all
select (select id from t2), (select id from e where name='Romanian Deadlift (Barbell)'), 2, 3, 8, 10, 120, 185, 10,
  'Hamstring stretch; flat back; hinge from hips.'
union all
select (select id from t2), (select id from e where name='Seated Hamstring Curl'), 3, 3, 12, 15, 75, 90, 10,
  'Slow negative (3s).'
union all
select (select id from t2), (select id from e where name like 'Calf Raise%'), 4, 3, 12, 15, 60, 135, 10,
  'Pause at top; big stretch.'
union all
select (select id from t2), (select id from e where name='Cable Crunch'), 5, 3, 12, 15, 60, 80, 5,
  'Crunch spine; not a hip hinge.'
union all
select (select id from t2), (select id from e where name like 'Plank%'), 6, 3, 20, 40, 60, null, null,
  'Elevate hands if needed; add time gradually.';

2) Supabase client setup (Next.js App Router)
Install
npm i @supabase/supabase-js

.env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


If you’re using Supabase Auth (recommended), add your magic-link UI later. For now, these pages assume you’re signed in so auth.uid() exists.

3) FULL Workout page (loops Day 1/Day 2, starts session, saves sets)

This is a single page that:

Loads both templates + items + exercise details

Lets you choose Day 1 or Day 2 (and auto-suggests next)

Starts a session in workout_sessions

Renders each exercise card + set logger

Saves each set to workout_sets with upsert

app/workout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { SetLogger, LoggedSet } from "@/components/workout/set-logger";
import { RestTimerDrawer } from "@/components/workout/rest-timer-drawer";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  demo_url: string | null;
  form_cues: string | null;
};

type Template = { id: string; name: string; cycle_order: number };

type TemplateItem = {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  sets: number;
  rep_min: number;
  rep_max: number;
  rest_seconds: number;
  start_weight_lbs: number | null;
  increment_lbs: number | null;
  notes: string | null;
  exercise: Exercise;
};

function parseCues(cues?: string | null) {
  if (!cues) return [];
  // If you keep cues as a single sentence, we’ll split by semicolon. Feel free to edit.
  return cues.split(";").map(s => s.trim()).filter(Boolean);
}

export default function WorkoutPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [itemsByTemplate, setItemsByTemplate] = useState<Record<string, TemplateItem[]>>({});
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [restOpen, setRestOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);

  const [setsDraft, setSetsDraft] = useState<Record<string, LoggedSet[]>>({}); // key: exercise_id

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      setUserId(uid);

      // Fetch templates
      const { data: tmpl, error: tmplErr } = await supabase
        .from("workout_templates")
        .select("id,name,cycle_order")
        .order("cycle_order", { ascending: true });

      if (tmplErr) {
        console.error(tmplErr);
        setLoading(false);
        return;
      }

      setTemplates(tmpl ?? []);

      // Fetch template items + exercise join
      const { data: items, error: itemsErr } = await supabase
        .from("workout_template_items")
        .select(`
          id, template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds,
          start_weight_lbs, increment_lbs, notes,
          exercise:exercises (id,name,category,equipment,demo_url,form_cues)
        `)
        .order("template_id", { ascending: true })
        .order("sort_order", { ascending: true });

      if (itemsErr) {
        console.error(itemsErr);
        setLoading(false);
        return;
      }

      const grouped: Record<string, TemplateItem[]> = {};
      (items ?? []).forEach((it: any) => {
        const tid = it.template_id as string;
        grouped[tid] = grouped[tid] || [];
        grouped[tid].push(it as TemplateItem);
      });

      setItemsByTemplate(grouped);

      // Suggest next template based on last completed session
      const { data: lastSession } = await supabase
        .from("workout_sessions")
        .select("template_id, ended_at, started_at")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSession?.template_id) {
        // flip Day 1 <-> Day 2 (simple “next workout” logic)
        const lastTid = lastSession.template_id as string;
        const next = (tmpl ?? []).find(t => t.id !== lastTid) ?? (tmpl ?? [])[0];
        setActiveTemplateId(next?.id ?? (tmpl ?? [])[0]?.id ?? null);
      } else {
        setActiveTemplateId((tmpl ?? [])[0]?.id ?? null);
      }

      setLoading(false);
    })();
  }, []);

  const activeTemplate = useMemo(
    () => templates.find(t => t.id === activeTemplateId) ?? null,
    [templates, activeTemplateId]
  );

  const activeItems = useMemo(() => {
    if (!activeTemplateId) return [];
    return itemsByTemplate[activeTemplateId] ?? [];
  }, [activeTemplateId, itemsByTemplate]);

  async function startSession() {
    if (!userId) {
      alert("You need to be signed in (magic link) to log sessions.");
      return;
    }
    if (!activeTemplateId) return;

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        template_id: activeTemplateId,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert("Could not start session.");
      return;
    }

    setSessionId(data.id);
  }

  async function finishSession() {
    if (!sessionId) return;

    const { error } = await supabase
      .from("workout_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      console.error(error);
      alert("Could not finish session.");
      return;
    }

    setSessionId(null);
    setSetsDraft({});
    alert("Session saved. Nice work.");
  }

  function openRest(sec: number) {
    setRestSeconds(sec);
    setRestOpen(true);
  }

  async function saveSetsForExercise(exerciseId: string, sets: LoggedSet[]) {
    if (!sessionId || !userId) return;

    // Upsert each set row: unique(session_id, exercise_id, set_number)
    const payload = sets.map(s => ({
      user_id: userId,
      session_id: sessionId,
      exercise_id: exerciseId,
      set_number: s.setNumber,
      weight_lbs: s.weight,
      reps: s.reps,
      rir: s.rir ?? null,
      is_warmup: false,
    }));

    const { error } = await supabase
      .from("workout_sets")
      .upsert(payload, { onConflict: "session_id,exercise_id,set_number" });

    if (error) console.error(error);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
        <p className="text-sm text-[rgb(var(--muted))]">Loading your plan…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <p className="text-xs text-[rgb(var(--muted))]">2 on / 1 off • Heavy lifting fat-loss plan</p>
        <h1 className="headline mt-2 text-2xl">{activeTemplate?.name ?? "Workout"}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Start weight suggestions are baked in. Earn increases by hitting the top reps clean.
        </p>

        {/* Template Switch */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {templates.map(t => (
            <Button
              key={t.id}
              variant={t.id === activeTemplateId ? "gradient" : "outline"}
              onClick={() => setActiveTemplateId(t.id)}
              disabled={!!sessionId} // lock template while session is running
            >
              {t.cycle_order === 1 ? "Day 1" : "Day 2"}
            </Button>
          ))}
        </div>

        {/* Session controls */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {!sessionId ? (
            <Button variant="gradient" size="lg" className="w-full" onClick={startSession}>
              Start Session
            </Button>
          ) : (
            <Button variant="gradient" size="lg" className="w-full" onClick={finishSession}>
              Finish Session
            </Button>
          )}

          <Button variant="outline" size="lg" className="w-full" onClick={() => openRest(90)}>
            Rest Timer
          </Button>
        </div>

        {sessionId ? (
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Session active: <span className="text-lime">{sessionId.slice(0, 8)}…</span>
          </p>
        ) : (
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Tip: Start a session before logging sets so everything saves.
          </p>
        )}
      </header>

      {/* Exercises */}
      {activeItems.map((it) => {
        const defaultReps = Math.round((it.rep_min + it.rep_max) / 2);
        const startW = it.start_weight_lbs ?? 0;

        return (
          <div key={it.id} className="space-y-2">
            <ExerciseCard
              name={it.exercise.name}
              prescription={`${it.sets} × ${it.rep_min}–${it.rep_max}`}
              startWeight={it.start_weight_lbs ? `${it.start_weight_lbs} lb` : "Timed"}
              demoUrl={it.exercise.demo_url ?? undefined}
              cues={parseCues(it.exercise.form_cues)}
              notes={it.notes ?? undefined}
              onAddSet={() => {}}
              onRest={(s) => openRest(s)}
            />

            <SetLogger
              defaultWeight={startW}
              defaultReps={defaultReps}
              onChange={async (sets) => {
                setSetsDraft(prev => ({ ...prev, [it.exercise_id]: sets }));
                // Save live whenever it changes
                await saveSetsForExercise(it.exercise_id, sets);
              }}
            />
          </div>
        );
      })}

      <RestTimerDrawer
        open={restOpen}
        onOpenChange={setRestOpen}
        initialSeconds={restSeconds}
      />
    </div>
  );
}


✅ This is “real app” behavior already:

A plan driven by Supabase tables

Sessions + sets saved to DB

MP4 demos played from /public/demos/*

4) Weight page (simple logging + chart-ready output)
app/weight/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type WeightLog = {
  id: string;
  logged_at: string; // date
  weight_lbs: number;
  waist_in: number | null;
  notes: string | null;
};

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WeightPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loggedAt, setLoggedAt] = useState(todayISODate());
  const [weight, setWeight] = useState<number>(470);
  const [waist, setWaist] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const { data } = await supabase
        .from("bodyweight_logs")
        .select("id,logged_at,weight_lbs,waist_in,notes")
        .order("logged_at", { ascending: false })
        .limit(90);

      setLogs((data ?? []) as WeightLog[]);
    })();
  }, []);

  const chartReady = useMemo(() => {
    // For charts: [{x: '2025-12-29', y: 470}, ...] ascending
    return [...logs]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .map(l => ({ x: l.logged_at, y: l.weight_lbs }));
  }, [logs]);

  async function save() {
    if (!userId) {
      alert("Sign in (magic link) first.");
      return;
    }

    const payload = {
      user_id: userId,
      logged_at: loggedAt,
      weight_lbs: weight,
      waist_in: waist ? Number(waist) : null,
      notes: notes || null,
    };

    const { error } = await supabase
      .from("bodyweight_logs")
      .upsert(payload, { onConflict: "user_id,logged_at" });

    if (error) {
      console.error(error);
      alert("Could not save.");
      return;
    }

    const { data } = await supabase
      .from("bodyweight_logs")
      .select("id,logged_at,weight_lbs,waist_in,notes")
      .order("logged_at", { ascending: false })
      .limit(90);

    setLogs((data ?? []) as WeightLog[]);
    setNotes("");
    alert("Saved.");
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <h1 className="headline text-2xl">Weight Tracker</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Log daily or weekly — trend matters more than day-to-day noise.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Date</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Weight (lbs)</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value || 0))}
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Waist (in) (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              inputMode="decimal"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Notes</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sleep, soreness, water retention, etc."
            />
          </div>
        </div>

        <div className="mt-3">
          <Button variant="gradient" size="lg" className="w-full" onClick={save}>
            Save Log
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <h2 className="font-display text-lime">Recent</h2>

        <div className="mt-3 space-y-2">
          {logs.slice(0, 14).map((l) => (
            <div key={l.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.logged_at}</p>
                <p className="text-sm text-lime">{l.weight_lbs} lb</p>
              </div>
              {l.waist_in != null ? (
                <p className="text-xs text-[rgb(var(--muted))]">Waist: {l.waist_in}"</p>
              ) : null}
              {l.notes ? (
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{l.notes}</p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Chart-ready data lives here if you wire a chart library later */}
        <pre className="mt-4 overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3 text-xs text-[rgb(var(--muted))]">
{JSON.stringify(chartReady, null, 2)}
        </pre>
      </section>
    </div>
  );
}

5) Diet page (protein-first + optional calories/steps)
app/diet/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type DietLog = {
  id: string;
  logged_at: string;
  protein_g: number;
  calories: number | null;
  steps: number | null;
  notes: string | null;
};

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DietPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DietLog[]>([]);
  const [loggedAt, setLoggedAt] = useState(todayISODate());

  const [protein, setProtein] = useState<number>(200);
  const [calories, setCalories] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const { data } = await supabase
        .from("diet_logs")
        .select("id,logged_at,protein_g,calories,steps,notes")
        .order("logged_at", { ascending: false })
        .limit(60);

      setLogs((data ?? []) as DietLog[]);
    })();
  }, []);

  const chartReadyProtein = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .map(l => ({ x: l.logged_at, y: l.protein_g }));
  }, [logs]);

  async function save() {
    if (!userId) {
      alert("Sign in (magic link) first.");
      return;
    }

    const payload = {
      user_id: userId,
      logged_at: loggedAt,
      protein_g: protein,
      calories: calories ? Number(calories) : null,
      steps: steps ? Number(steps) : null,
      notes: notes || null,
    };

    const { error } = await supabase
      .from("diet_logs")
      .upsert(payload, { onConflict: "user_id,logged_at" });

    if (error) {
      console.error(error);
      alert("Could not save.");
      return;
    }

    const { data } = await supabase
      .from("diet_logs")
      .select("id,logged_at,protein_g,calories,steps,notes")
      .order("logged_at", { ascending: false })
      .limit(60);

    setLogs((data ?? []) as DietLog[]);
    setNotes("");
    alert("Saved.");
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <h1 className="headline text-2xl">Diet Log</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Keep it simple: hit <span className="text-lime">200–240g protein</span>. Calories optional.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Date</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Protein (g)</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value || 0))}
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Calories (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 3200"
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Steps (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              inputMode="numeric"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="e.g. 6000"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Notes</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meals, cravings, hydration, etc."
            />
          </div>
        </div>

        <div className="mt-3">
          <Button variant="gradient" size="lg" className="w-full" onClick={save}>
            Save Diet Log
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <h2 className="font-display text-lime">Recent</h2>

        <div className="mt-3 space-y-2">
          {logs.slice(0, 14).map((l) => (
            <div key={l.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.logged_at}</p>
                <p className="text-sm text-lime">{l.protein_g}g</p>
              </div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                {l.calories != null ? `Calories: ${l.calories}` : "Calories: —"}
                {" • "}
                {l.steps != null ? `Steps: ${l.steps}` : "Steps: —"}
              </div>
              {l.notes ? (
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{l.notes}</p>
              ) : null}
            </div>
          ))}
        </div>

        <pre className="mt-4 overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3 text-xs text-[rgb(var(--muted))]">
{JSON.stringify(chartReadyProtein, null, 2)}
        </pre>
      </section>
    </div>
  );
}

6) Add your MP4 demos

Put files here:

public/demos/chest-press.mp4
public/demos/lat-pulldown.mp4
public/demos/seated-row.mp4
public/demos/shoulder-press.mp4
public/demos/triceps-pushdown.mp4
public/demos/dumbbell-curl.mp4
public/demos/leg-press.mp4
public/demos/rdl.mp4
public/demos/ham-curl.mp4
public/demos/calf-raise.mp4
public/demos/cable-crunch.mp4
public/demos/plank.mp4


If you don’t have these yet, you can temporarily use placeholders and swap later.






1) Supabase SQL schema + seed script (your exact Day 1/Day 2 plan)

Paste this whole thing into Supabase → SQL Editor → Run.

create extension if not exists "pgcrypto";

-- =========================
-- Reference tables
-- =========================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('upper','lower','core','cardio')),
  equipment text not null,
  demo_url text,           -- /demos/*.mp4
  form_cues text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cycle_order int not null check (cycle_order in (1,2)),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order int not null,
  sets int not null,
  rep_min int not null,
  rep_max int not null,
  rest_seconds int not null,
  start_weight_lbs int,       -- null for timed holds
  increment_lbs int,
  notes text,
  created_at timestamptz not null default now(),
  unique(template_id, sort_order)
);

-- =========================
-- Logging tables (private)
-- =========================
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  bodyweight_lbs int,
  notes text
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number int not null,
  weight_lbs int not null default 0,
  reps int not null default 0,
  rir int,
  is_warmup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, exercise_id, set_number)
);

create table if not exists public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null,
  weight_lbs int not null,
  waist_in numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, logged_at)
);

create table if not exists public.diet_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null,
  protein_g int not null default 0,
  calories int,
  steps int,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, logged_at)
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_workout_sets_updated_at on public.workout_sets;
create trigger trg_workout_sets_updated_at
before update on public.workout_sets
for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_items enable row level security;

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.bodyweight_logs enable row level security;
alter table public.diet_logs enable row level security;

-- Reference tables readable by authenticated users
drop policy if exists "read exercises" on public.exercises;
create policy "read exercises"
on public.exercises for select
to authenticated
using (true);

drop policy if exists "read templates" on public.workout_templates;
create policy "read templates"
on public.workout_templates for select
to authenticated
using (true);

drop policy if exists "read template items" on public.workout_template_items;
create policy "read template items"
on public.workout_template_items for select
to authenticated
using (true);

-- User-owned logs
drop policy if exists "sessions own rows" on public.workout_sessions;
create policy "sessions own rows"
on public.workout_sessions
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "sets own rows" on public.workout_sets;
create policy "sets own rows"
on public.workout_sets
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bodyweight own rows" on public.bodyweight_logs;
create policy "bodyweight own rows"
on public.bodyweight_logs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diet own rows" on public.diet_logs;
create policy "diet own rows"
on public.diet_logs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================
-- Seed data (YOUR plan)
-- =========================
insert into public.exercises (name, category, equipment, demo_url, form_cues)
values
  ('Machine Chest Press','upper','machine','/demos/chest-press.mp4',
   'Shoulder blades back; controlled down; press smooth; stop 1–2 reps before failure.'),
  ('Lat Pulldown (Neutral/Wide)','upper','machine','/demos/lat-pulldown.mp4',
   'Chest up; pull elbows to ribs; no swinging; full stretch at top.'),
  ('Seated Row Machine','upper','machine','/demos/seated-row.mp4',
   'Drive elbows back; squeeze mid-back; torso stable; controlled reps.'),
  ('Shoulder Press (Machine)','upper','machine','/demos/shoulder-press.mp4',
   'Elbows slightly forward; press without shrugging; control the negative.'),
  ('Triceps Pushdown (Cable)','upper','cable','/demos/triceps-pushdown.mp4',
   'Elbows pinned; full extension; no shoulder swing; slow return.'),
  ('Dumbbell Curls','upper','dumbbell','/demos/dumbbell-curl.mp4',
   'Elbows close; curl without swinging; slow negative; full stretch.'),
  ('Leg Press','lower','machine','/demos/leg-press.mp4',
   'Feet slightly high; knees track toes; controlled depth; don’t slam bottom.'),
  ('Romanian Deadlift (Barbell)','lower','barbell','/demos/rdl.mp4',
   'Hinge hips back; soft knees; hamstring stretch; flat back; stop before form breaks.'),
  ('Seated Hamstring Curl','lower','machine','/demos/ham-curl.mp4',
   'Slow negative (3s); squeeze hard; don’t lift hips.'),
  ('Calf Raise (Seated/Standing)','lower','machine','/demos/calf-raise.mp4',
   'Big stretch; pause at top; controlled reps.'),
  ('Cable Crunch','core','cable','/demos/cable-crunch.mp4',
   'Ribs down; crunch spine; don’t hinge at hips; controlled reps.'),
  ('Plank (Elevated OK)','core','bodyweight','/demos/plank.mp4',
   'Brace abs; squeeze glutes; breathe; straight line head-to-heel.');

insert into public.workout_templates (name, cycle_order)
values
  ('Day 1 — Upper', 1),
  ('Day 2 — Lower + Core', 2);

with
t1 as (select id from public.workout_templates where name = 'Day 1 — Upper' limit 1),
t2 as (select id from public.workout_templates where name = 'Day 2 — Lower + Core' limit 1),
e as (select id, name from public.exercises)
insert into public.workout_template_items
(template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
select (select id from t1), (select id from e where name='Machine Chest Press'), 1, 4, 6, 10, 120, 220, 10,
  'If reps fly, slow tempo before adding weight.'
union all
select (select id from t1), (select id from e where name like 'Lat Pulldown%'), 2, 4, 8, 12, 90, 270, 10,
  'Chest up; no swinging. Add weight after you hit 12 on all sets.'
union all
select (select id from t1), (select id from e where name='Seated Row Machine'), 3, 3, 10, 12, 90, 200, 10,
  'Squeeze mid-back; clean reps.'
union all
select (select id from t1), (select id from e where name='Shoulder Press (Machine)'), 4, 3, 8, 12, 90, 140, 5,
  'Shoulders: control > ego.'
union all
select (select id from t1), (select id from e where name='Triceps Pushdown (Cable)'), 5, 3, 12, 15, 60, 90, 5,
  'Elbows pinned; full extension.'
union all
select (select id from t1), (select id from e where name='Dumbbell Curls'), 6, 3, 12, 15, 60, 35, 5,
  'No swinging. Slow negative.'
union all
select (select id from t2), (select id from e where name='Leg Press'), 1, 4, 8, 12, 120, 950, 20,
  'Feet slightly high; knee-friendly depth; control the bottom.'
union all
select (select id from t2), (select id from e where name='Romanian Deadlift (Barbell)'), 2, 3, 8, 10, 120, 185, 10,
  'Hamstring stretch; flat back; hinge from hips.'
union all
select (select id from t2), (select id from e where name='Seated Hamstring Curl'), 3, 3, 12, 15, 75, 90, 10,
  'Slow negative (3s).'
union all
select (select id from t2), (select id from e where name like 'Calf Raise%'), 4, 3, 12, 15, 60, 135, 10,
  'Pause at top; big stretch.'
union all
select (select id from t2), (select id from e where name='Cable Crunch'), 5, 3, 12, 15, 60, 80, 5,
  'Crunch spine; not a hip hinge.'
union all
select (select id from t2), (select id from e where name like 'Plank%'), 6, 3, 20, 40, 60, null, null,
  'Elevate hands if needed; build time gradually.';

2) Full Workout page (loops Day 1/Day 2 and saves sets)

Assumes you already have these components from earlier:

ExerciseCard

SetLogger

RestTimerDrawer

Button

supabaseClient

app/workout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { SetLogger, LoggedSet } from "@/components/workout/set-logger";
import { RestTimerDrawer } from "@/components/workout/rest-timer-drawer";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  demo_url: string | null;
  form_cues: string | null;
};

type Template = { id: string; name: string; cycle_order: number };

type TemplateItem = {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  sets: number;
  rep_min: number;
  rep_max: number;
  rest_seconds: number;
  start_weight_lbs: number | null;
  increment_lbs: number | null;
  notes: string | null;
  exercise: Exercise;
};

function parseCues(cues?: string | null) {
  if (!cues) return [];
  return cues.split(";").map(s => s.trim()).filter(Boolean);
}

export default function WorkoutPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [itemsByTemplate, setItemsByTemplate] = useState<Record<string, TemplateItem[]>>({});
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [restOpen, setRestOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      setUserId(uid);

      const { data: tmpl, error: tmplErr } = await supabase
        .from("workout_templates")
        .select("id,name,cycle_order")
        .order("cycle_order", { ascending: true });

      if (tmplErr) {
        console.error(tmplErr);
        setLoading(false);
        return;
      }

      setTemplates(tmpl ?? []);

      const { data: items, error: itemsErr } = await supabase
        .from("workout_template_items")
        .select(`
          id, template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds,
          start_weight_lbs, increment_lbs, notes,
          exercise:exercises (id,name,category,equipment,demo_url,form_cues)
        `)
        .order("template_id", { ascending: true })
        .order("sort_order", { ascending: true });

      if (itemsErr) {
        console.error(itemsErr);
        setLoading(false);
        return;
      }

      const grouped: Record<string, TemplateItem[]> = {};
      (items ?? []).forEach((it: any) => {
        grouped[it.template_id] = grouped[it.template_id] || [];
        grouped[it.template_id].push(it as TemplateItem);
      });
      setItemsByTemplate(grouped);

      // Suggest next: opposite of last
      const { data: lastSession } = await supabase
        .from("workout_sessions")
        .select("template_id, started_at")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSession?.template_id) {
        const lastTid = lastSession.template_id as string;
        const next = (tmpl ?? []).find(t => t.id !== lastTid) ?? (tmpl ?? [])[0];
        setActiveTemplateId(next?.id ?? (tmpl ?? [])[0]?.id ?? null);
      } else {
        setActiveTemplateId((tmpl ?? [])[0]?.id ?? null);
      }

      setLoading(false);
    })();
  }, []);

  const activeTemplate = useMemo(
    () => templates.find(t => t.id === activeTemplateId) ?? null,
    [templates, activeTemplateId]
  );

  const activeItems = useMemo(() => {
    if (!activeTemplateId) return [];
    return itemsByTemplate[activeTemplateId] ?? [];
  }, [activeTemplateId, itemsByTemplate]);

  async function startSession() {
    if (!userId) return alert("Sign in (magic link) so your logs save.");
    if (!activeTemplateId) return;

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        template_id: activeTemplateId,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      return alert("Could not start session.");
    }
    setSessionId(data.id);
  }

  async function finishSession() {
    if (!sessionId) return;

    const { error } = await supabase
      .from("workout_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      console.error(error);
      return alert("Could not finish session.");
    }

    setSessionId(null);
    alert("Saved. Nice work.");
  }

  function openRest(sec: number) {
    setRestSeconds(sec);
    setRestOpen(true);
  }

  async function saveSets(exerciseId: string, sets: LoggedSet[]) {
    if (!sessionId || !userId) return;

    const payload = sets.map(s => ({
      user_id: userId,
      session_id: sessionId,
      exercise_id: exerciseId,
      set_number: s.setNumber,
      weight_lbs: s.weight,
      reps: s.reps,
      rir: s.rir ?? null,
      is_warmup: false,
    }));

    const { error } = await supabase
      .from("workout_sets")
      .upsert(payload, { onConflict: "session_id,exercise_id,set_number" });

    if (error) console.error(error);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
        <p className="text-sm text-[rgb(var(--muted))]">Loading plan…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <p className="text-xs text-[rgb(var(--muted))]">2 on / 1 off • Strength + fat loss</p>
        <h1 className="headline mt-2 text-2xl">{activeTemplate?.name ?? "Workout"}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Earn increases by hitting top reps clean across working sets.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {templates.map(t => (
            <Button
              key={t.id}
              variant={t.id === activeTemplateId ? "gradient" : "outline"}
              onClick={() => setActiveTemplateId(t.id)}
              disabled={!!sessionId}
            >
              {t.cycle_order === 1 ? "Day 1" : "Day 2"}
            </Button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {!sessionId ? (
            <Button variant="gradient" size="lg" className="w-full" onClick={startSession}>
              Start Session
            </Button>
          ) : (
            <Button variant="gradient" size="lg" className="w-full" onClick={finishSession}>
              Finish Session
            </Button>
          )}
          <Button variant="outline" size="lg" className="w-full" onClick={() => openRest(90)}>
            Rest Timer
          </Button>
        </div>

        {!sessionId ? (
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Start a session before logging so sets save to Supabase.
          </p>
        ) : (
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Session active: <span className="text-lime">{sessionId.slice(0, 8)}…</span>
          </p>
        )}
      </header>

      {activeItems.map((it) => {
        const defaultReps = Math.round((it.rep_min + it.rep_max) / 2);
        const startW = it.start_weight_lbs ?? 0;

        return (
          <div key={it.id} className="space-y-2">
            <ExerciseCard
              name={it.exercise.name}
              prescription={`${it.sets} × ${it.rep_min}–${it.rep_max}`}
              startWeight={it.start_weight_lbs ? `${it.start_weight_lbs} lb` : "Timed"}
              demoUrl={it.exercise.demo_url ?? undefined}
              cues={parseCues(it.exercise.form_cues)}
              notes={it.notes ?? undefined}
              onRest={(s) => openRest(s)}
            />

            <SetLogger
              defaultWeight={startW}
              defaultReps={defaultReps}
              onChange={(sets) => saveSets(it.exercise_id, sets)}
            />
          </div>
        );
      })}

      <RestTimerDrawer open={restOpen} onOpenChange={setRestOpen} initialSeconds={restSeconds} />
    </div>
  );
}

3) Weight & Diet pages (simple logging + chart-ready output)
app/weight/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type WeightLog = {
  id: string;
  logged_at: string;
  weight_lbs: number;
  waist_in: number | null;
  notes: string | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function WeightPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loggedAt, setLoggedAt] = useState(todayISO());
  const [weight, setWeight] = useState<number>(470);
  const [waist, setWaist] = useState<string>("");
  const [notes, setNotes] = useState("");

  async function refresh() {
    const { data } = await supabase
      .from("bodyweight_logs")
      .select("id,logged_at,weight_lbs,waist_in,notes")
      .order("logged_at", { ascending: false })
      .limit(180);
    setLogs((data ?? []) as WeightLog[]);
  }

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth?.user?.id ?? null);
      if (auth?.user?.id) await refresh();
    })();
  }, []);

  const chartReady = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .map(l => ({ x: l.logged_at, y: l.weight_lbs }));
  }, [logs]);

  async function save() {
    if (!userId) return alert("Sign in (magic link) first.");

    const { error } = await supabase
      .from("bodyweight_logs")
      .upsert(
        {
          user_id: userId,
          logged_at: loggedAt,
          weight_lbs: weight,
          waist_in: waist ? Number(waist) : null,
          notes: notes || null,
        },
        { onConflict: "user_id,logged_at" }
      );

    if (error) {
      console.error(error);
      return alert("Could not save.");
    }

    setNotes("");
    await refresh();
    alert("Saved.");
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <h1 className="headline text-2xl">Weight Tracker</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Trend & waist matter more than daily noise.</p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Date</label>
            <input
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Weight (lbs)</label>
            <input
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Waist (in) optional</label>
            <input
              inputMode="decimal"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              placeholder="Sleep, soreness, water, etc."
            />
          </div>
        </div>

        <div className="mt-3">
          <Button variant="gradient" size="lg" className="w-full" onClick={save}>
            Save Log
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <h2 className="font-display text-lime">Recent</h2>
        <div className="mt-3 space-y-2">
          {logs.slice(0, 14).map((l) => (
            <div key={l.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.logged_at}</p>
                <p className="text-sm text-lime">{l.weight_lbs} lb</p>
              </div>
              {l.waist_in != null ? <p className="text-xs text-[rgb(var(--muted))]">Waist: {l.waist_in}"</p> : null}
              {l.notes ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{l.notes}</p> : null}
            </div>
          ))}
        </div>

        {/* chart-ready */}
        <pre className="mt-4 overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3 text-xs text-[rgb(var(--muted))]">
{JSON.stringify(chartReady, null, 2)}
        </pre>
      </section>
    </div>
  );
}

app/diet/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type DietLog = {
  id: string;
  logged_at: string;
  protein_g: number;
  calories: number | null;
  steps: number | null;
  notes: string | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function DietPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DietLog[]>([]);
  const [loggedAt, setLoggedAt] = useState(todayISO());

  const [protein, setProtein] = useState<number>(200);
  const [calories, setCalories] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [notes, setNotes] = useState("");

  async function refresh() {
    const { data } = await supabase
      .from("diet_logs")
      .select("id,logged_at,protein_g,calories,steps,notes")
      .order("logged_at", { ascending: false })
      .limit(120);
    setLogs((data ?? []) as DietLog[]);
  }

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth?.user?.id ?? null);
      if (auth?.user?.id) await refresh();
    })();
  }, []);

  const chartReadyProtein = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .map(l => ({ x: l.logged_at, y: l.protein_g }));
  }, [logs]);

  async function save() {
    if (!userId) return alert("Sign in (magic link) first.");

    const { error } = await supabase
      .from("diet_logs")
      .upsert(
        {
          user_id: userId,
          logged_at: loggedAt,
          protein_g: protein,
          calories: calories ? Number(calories) : null,
          steps: steps ? Number(steps) : null,
          notes: notes || null,
        },
        { onConflict: "user_id,logged_at" }
      );

    if (error) {
      console.error(error);
      return alert("Could not save.");
    }

    setNotes("");
    await refresh();
    alert("Saved.");
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <h1 className="headline text-2xl">Diet Log</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Simple mode: protein first. Target <span className="text-lime">200–240g</span>.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Date</label>
            <input
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Protein (g)</label>
            <input
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Calories (optional)</label>
            <input
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              placeholder="e.g. 3200"
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--muted))]">Steps (optional)</label>
            <input
              inputMode="numeric"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              placeholder="e.g. 6000"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-[rgb(var(--muted))]">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-3"
              placeholder="Meals, cravings, hydration, etc."
            />
          </div>
        </div>

        <div className="mt-3">
          <Button variant="gradient" size="lg" className="w-full" onClick={save}>
            Save Diet Log
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <h2 className="font-display text-lime">Recent</h2>
        <div className="mt-3 space-y-2">
          {logs.slice(0, 14).map((l) => (
            <div key={l.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.logged_at}</p>
                <p className="text-sm text-lime">{l.protein_g}g</p>
              </div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                {l.calories != null ? `Calories: ${l.calories}` : "Calories: —"} •{" "}
                {l.steps != null ? `Steps: ${l.steps}` : "Steps: —"}
              </div>
              {l.notes ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{l.notes}</p> : null}
            </div>
          ))}
        </div>

        {/* chart-ready */}
        <pre className="mt-4 overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] p-3 text-xs text-[rgb(var(--muted))]">
{JSON.stringify(chartReadyProtein, null, 2)}
        </pre>
      </section>
    </div>
  );
}

4) Put exercise demos in /public/demos

Create this folder:

public/demos/


Add these filenames (match the seed exactly):

chest-press.mp4

lat-pulldown.mp4

seated-row.mp4

shoulder-press.mp4

triceps-pushdown.mp4

dumbbell-curl.mp4

leg-press.mp4

rdl.mp4

ham-curl.mp4

calf-raise.mp4

cable-crunch.mp4

plank.mp4