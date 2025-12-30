import { supabase } from "./supabase"

/**
 * Calculate consecutive day streak for a given log type
 * @param logs Array of log entries with logged_at or started_at dates
 * @param dateField The field name containing the date
 * @returns Number of consecutive days
 */
export function calculateStreak(
  logs: Array<{ [key: string]: unknown }>,
  dateField: string
): number {
  if (!logs || logs.length === 0) return 0

  // Normalize dates to YYYY-MM-DD and get unique dates
  const uniqueDates = [...new Set(
    logs.map((log) => {
      const dateVal = log[dateField] as string
      return dateVal.split("T")[0]
    })
  )].sort().reverse() // Most recent first

  if (uniqueDates.length === 0) return 0

  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  // Check if most recent log is today or yesterday
  const mostRecent = uniqueDates[0]
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0 // Streak broken
  }

  let streak = 1
  let currentDate = new Date(mostRecent)

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(currentDate)
    prevDate.setDate(prevDate.getDate() - 1)
    const expectedDate = prevDate.toISOString().split("T")[0]

    if (uniqueDates[i] === expectedDate) {
      streak++
      currentDate = prevDate
    } else {
      break // Gap in streak
    }
  }

  return streak
}

/**
 * Get the recommended next workout template based on last session
 */
export async function getRecommendedTemplate(userId: string | null) {
  // Get templates
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .order("cycle_order")

  if (!templates || templates.length === 0) {
    return { nextTemplate: null, lastSession: null }
  }

  if (!userId) {
    // Not logged in - default to Day 1
    return {
      nextTemplate: templates.find((t) => t.cycle_order === 1) || templates[0],
      lastSession: null,
    }
  }

  // Get last session
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*, template:workout_templates(*)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)

  const lastSession = sessions?.[0] || null

  // Determine next template
  let nextCycleOrder = 1
  if (lastSession?.template) {
    const lastTemplate = lastSession.template as { cycle_order: number }
    nextCycleOrder = lastTemplate.cycle_order === 1 ? 2 : 1
  }

  const nextTemplate =
    templates.find((t) => t.cycle_order === nextCycleOrder) || templates[0]

  return { nextTemplate, lastSession }
}

/**
 * Get template items with exercises for a given template ID
 */
export async function getTemplateWithItems(templateId: string) {
  const { data: items } = await supabase
    .from("workout_template_items")
    .select("*, exercise:exercises(*)")
    .eq("template_id", templateId)
    .order("sort_order")

  return items || []
}

/**
 * Get workout logging streak for a user
 */
export async function getWorkoutStreak(userId: string) {
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(60) // Last 60 sessions should cover any reasonable streak

  return {
    streak: calculateStreak(sessions || [], "started_at"),
    lastDate: sessions?.[0]?.started_at?.split("T")[0] || null,
  }
}

/**
 * Get diet logging streak for a user
 */
export async function getDietStreak(userId: string) {
  const { data: logs } = await supabase
    .from("diet_logs")
    .select("logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(60)

  return {
    streak: calculateStreak(logs || [], "logged_at"),
    lastDate: logs?.[0]?.logged_at || null,
  }
}

/**
 * Format a date string nicely
 */
export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const date = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"))
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/**
 * Get today's date formatted nicely
 */
export function getTodayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// ============================================
// CADENCE DETECTION (2 on / 1 off)
// ============================================

export type TodayType = "workout" | "rest"

export interface CadenceInfo {
  todayType: TodayType
  nextTemplateOrder: number // 1 or 2
  workedOutToday: boolean
  workedOutYesterday: boolean
  workedOutDayBefore: boolean
  lastTemplateOrder: number | null
  todaySessionId: string | null
}

/**
 * Get local date string (YYYY-MM-DD) for a given date
 * Using America/Chicago timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" })
}

/**
 * Check if a timestamp falls on a specific local date
 */
export function isOnLocalDate(timestamp: string, localDate: string): boolean {
  const tsDate = new Date(timestamp).toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  })
  return tsDate === localDate
}

/**
 * Get dates for today, yesterday, and day before in local timezone
 */
export function getRecentDates() {
  const now = new Date()
  const today = getLocalDateString(now)

  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = getLocalDateString(yesterdayDate)

  const dayBeforeDate = new Date(now)
  dayBeforeDate.setDate(dayBeforeDate.getDate() - 2)
  const dayBefore = getLocalDateString(dayBeforeDate)

  return { today, yesterday, dayBefore }
}

/**
 * Determine workout cadence for 2-on/1-off schedule
 * Returns what type of day today is and which template to use
 */
export async function getWorkoutCadence(userId: string): Promise<CadenceInfo> {
  const { today, yesterday, dayBefore } = getRecentDates()

  // Fetch recent sessions (last 10 should be plenty)
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, ended_at, template_id, template:workout_templates(cycle_order)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(10)

  const sessionList = sessions || []

  // Check workout history by local date
  const workedOutToday = sessionList.some((s) => isOnLocalDate(s.started_at, today))
  const workedOutYesterday = sessionList.some((s) => isOnLocalDate(s.started_at, yesterday))
  const workedOutDayBefore = sessionList.some((s) => isOnLocalDate(s.started_at, dayBefore))

  // Get last template cycle order
  const lastSession = sessionList[0] as {
    id: string
    started_at: string
    ended_at: string | null
    template_id: string
    template: { cycle_order: number } | { cycle_order: number }[] | null
  } | undefined

  let lastTemplateOrder: number | null = null
  if (lastSession?.template) {
    // Handle both array and object forms from Supabase joins
    const tmpl = Array.isArray(lastSession.template)
      ? lastSession.template[0]
      : lastSession.template
    lastTemplateOrder = tmpl?.cycle_order ?? null
  }

  // Find today's active session (started today, not ended)
  const todaySession = sessionList.find(
    (s) => isOnLocalDate(s.started_at, today) && s.ended_at === null
  )
  const todaySessionId = todaySession?.id || null

  // Determine today type using 2-on/1-off logic
  let todayType: TodayType = "workout"

  if (workedOutYesterday && workedOutDayBefore) {
    // Worked out 2 days in a row, today is rest
    todayType = "rest"
  }
  // If we already worked out today, it's still a workout day (resumable)
  // If we didn't work out yesterday but did day before, that's fine - workout day

  // Determine next template order
  let nextTemplateOrder = 1
  if (lastTemplateOrder !== null) {
    nextTemplateOrder = lastTemplateOrder === 1 ? 2 : 1
  }

  return {
    todayType,
    nextTemplateOrder,
    workedOutToday,
    workedOutYesterday,
    workedOutDayBefore,
    lastTemplateOrder,
    todaySessionId,
  }
}

/**
 * Get or create today's workout session
 */
export async function getOrCreateTodaySession(
  userId: string,
  templateId: string
): Promise<{ sessionId: string; isNew: boolean }> {
  const { today } = getRecentDates()

  // Check for existing active session today
  const { data: existingSessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(5)

  const todaySession = existingSessions?.find((s) =>
    isOnLocalDate(s.started_at, today)
  )

  if (todaySession) {
    return { sessionId: todaySession.id, isNew: false }
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      template_id: templateId,
    })
    .select("id")
    .single()

  if (error || !newSession) {
    throw new Error("Failed to create workout session")
  }

  return { sessionId: newSession.id, isNew: true }
}

/**
 * Initialize session exercises for a new session
 */
export async function initializeSessionExercises(
  userId: string,
  sessionId: string,
  templateId: string
): Promise<void> {
  // Get template items
  const { data: templateItems } = await supabase
    .from("workout_template_items")
    .select("id, exercise_id")
    .eq("template_id", templateId)
    .order("sort_order")

  if (!templateItems || templateItems.length === 0) return

  // Create session exercise records
  const records = templateItems.map((item) => ({
    user_id: userId,
    session_id: sessionId,
    exercise_id: item.exercise_id,
    template_item_id: item.id,
    is_completed: false,
  }))

  await supabase.from("workout_session_exercises").insert(records)
}

/**
 * Get session exercises with completion status
 */
export async function getSessionExercises(sessionId: string) {
  const { data } = await supabase
    .from("workout_session_exercises")
    .select("id, exercise_id, template_item_id, is_completed, completed_at")
    .eq("session_id", sessionId)

  return data || []
}

/**
 * Toggle exercise completion status
 */
export async function toggleExerciseCompletion(
  exerciseRecordId: string,
  completed: boolean
): Promise<void> {
  await supabase
    .from("workout_session_exercises")
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", exerciseRecordId)
}

/**
 * Finish a workout session
 */
export async function finishSession(sessionId: string): Promise<void> {
  await supabase
    .from("workout_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
}

// ============================================
// SET LOGGING & PROGRESSION SYSTEM
// ============================================

export interface SetLog {
  id?: string
  session_id: string
  exercise_id: string
  set_number: number
  weight_lbs: number
  reps: number
  rir: number | null
  is_warmup: boolean
}

export interface ExercisePerformance {
  session_id: string
  session_date: string
  sets: {
    set_number: number
    weight_lbs: number
    reps: number
    rir: number | null
  }[]
}

export interface ProgressionSuggestion {
  suggestedWeight: number
  reason: string
  status: "increase" | "maintain" | "decrease"
  allSetsHitMax: boolean
  avgReps: number
  lastWeight: number
}

/**
 * Log a single set for an exercise
 */
export async function logSet(set: Omit<SetLog, "id">): Promise<string | null> {
  const { data, error } = await supabase
    .from("workout_sets")
    .insert(set)
    .select("id")
    .single()

  if (error) {
    console.error("Error logging set:", error)
    return null
  }

  return data?.id || null
}

/**
 * Update an existing set
 */
export async function updateSet(
  setId: string,
  updates: Partial<Omit<SetLog, "id" | "session_id" | "exercise_id">>
): Promise<boolean> {
  const { error } = await supabase
    .from("workout_sets")
    .update(updates)
    .eq("id", setId)

  return !error
}

/**
 * Delete a set
 */
export async function deleteSet(setId: string): Promise<boolean> {
  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", setId)

  return !error
}

/**
 * Get all sets for an exercise in a session
 */
export async function getSessionSets(
  sessionId: string,
  exerciseId: string
): Promise<SetLog[]> {
  const { data } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .order("set_number")

  return (data || []) as SetLog[]
}

/**
 * Get previous performance for an exercise (last N sessions)
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  limit: number = 5
): Promise<ExercisePerformance[]> {
  // Get recent sessions for this user that have sets for this exercise
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(`
      id,
      started_at,
      workout_sets!inner(
        set_number,
        weight_lbs,
        reps,
        rir,
        is_warmup,
        exercise_id
      )
    `)
    .eq("user_id", userId)
    .eq("workout_sets.exercise_id", exerciseId)
    .eq("workout_sets.is_warmup", false)
    .not("ended_at", "is", null) // Only completed sessions
    .order("started_at", { ascending: false })
    .limit(limit)

  if (!sessions) return []

  return sessions.map((session) => ({
    session_id: session.id,
    session_date: session.started_at.split("T")[0],
    sets: (session.workout_sets as Array<{
      set_number: number
      weight_lbs: number
      reps: number
      rir: number | null
      is_warmup: boolean
    }>)
      .filter((s) => !s.is_warmup)
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({
        set_number: s.set_number,
        weight_lbs: s.weight_lbs,
        reps: s.reps,
        rir: s.rir,
      })),
  }))
}

/**
 * Calculate progression suggestion based on performance
 *
 * Rules:
 * - Increase weight ONLY when ALL working sets hit rep_max with RIR >= 1
 * - If any set is below rep_max, maintain current weight
 * - If reps dropped significantly (≥2) across sessions, consider decreasing
 */
export function calculateProgression(
  history: ExercisePerformance[],
  repMin: number,
  repMax: number,
  incrementLbs: number,
  currentWeight: number
): ProgressionSuggestion {
  // No history - use current/starting weight
  if (history.length === 0) {
    return {
      suggestedWeight: currentWeight,
      reason: "First time - start here",
      status: "maintain",
      allSetsHitMax: false,
      avgReps: 0,
      lastWeight: currentWeight,
    }
  }

  const lastSession = history[0]
  const lastSets = lastSession.sets

  if (lastSets.length === 0) {
    return {
      suggestedWeight: currentWeight,
      reason: "No sets logged last session",
      status: "maintain",
      allSetsHitMax: false,
      avgReps: 0,
      lastWeight: currentWeight,
    }
  }

  // Calculate averages from last session
  const lastWeight = lastSets[0].weight_lbs
  const avgReps = lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length
  const minReps = Math.min(...lastSets.map((s) => s.reps))
  const allSetsHitMax = lastSets.every((s) => s.reps >= repMax)
  const lastSetRir = lastSets[lastSets.length - 1].rir

  // Check for rep drop (fatigue detection)
  if (history.length >= 2) {
    const prevSession = history[1]
    const prevAvgReps = prevSession.sets.length > 0
      ? prevSession.sets.reduce((sum, s) => sum + s.reps, 0) / prevSession.sets.length
      : 0

    // If avg reps dropped by 2+ at same weight, suggest maintaining
    if (prevAvgReps - avgReps >= 2 && lastWeight === prevSession.sets[0]?.weight_lbs) {
      return {
        suggestedWeight: lastWeight,
        reason: "Reps dropped - focus on recovery",
        status: "maintain",
        allSetsHitMax: false,
        avgReps,
        lastWeight,
      }
    }
  }

  // Progression logic
  if (allSetsHitMax && (lastSetRir === null || lastSetRir >= 1)) {
    // All sets hit max reps with RIR >= 1 - INCREASE
    return {
      suggestedWeight: lastWeight + incrementLbs,
      reason: `All sets hit ${repMax} reps - increase weight`,
      status: "increase",
      allSetsHitMax: true,
      avgReps,
      lastWeight,
    }
  }

  if (minReps < repMin) {
    // Couldn't hit minimum reps - might need to decrease
    // But only suggest decrease if this happened 2+ sessions in a row
    if (history.length >= 2) {
      const prevMinReps = history[1].sets.length > 0
        ? Math.min(...history[1].sets.map((s) => s.reps))
        : repMax

      if (prevMinReps < repMin) {
        return {
          suggestedWeight: Math.max(lastWeight - incrementLbs, 0),
          reason: "Struggling with reps - reduce weight",
          status: "decrease",
          allSetsHitMax: false,
          avgReps,
          lastWeight,
        }
      }
    }
  }

  // Default - maintain weight, chase reps
  return {
    suggestedWeight: lastWeight,
    reason: avgReps < repMax
      ? `Keep weight, aim for ${repMax} reps`
      : "Solid performance - maintain",
    status: "maintain",
    allSetsHitMax: false,
    avgReps,
    lastWeight,
  }
}

/**
 * Get suggested weight for next session of an exercise
 */
export async function getSuggestedWeight(
  userId: string,
  exerciseId: string,
  repMin: number,
  repMax: number,
  incrementLbs: number,
  defaultWeight: number
): Promise<ProgressionSuggestion> {
  const history = await getExerciseHistory(userId, exerciseId, 3)
  return calculateProgression(history, repMin, repMax, incrementLbs, defaultWeight)
}
