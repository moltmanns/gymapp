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
