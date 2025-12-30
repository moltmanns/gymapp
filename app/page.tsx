"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  getWorkoutCadence,
  getTemplateWithItems,
  getWorkoutStreak,
  getDietStreak,
  getTodayFormatted,
  formatDateShort,
  type CadenceInfo,
} from "@/lib/workout-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { ProgressDots } from "@/components/ui/step-indicator"
import {
  Dumbbell,
  Flame,
  Apple,
  Scale,
  Timer,
  ChevronRight,
  Play,
  Moon,
  Coffee,
  CheckCircle2,
  Zap,
  ArrowRight,
} from "lucide-react"

interface TemplateItem {
  id: string
  exercise_id: string
  sort_order: number
  sets: number
  rep_min: number
  rep_max: number
  rest_seconds: number
  start_weight_lbs: number | null
  increment_lbs: number
  notes: string | null
  exercise: {
    id: string
    name: string
    category: string
    equipment: string
    demo_url: string | null
    form_cues: string | null
  }
}

interface WorkoutTemplate {
  id: string
  name: string
  cycle_order: number
  description: string | null
}

export default function TodayPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [cadence, setCadence] = useState<CadenceInfo | null>(null)
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([])
  const [workoutStreak, setWorkoutStreak] = useState({ streak: 0, lastDate: null as string | null })
  const [dietStreak, setDietStreak] = useState({ streak: 0, lastDate: null as string | null })
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // Get workout cadence (determines if rest day or workout day)
      if (user) {
        const cadenceInfo = await getWorkoutCadence(user.id)
        setCadence(cadenceInfo)

        // Get templates
        const { data: templates } = await supabase
          .from("workout_templates")
          .select("*")
          .order("cycle_order")

        if (templates && templates.length > 0) {
          const targetTemplate = templates.find(
            (t) => t.cycle_order === cadenceInfo.nextTemplateOrder
          ) || templates[0]
          setTemplate(targetTemplate)

          const items = await getTemplateWithItems(targetTemplate.id)
          setTemplateItems(items as TemplateItem[])
        }

        // Get streaks
        const [workout, diet] = await Promise.all([
          getWorkoutStreak(user.id),
          getDietStreak(user.id),
        ])
        setWorkoutStreak(workout)
        setDietStreak(diet)
      } else {
        // Not logged in - show Day 1 as default preview
        const { data: templates } = await supabase
          .from("workout_templates")
          .select("*")
          .order("cycle_order")

        if (templates && templates.length > 0) {
          const defaultTemplate = templates.find((t) => t.cycle_order === 1) || templates[0]
          setTemplate(defaultTemplate)
          const items = await getTemplateWithItems(defaultTemplate.id)
          setTemplateItems(items as TemplateItem[])
        }
      }
    } catch (err) {
      console.error("Error loading dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartWorkout() {
    if (!template) return

    if (!userId) {
      router.push("/settings")
      return
    }

    setStarting(true)
    router.push("/workout")
  }

  function handleContinueWorkout() {
    if (cadence?.todaySessionId) {
      router.push(`/workout?session=${cadence.todaySessionId}`)
    } else {
      router.push("/workout")
    }
  }

  const isPlank = (item: TemplateItem) =>
    item.exercise.name.toLowerCase().includes("plank")

  // Determine today's state
  const isRestDay = cadence?.todayType === "rest"
  const alreadyWorkedOutToday = cadence?.workedOutToday && !cadence?.todaySessionId
  const hasActiveSession = !!cadence?.todaySessionId

  // Calculate streak progress (capped at 7 for visual)
  const workoutStreakProgress = Math.min((workoutStreak.streak / 7) * 100, 100)
  const dietStreakProgress = Math.min((dietStreak.streak / 7) * 100, 100)

  // Day label for hero
  const getDayLabel = () => {
    if (isRestDay) return "Rest Day"
    if (!template) return "Workout Day"
    return template.name // "Day 1—Upper" or "Day 2—Lower + Core"
  }

  const getDayDescription = () => {
    if (isRestDay) return "Recovery day • You earned it"
    if (alreadyWorkedOutToday) return "Completed today"
    if (hasActiveSession) return "In progress • Tap to continue"
    return template?.description || "Time to train"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      {/* Date Header */}
      <header className="mb-4 animate-fade-in-up">
        <p className="text-muted-foreground text-sm">{getTodayFormatted()}</p>
        <p className="text-xs text-muted-foreground">2 on / 1 off • Strength + fat loss</p>
      </header>

      {/* ===================== */}
      {/* TODAY IS: HERO CARD */}
      {/* ===================== */}
      <Card className={`mb-6 overflow-hidden animate-scale-in ${
        isRestDay
          ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30"
          : alreadyWorkedOutToday
          ? "bg-gradient-to-br from-primary/10 to-lime/10 border-primary/30"
          : "card-glow glow-green"
      }`}>
        <CardContent className="p-6">
          {/* Today Type Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-medium uppercase tracking-wider ${
              isRestDay ? "text-blue-400" : "text-primary"
            }`}>
              Today is
            </span>
            {alreadyWorkedOutToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </span>
            )}
          </div>

          {/* Hero Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
              isRestDay ? "bg-blue-500/20" : "bg-primary/20"
            }`}>
              {isRestDay ? (
                <Moon className="h-8 w-8 text-blue-400 float" />
              ) : alreadyWorkedOutToday ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <Dumbbell className="h-8 w-8 text-lime float" />
              )}
              {!isRestDay && !alreadyWorkedOutToday && (
                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
              )}
            </div>
            <div className="flex-1">
              <h1 className="headline text-2xl font-bold">{getDayLabel()}</h1>
              <p className="text-sm text-muted-foreground">{getDayDescription()}</p>
            </div>
          </div>

          {/* Action Area */}
          {isRestDay ? (
            // REST DAY CONTENT
            <div className="rounded-xl bg-surface2 p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Coffee className="h-4 w-4 text-muted-foreground" />
                Recovery Focus
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {[
                  "Light walking",
                  "Stretching",
                  "Hydration",
                  "Quality sleep",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400/50" />
                    {item}
                  </div>
                ))}
              </div>
              {template && (
                <div className="pt-3 mt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Next workout: <span className="text-foreground font-medium">{template.name}</span>
                  </p>
                </div>
              )}
            </div>
          ) : alreadyWorkedOutToday ? (
            // COMPLETED TODAY
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-sm text-primary font-medium mb-1">Great work today!</p>
              <p className="text-xs text-muted-foreground">
                Your next workout will be {template?.cycle_order === 1 ? "Day 2—Lower + Core" : "Day 1—Upper"}
              </p>
            </div>
          ) : hasActiveSession ? (
            // ACTIVE SESSION - CONTINUE
            <>
              <div className="flex items-center justify-between mb-4 py-3 px-4 rounded-xl bg-surface2">
                <span className="text-sm text-muted-foreground">Session in progress</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
              <Button
                variant="gradient"
                size="lg"
                className="w-full text-lg font-semibold glow-pulse"
                onClick={handleContinueWorkout}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Continue Workout
              </Button>
            </>
          ) : (
            // READY TO START
            <>
              <div className="flex items-center justify-between mb-4 py-3 px-4 rounded-xl bg-surface2">
                <span className="text-sm text-muted-foreground">Exercises</span>
                <div className="flex items-center gap-3">
                  <ProgressDots total={templateItems.length} completed={0} />
                  <span className="text-sm font-medium">{templateItems.length} total</span>
                </div>
              </div>
              <Button
                variant="gradient"
                size="lg"
                className="w-full text-lg font-semibold glow-pulse"
                onClick={handleStartWorkout}
                disabled={starting}
              >
                {starting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Starting...
                  </span>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start Workout
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Streak Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 stagger-children grid-cards">
        {/* Workout Streak */}
        <Card className="stat-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className={`h-5 w-5 text-orange-500 ${workoutStreak.streak > 0 ? 'streak-fire' : ''}`} />
                  <span className="text-sm font-medium">Workout</span>
                </div>
                <p className="text-3xl font-bold headline">{workoutStreak.streak}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {workoutStreak.streak === 1 ? "day" : "days"}
                </p>
              </div>
              <ProgressRing progress={workoutStreakProgress} size={56} strokeWidth={4}>
                <Zap className="h-5 w-5 text-lime" />
              </ProgressRing>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Last: {formatDateShort(workoutStreak.lastDate)}
            </p>
          </CardContent>
        </Card>

        {/* Diet Streak */}
        <Card className="stat-card overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Diet</span>
                </div>
                <p className="text-3xl font-bold headline">{dietStreak.streak}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dietStreak.streak === 1 ? "day" : "days"}
                </p>
              </div>
              <ProgressRing progress={dietStreakProgress} size={56} strokeWidth={4}>
                <Apple className="h-5 w-5 text-primary" />
              </ProgressRing>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Last: {formatDateShort(dietStreak.lastDate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 stagger-children grid-cards">
        <Link href="/weight">
          <Card className="cursor-pointer transition-all duration-300 hover:bg-surface2 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                <Scale className="h-5 w-5 text-blue-400" />
              </div>
              <span className="font-medium">Log Weight</span>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/diet">
          <Card className="cursor-pointer transition-all duration-300 hover:bg-surface2 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Apple className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">Log Diet</span>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's Plan - Exercise List (only on workout days, not rest) */}
      {!isRestDay && templateItems.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="headline text-lg font-semibold">
              {alreadyWorkedOutToday ? "Completed" : "Today's Plan"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {templateItems.length} exercises
            </span>
          </div>

          <div className="space-y-3">
            {templateItems.map((item, idx) => {
              const exercise = item.exercise
              const repLabel = isPlank(item)
                ? `${item.rep_min}–${item.rep_max}s`
                : `${item.rep_min}–${item.rep_max} reps`
              const isLast = idx === templateItems.length - 1

              return (
                <div key={item.id} className="relative">
                  {/* Timeline connector */}
                  {!isLast && (
                    <div className={`absolute left-[19px] top-[44px] bottom-[-12px] w-0.5 ${
                      alreadyWorkedOutToday
                        ? "bg-primary/30"
                        : "bg-gradient-to-b from-border to-transparent"
                    }`} />
                  )}

                  <Card className={`transition-all duration-300 ${
                    alreadyWorkedOutToday ? "opacity-60" : "hover:bg-surface2"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 ${
                          alreadyWorkedOutToday
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : "bg-surface2 border-border"
                        }`}>
                          {alreadyWorkedOutToday ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold leading-tight ${
                            alreadyWorkedOutToday ? "text-muted-foreground" : ""
                          }`}>
                            {exercise.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                              alreadyWorkedOutToday
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/15 text-primary"
                            }`}>
                              {item.sets} × {repLabel}
                            </span>
                            {item.start_weight_lbs ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2 py-1 text-xs text-muted-foreground">
                                {item.start_weight_lbs} lb
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/15 px-2 py-1 text-xs text-orange-400">
                                Timed
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2 py-1 text-xs text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              {item.rest_seconds}s
                            </span>
                          </div>

                          {exercise.form_cues && !alreadyWorkedOutToday && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                              {exercise.form_cues.split(". ")[0]}.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Motivation footer */}
      <div className="mt-8 rounded-xl bg-gradient-to-r from-surface2 to-surface p-4 text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <p className="text-sm text-muted-foreground italic">
          {isRestDay
            ? "\"Rest is not idleness. It's when you grow stronger.\""
            : "\"Strength means control. Leave 1–2 reps in the tank.\""
          }
        </p>
      </div>
    </div>
  )
}
