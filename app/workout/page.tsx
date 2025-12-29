"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  getWorkoutCadence,
  getTemplateWithItems,
  getOrCreateTodaySession,
  initializeSessionExercises,
  getSessionExercises,
  toggleExerciseCompletion,
  finishSession,
  getTodayFormatted,
  type CadenceInfo,
} from "@/lib/workout-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { ProgressDots } from "@/components/ui/step-indicator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Check,
  Play,
  Timer,
  Coffee,
  Dumbbell,
  CheckCircle2,
  Video,
  Sparkles,
  Moon,
  ChevronRight,
  Zap,
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

interface SessionExercise {
  id: string
  exercise_id: string
  template_item_id: string
  is_completed: boolean
  completed_at: string | null
}

function WorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [cadence, setCadence] = useState<CadenceInfo | null>(null)
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([])
  const [sessionId, setSessionId] = useState<string | null>(sessionParam)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [starting, setStarting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [demoExercise, setDemoExercise] = useState<TemplateItem | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)

  useEffect(() => {
    loadWorkoutData()
  }, [])

  async function loadWorkoutData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/settings")
        return
      }

      setUserId(user.id)

      const cadenceInfo = await getWorkoutCadence(user.id)
      setCadence(cadenceInfo)

      let activeSessionId = sessionParam

      if (!activeSessionId && cadenceInfo.todaySessionId) {
        activeSessionId = cadenceInfo.todaySessionId
      }

      const { data: templates } = await supabase
        .from("workout_templates")
        .select("*")
        .order("cycle_order")

      if (!templates || templates.length === 0) {
        setLoading(false)
        return
      }

      const targetTemplate = templates.find(
        (t) => t.cycle_order === cadenceInfo.nextTemplateOrder
      ) || templates[0]
      setTemplate(targetTemplate)

      const items = await getTemplateWithItems(targetTemplate.id)
      setTemplateItems(items as TemplateItem[])

      if (activeSessionId) {
        setSessionId(activeSessionId)
        const exercises = await getSessionExercises(activeSessionId)
        setSessionExercises(exercises as SessionExercise[])
      }
    } catch (err) {
      console.error("Error loading workout data:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartSession() {
    if (!userId || !template) return

    setStarting(true)
    try {
      const { sessionId: newSessionId, isNew } = await getOrCreateTodaySession(
        userId,
        template.id
      )

      setSessionId(newSessionId)

      if (isNew) {
        await initializeSessionExercises(userId, newSessionId, template.id)
      }

      const exercises = await getSessionExercises(newSessionId)
      setSessionExercises(exercises as SessionExercise[])

      router.replace(`/workout?session=${newSessionId}`)
    } catch (err) {
      console.error("Error starting session:", err)
    } finally {
      setStarting(false)
    }
  }

  const handleToggleExercise = useCallback(
    async (templateItemId: string) => {
      if (!sessionId) return

      const exerciseRecord = sessionExercises.find(
        (se) => se.template_item_id === templateItemId
      )

      if (!exerciseRecord) return

      const newCompleted = !exerciseRecord.is_completed

      // Show animation if completing
      if (newCompleted) {
        setJustCompleted(templateItemId)
        setTimeout(() => setJustCompleted(null), 600)
      }

      setSessionExercises((prev) =>
        prev.map((se) =>
          se.id === exerciseRecord.id
            ? {
                ...se,
                is_completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null,
              }
            : se
        )
      )

      await toggleExerciseCompletion(exerciseRecord.id, newCompleted)
    },
    [sessionId, sessionExercises]
  )

  async function handleFinishSession() {
    if (!sessionId) return

    setFinishing(true)
    try {
      await finishSession(sessionId)
      router.push("/")
    } catch (err) {
      console.error("Error finishing session:", err)
      setFinishing(false)
    }
  }

  const isExerciseCompleted = (templateItemId: string): boolean => {
    return sessionExercises.some(
      (se) => se.template_item_id === templateItemId && se.is_completed
    )
  }

  const isPlank = (item: TemplateItem) =>
    item.exercise.name.toLowerCase().includes("plank")

  const completedCount = sessionExercises.filter((se) => se.is_completed).length
  const totalCount = templateItems.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const allCompleted = completedCount === totalCount && totalCount > 0

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

  // REST DAY UI
  if (cadence?.todayType === "rest" && !sessionId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 pb-24">
        <header className="mb-6 animate-fade-in-up">
          <h1 className="headline text-3xl font-bold">{getTodayFormatted()}</h1>
          <p className="mt-1 text-muted-foreground">2 on / 1 off plan</p>
        </header>

        <Card className="mb-6 animate-scale-in overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="relative flex justify-center mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20">
                <Moon className="h-10 w-10 text-blue-400 float" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full border-2 border-blue-500/20 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <h2 className="headline text-2xl font-bold mb-2">Rest Day</h2>
            <p className="text-muted-foreground mb-6">
              You've trained 2 days in a row. Recovery is when you grow stronger.
            </p>

            <div className="rounded-xl bg-surface2 p-4 text-left space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Coffee className="h-4 w-4 text-muted-foreground" />
                Recovery Checklist
              </h3>
              {[
                "Light walking (15-20 min)",
                "Stretching or mobility work",
                "Foam rolling",
                "Drink plenty of water",
                "Quality sleep (7-9 hours)",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm text-muted-foreground animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="h-2 w-2 rounded-full bg-blue-400/50" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <p className="text-sm text-muted-foreground mb-2">Next workout</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-surface2 px-4 py-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span className="font-medium">{template?.name || "Day 1"}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  // NO TEMPLATE
  if (!template) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Dumbbell className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground mb-4">No workout template found.</p>
        <Button variant="gradient" onClick={() => router.push("/")}>
          Go Back
        </Button>
      </div>
    )
  }

  // WORKOUT DAY - NOT YET STARTED
  if (!sessionId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 pb-24">
        <header className="mb-6 animate-fade-in-up">
          <h1 className="headline text-3xl font-bold">{getTodayFormatted()}</h1>
          <p className="mt-1 text-muted-foreground">2 on / 1 off plan</p>
        </header>

        <Card className="mb-6 card-glow glow-green animate-scale-in">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
                <Dumbbell className="h-8 w-8 text-lime float" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Workout</p>
                <h2 className="headline text-2xl font-bold">{template.name}</h2>
              </div>
            </div>

            {template.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
            )}

            {/* Exercise preview dots */}
            <div className="flex items-center justify-between mb-4 py-3 px-4 rounded-xl bg-surface2">
              <span className="text-sm text-muted-foreground">{templateItems.length} exercises</span>
              <ProgressDots total={templateItems.length} completed={0} />
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full text-lg font-semibold glow-pulse"
              onClick={handleStartSession}
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
                  Start Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview checklist with timeline */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Today's Exercises
          </h2>
          <div className="space-y-2 stagger-children">
            {templateItems.map((item, idx) => {
              const repLabel = isPlank(item)
                ? `${item.rep_min}–${item.rep_max}s`
                : `${item.rep_min}–${item.rep_max}`
              const isLast = idx === templateItems.length - 1

              return (
                <div key={item.id} className="relative">
                  {/* Timeline connector */}
                  {!isLast && (
                    <div className="absolute left-[17px] top-[40px] bottom-[-8px] w-0.5 bg-border" />
                  )}

                  <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3 transition-all hover:bg-muted">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-sm font-bold border-2 border-border">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.sets} × {repLabel}
                        {item.start_weight_lbs && ` • ${item.start_weight_lbs} lb`}
                      </p>
                    </div>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  // WORKOUT DAY - ACTIVE SESSION WITH CHECKLIST
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      {/* Header with Progress Ring */}
      <header className="mb-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline text-2xl font-bold">{template.name}</h1>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} exercises
            </p>
          </div>
          <ProgressRing progress={progressPercent} size={64} strokeWidth={5} showGlow={allCompleted}>
            <span className="text-sm font-bold headline">{Math.round(progressPercent)}%</span>
          </ProgressRing>
        </div>
      </header>

      {/* Animated Progress bar */}
      <div className="mb-6 relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className={`h-full bg-gradient-to-r from-green to-lime transition-all duration-500 ease-out ${allCompleted ? 'progress-shimmer' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-1">
          {templateItems.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 w-1 rounded-full transition-all duration-300 ${
                idx < completedCount ? 'bg-primary scale-125' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Checklist with Timeline */}
      <section className="space-y-3 mb-6">
        {templateItems.map((item, idx) => {
          const completed = isExerciseCompleted(item.id)
          const isJustCompleted = justCompleted === item.id
          const repLabel = isPlank(item)
            ? `${item.rep_min}–${item.rep_max}s`
            : `${item.rep_min}–${item.rep_max} reps`
          const isLast = idx === templateItems.length - 1

          return (
            <div key={item.id} className="relative">
              {/* Timeline connector */}
              {!isLast && (
                <div className="absolute left-[23px] top-[52px] bottom-[-12px] w-0.5 overflow-hidden bg-border">
                  <div
                    className="absolute inset-x-0 top-0 bg-gradient-to-b from-primary to-lime transition-all duration-500"
                    style={{ height: completed ? '100%' : '0%' }}
                  />
                </div>
              )}

              <Card
                className={`transition-all duration-300 ${
                  completed
                    ? "bg-primary/10 border-primary/30"
                    : ""
                } ${isJustCompleted ? "scale-[1.02] shadow-lg" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Animated Checkbox */}
                    <button
                      onClick={() => handleToggleExercise(item.id)}
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        completed
                          ? "border-primary bg-primary text-primary-foreground scale-110"
                          : "border-border hover:border-primary/50 hover:bg-primary/10"
                      } ${isJustCompleted ? "animate-pulse" : ""}`}
                    >
                      {completed ? (
                        <Check className="h-5 w-5 check-animate" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Exercise name */}
                      <h3
                        className={`font-semibold leading-tight transition-all ${
                          completed ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {item.exercise.name}
                      </h3>

                      {/* Prescription chips */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                          completed
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

                      {/* Form cue */}
                      {item.exercise.form_cues && !completed && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                          {item.exercise.form_cues.split(". ")[0]}
                        </p>
                      )}

                      {/* Demo button */}
                      {item.exercise.demo_url && !completed && (
                        <Sheet>
                          <SheetTrigger asChild>
                            <button
                              onClick={() => setDemoExercise(item)}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Video className="h-3 w-3" />
                              View Demo
                            </button>
                          </SheetTrigger>
                          <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
                            <SheetHeader>
                              <SheetTitle className="headline">
                                {item.exercise.name}
                              </SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                              <div className="aspect-video overflow-hidden rounded-xl bg-surface2">
                                <video
                                  src={item.exercise.demo_url}
                                  className="h-full w-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              </div>
                              {item.exercise.form_cues && (
                                <div className="mt-4 rounded-xl bg-surface2 p-4">
                                  <h4 className="font-semibold mb-2">Form Cues</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {item.exercise.form_cues}
                                  </p>
                                </div>
                              )}
                            </div>
                          </SheetContent>
                        </Sheet>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </section>

      {/* Finish Button */}
      <Button
        variant={allCompleted ? "gradient" : "outline"}
        size="lg"
        className={`w-full text-lg font-semibold transition-all ${allCompleted ? 'glow-pulse' : ''}`}
        onClick={handleFinishSession}
        disabled={finishing}
      >
        {finishing ? (
          <span className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Finishing...
          </span>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Finish Session ({completedCount}/{totalCount})
          </>
        )}
      </Button>

      {/* Completion celebration */}
      {allCompleted && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-primary/20 to-lime/20 border border-primary/30 p-4 text-center animate-scale-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-lime" />
            <span className="font-semibold text-primary">All exercises completed!</span>
            <Sparkles className="h-5 w-5 text-lime" />
          </div>
          <p className="text-sm text-muted-foreground">
            Great work! Tap finish to complete your session.
          </p>
        </div>
      )}
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </div>
      }
    >
      <WorkoutContent />
    </Suspense>
  )
}
