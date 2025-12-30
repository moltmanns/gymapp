"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mail,
  LogOut,
  User,
  CheckCircle,
  Scale,
  Target,
  Calendar,
  Dumbbell,
  Utensils,
  TrendingDown,
  TrendingUp,
  Flame,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Download,
} from "lucide-react"
import Link from "next/link"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { UserProfile, MonthlyBreakdown } from "@/lib/database.types"
import {
  getLocalToday,
  getFirstDayOfMonth,
  getDateOneYearAgo,
  formatNumber,
  formatWeightChange,
} from "@/lib/date-utils"

interface UserStats {
  workout_days: number
  total_workouts: number
  total_sets: number
  diet_days: number
  total_protein: number
  total_calories: number
  days_with_calories: number
}

interface SnapshotData {
  workoutDays: number
  dietDays: number
  totalProtein: number
  totalCalories: number
  weightChange: string | null
  avgProtein: number
  avgCalories: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [verifying, setVerifying] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [startingWeight, setStartingWeight] = useState("")
  const [goalWeight, setGoalWeight] = useState("")
  const [startingDate, setStartingDate] = useState("")

  // Stats state
  const [allTimeStats, setAllTimeStats] = useState<UserStats | null>(null)
  const [monthSnapshot, setMonthSnapshot] = useState<SnapshotData | null>(null)
  const [yearSnapshot, setYearSnapshot] = useState<SnapshotData | null>(null)
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([])
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [showAllMonths, setShowAllMonths] = useState(false)

  const loadStats = useCallback(async (userId: string) => {
    try {
      // Load all-time stats
      const { data: allTimeData } = await supabase.rpc("get_user_stats", {
        p_user_id: userId,
        p_start_date: null,
        p_end_date: null,
      })

      if (allTimeData && allTimeData.length > 0) {
        setAllTimeStats(allTimeData[0])
      }

      // Load current month stats
      const monthStart = getFirstDayOfMonth()
      const today = getLocalToday()

      const { data: monthData } = await supabase.rpc("get_user_stats", {
        p_user_id: userId,
        p_start_date: monthStart,
        p_end_date: today,
      })

      // Get weights for month snapshot
      const { data: monthStartWeight } = await supabase.rpc("get_weight_at_date", {
        p_user_id: userId,
        p_date: monthStart,
      })

      const { data: currentWeightData } = await supabase
        .from("bodyweight_logs")
        .select("weight_lbs")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1)
        .single()

      const currWeight = currentWeightData?.weight_lbs ?? null
      setCurrentWeight(currWeight)

      if (monthData && monthData.length > 0) {
        const md = monthData[0]
        setMonthSnapshot({
          workoutDays: md.workout_days,
          dietDays: md.diet_days,
          totalProtein: md.total_protein,
          totalCalories: md.total_calories,
          weightChange: formatWeightChange(monthStartWeight, currWeight),
          avgProtein: md.diet_days > 0 ? Math.round(md.total_protein / md.diet_days) : 0,
          avgCalories: md.days_with_calories > 0 ? Math.round(md.total_calories / md.days_with_calories) : 0,
        })
      }

      // Load past year stats
      const yearStart = getDateOneYearAgo()

      const { data: yearData } = await supabase.rpc("get_user_stats", {
        p_user_id: userId,
        p_start_date: yearStart,
        p_end_date: today,
      })

      const { data: yearStartWeight } = await supabase.rpc("get_weight_at_date", {
        p_user_id: userId,
        p_date: yearStart,
      })

      if (yearData && yearData.length > 0) {
        const yd = yearData[0]
        setYearSnapshot({
          workoutDays: yd.workout_days,
          dietDays: yd.diet_days,
          totalProtein: yd.total_protein,
          totalCalories: yd.total_calories,
          weightChange: formatWeightChange(yearStartWeight, currWeight),
          avgProtein: yd.diet_days > 0 ? Math.round(yd.total_protein / yd.diet_days) : 0,
          avgCalories: yd.days_with_calories > 0 ? Math.round(yd.total_calories / yd.days_with_calories) : 0,
        })
      }

      // Load monthly breakdown
      const { data: breakdownData } = await supabase.rpc("get_monthly_breakdown", {
        p_user_id: userId,
        p_months: 12,
        p_timezone: "America/Chicago",
      })

      if (breakdownData) {
        setMonthlyBreakdown(breakdownData)
      }
    } catch (err) {
      console.error("Error loading stats:", err)
    }
  }, [])

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    try {
      const { data } = await supabase
        .from("user_profile")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (data) {
        setProfile(data)
        setStartingWeight(data.starting_weight_lbs.toString())
        setGoalWeight(data.goal_weight_lbs?.toString() || "")
        setStartingDate(data.starting_date)
      }
    } catch {
      // No profile yet, that's okay
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadProfile(user.id)
      loadStats(user.id)
    }
  }, [user, loadProfile, loadStats])

  async function checkUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    } catch (err) {
      console.error("Error checking user:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setSending(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) throw error

      setSent(true)
    } catch (err) {
      console.error("Error sending code:", err)
      alert("Failed to send code. Please try again.")
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !otp) return

    setVerifying(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })

      if (error) throw error

      // Success - auth state change will update user
    } catch (err) {
      console.error("Error verifying code:", err)
      alert("Invalid code. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setAllTimeStats(null)
    setMonthSnapshot(null)
    setYearSnapshot(null)
    setMonthlyBreakdown([])
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !startingWeight) return

    setProfileSaving(true)
    try {
      const profileData = {
        user_id: user.id,
        starting_weight_lbs: parseInt(startingWeight),
        goal_weight_lbs: goalWeight ? parseInt(goalWeight) : null,
        starting_date: startingDate || getLocalToday(),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("user_profile") as any).upsert(profileData, {
        onConflict: "user_id",
      })

      if (error) throw error

      await loadProfile(user.id)
      await loadStats(user.id)
    } catch (err) {
      console.error("Error saving profile:", err)
      alert("Failed to save profile. Please try again.")
    } finally {
      setProfileSaving(false)
    }
  }

  const totalWeightLost =
    profile && currentWeight
      ? profile.starting_weight_lbs - currentWeight
      : null

  const progressToGoal =
    profile?.goal_weight_lbs && currentWeight && profile.starting_weight_lbs
      ? Math.min(
          100,
          Math.max(
            0,
            ((profile.starting_weight_lbs - currentWeight) /
              (profile.starting_weight_lbs - profile.goal_weight_lbs)) *
              100
          )
        )
      : null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="headline text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account & view stats</p>
      </div>

      {/* Auth Section */}
      {user ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">Signed in</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : sent ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Enter Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="mt-1 text-center text-2xl tracking-widest"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={verifying || otp.length !== 6}
              >
                {verifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>
            <Button
              variant="ghost"
              className="w-full mt-2 text-muted-foreground"
              onClick={() => {
                setSent(false)
                setOtp("")
              }}
            >
              Use Different Email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your email to receive a sign-in code. No password needed.
            </p>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={sending || !email}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Code"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Profile Section (only if signed in) */}
      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <Label htmlFor="startingWeight">Starting Weight (lbs) *</Label>
                  <Input
                    id="startingWeight"
                    type="number"
                    value={startingWeight}
                    onChange={(e) => setStartingWeight(e.target.value)}
                    placeholder="e.g. 470"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="goalWeight">Goal Weight (lbs)</Label>
                  <Input
                    id="goalWeight"
                    type="number"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="startingDate">Starting Date</Label>
                  <Input
                    id="startingDate"
                    type="date"
                    value={startingDate}
                    onChange={(e) => setStartingDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={profileSaving || !startingWeight}
                >
                  {profileSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Profile
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* All-Time Progress Summary (only if profile exists) */}
      {user && profile && (
        <Card className="mb-6 card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              All-Time Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weight Progress */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-surface2 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Starting</p>
                <p className="text-xl font-bold">{profile.starting_weight_lbs}</p>
                <p className="text-xs text-muted-foreground">lbs</p>
              </div>
              <div className="rounded-xl bg-surface2 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-xl font-bold">{currentWeight ?? "—"}</p>
                <p className="text-xs text-muted-foreground">lbs</p>
              </div>
              <div className="rounded-xl bg-primary/20 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Lost</p>
                <p className="text-xl font-bold text-primary">
                  {totalWeightLost !== null ? (
                    <>
                      {totalWeightLost > 0 ? "-" : ""}
                      {Math.abs(totalWeightLost).toFixed(1)}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">lbs</p>
              </div>
            </div>

            {/* Goal Progress Bar */}
            {profile.goal_weight_lbs && progressToGoal !== null && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Goal Progress</span>
                  <span className="font-medium">{progressToGoal.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green to-lime transition-all duration-500 progress-shimmer"
                    style={{ width: `${progressToGoal}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {profile.goal_weight_lbs} lbs goal
                </p>
              </div>
            )}

            {/* All-Time Stats */}
            {allTimeStats && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                    <Dumbbell className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatNumber(allTimeStats.workout_days)}</p>
                    <p className="text-xs text-muted-foreground">Workout Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                    <Utensils className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatNumber(allTimeStats.diet_days)}</p>
                    <p className="text-xs text-muted-foreground">Diet Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                    <Flame className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatNumber(allTimeStats.total_protein)}</p>
                    <p className="text-xs text-muted-foreground">Total Protein (g)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatNumber(allTimeStats.total_calories)}</p>
                    <p className="text-xs text-muted-foreground">Total Calories</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Snapshots */}
      {user && (monthSnapshot || yearSnapshot) && (
        <div className="mb-6 space-y-4">
          <h2 className="headline text-xl font-semibold">Stats Snapshot</h2>

          {/* This Month */}
          {monthSnapshot && (
            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Dumbbell className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-muted-foreground">Workouts</span>
                    </div>
                    <p className="text-2xl font-bold">{monthSnapshot.workoutDays}</p>
                  </div>
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Utensils className="h-4 w-4 text-orange-400" />
                      <span className="text-xs text-muted-foreground">Diet Days</span>
                    </div>
                    <p className="text-2xl font-bold">{monthSnapshot.dietDays}</p>
                  </div>
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-muted-foreground">Avg Protein</span>
                    </div>
                    <p className="text-2xl font-bold">{monthSnapshot.avgProtein}g</p>
                  </div>
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Weight</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      monthSnapshot.weightChange?.startsWith("-") ? "text-primary" : ""
                    }`}>
                      {monthSnapshot.weightChange ?? "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Year */}
          {yearSnapshot && (
            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-4 w-4" />
                  Past 365 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Dumbbell className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-muted-foreground">Workouts</span>
                    </div>
                    <p className="text-2xl font-bold">{yearSnapshot.workoutDays}</p>
                  </div>
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Utensils className="h-4 w-4 text-orange-400" />
                      <span className="text-xs text-muted-foreground">Diet Days</span>
                    </div>
                    <p className="text-2xl font-bold">{yearSnapshot.dietDays}</p>
                  </div>
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-muted-foreground">Total Protein</span>
                    </div>
                    <p className="text-xl font-bold">{formatNumber(yearSnapshot.totalProtein)}g</p>
                  </div>
                  <div className="rounded-lg bg-surface2 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Weight</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      yearSnapshot.weightChange?.startsWith("-") ? "text-primary" : ""
                    }`}>
                      {yearSnapshot.weightChange ?? "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Monthly Breakdown */}
      {user && monthlyBreakdown.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Monthly Breakdown
            </CardTitle>
            {monthlyBreakdown.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMonths(!showAllMonths)}
                className="text-xs"
              >
                {showAllMonths ? (
                  <>
                    Show Less <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show All <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(showAllMonths ? monthlyBreakdown : monthlyBreakdown.slice(0, 3)).map((month, idx) => {
                const weightDelta =
                  month.start_weight && month.end_weight
                    ? month.start_weight - month.end_weight
                    : null
                const avgProtein =
                  month.days_with_protein > 0
                    ? Math.round(month.total_protein / month.days_with_protein)
                    : 0
                const avgCalories =
                  month.days_with_calories > 0
                    ? Math.round(month.total_calories / month.days_with_calories)
                    : 0

                return (
                  <div
                    key={month.month_start}
                    className={`rounded-xl bg-surface2 p-3 transition-all duration-300 ${
                      idx === 0 ? "ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{month.month_label}</span>
                      {weightDelta !== null && (
                        <span
                          className={`flex items-center gap-1 text-sm font-medium ${
                            weightDelta > 0
                              ? "text-primary"
                              : weightDelta < 0
                              ? "text-orange-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {weightDelta > 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : weightDelta < 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : null}
                          {weightDelta !== 0
                            ? `${weightDelta > 0 ? "-" : "+"}${Math.abs(weightDelta).toFixed(1)} lbs`
                            : "—"}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{month.workout_days}</p>
                        <p className="text-xs text-muted-foreground">Workouts</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{month.diet_days}</p>
                        <p className="text-xs text-muted-foreground">Diet Days</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{avgProtein}g</p>
                        <p className="text-xs text-muted-foreground">Avg Protein</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{formatNumber(avgCalories)}</p>
                        <p className="text-xs text-muted-foreground">Avg Cal</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Install App */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5" />
            Install App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add Lift to your home screen for quick access and offline support.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/install">
              <Download className="mr-2 h-4 w-4" />
              Install Lift
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">App</span>
            <span className="font-medium">Lift</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Schedule</span>
            <span className="font-medium">2 on / 1 off</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Protein Target</span>
            <span className="font-medium">220g</span>
          </div>
        </CardContent>
      </Card>

      {/* Training Philosophy */}
      <div className="mt-6 rounded-xl bg-surface2 p-4">
        <h3 className="font-semibold mb-2">Training Philosophy</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Lift heavy enough to stimulate muscle</li>
          <li>• Use machines liberally (they&apos;re not cheating)</li>
          <li>• Train 60-75 minutes max</li>
          <li>• Progress slowly but consistently</li>
          <li>• Leave 1-2 reps in reserve (RIR)</li>
        </ul>
      </div>
    </div>
  )
}
