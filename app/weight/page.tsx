"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MiniChart } from "@/components/ui/mini-chart"
import { ProgressRing } from "@/components/ui/progress-ring"
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Target,
  ChevronDown,
  ChevronUp,
  Flag,
} from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Label as RechartsLabel } from "recharts"
import type { BodyweightLog, UserProfile } from "@/lib/database.types"
import { getLocalDateDaysAgo } from "@/lib/date-utils"

interface ChartData {
  date: string
  weight: number
  label: string
}

type TimeRange = "week" | "month" | "year" | "all"

export default function WeightPage() {
  const [logs, setLogs] = useState<BodyweightLog[]>([])
  const [allLogs, setAllLogs] = useState<BodyweightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form state
  const [weight, setWeight] = useState("")
  const [waist, setWaist] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    loadLogs()
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("user_profile")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setProfile(data)
      }
    } catch {
      // No profile yet
    }
  }

  async function loadLogs() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load all logs for chart
      const { data: allData } = await supabase
        .from("bodyweight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(500)

      const allLogsData = (allData || []) as BodyweightLog[]
      setAllLogs(allLogsData)

      // Load recent logs for display
      const { data } = await supabase
        .from("bodyweight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(30)

      const logsData = (data || []) as BodyweightLog[]
      setLogs(logsData)

      // Pre-fill with last entry if exists
      if (logsData.length > 0) {
        setWeight(logsData[0].weight_lbs.toString())
      }
    } catch (err) {
      console.error("Error loading logs:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter logs based on time range
  const filteredLogs = useMemo(() => {
    if (allLogs.length === 0) return []

    let cutoffDate: string

    switch (timeRange) {
      case "week":
        cutoffDate = getLocalDateDaysAgo(7)
        break
      case "month":
        cutoffDate = getLocalDateDaysAgo(30)
        break
      case "year":
        cutoffDate = getLocalDateDaysAgo(365)
        break
      case "all":
      default:
        return allLogs
    }

    return allLogs.filter(log => log.logged_at >= cutoffDate)
  }, [allLogs, timeRange])

  // Generate chart data from filtered logs
  const chartData = useMemo(() => {
    return filteredLogs
      .slice()
      .reverse()
      .map((log) => ({
        date: log.logged_at,
        weight: log.weight_lbs,
        label: new Date(log.logged_at + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
  }, [filteredLogs])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please sign in to log weight")
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("bodyweight_logs") as any).upsert(
        {
          user_id: user.id,
          logged_at: new Date().toISOString().split("T")[0],
          weight_lbs: parseFloat(weight),
          waist_in: waist ? parseFloat(waist) : null,
          notes: notes || null,
        },
        { onConflict: "user_id,logged_at" }
      )

      if (error) throw error

      // Reset and reload
      setNotes("")
      await loadLogs()
    } catch (err) {
      console.error("Error saving:", err)
      alert("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const latestWeight = logs[0]?.weight_lbs
  const previousWeight = logs[1]?.weight_lbs
  const weightDiff = latestWeight && previousWeight
    ? latestWeight - previousWeight
    : null

  // Calculate stats based on time range
  const rangeStats = useMemo(() => {
    if (filteredLogs.length < 2) return null

    const firstInRange = filteredLogs[filteredLogs.length - 1]?.weight_lbs
    const lastInRange = filteredLogs[0]?.weight_lbs

    if (!firstInRange || !lastInRange) return null

    return {
      change: lastInRange - firstInRange,
      startWeight: firstInRange,
      endWeight: lastInRange,
      logsCount: filteredLogs.length,
    }
  }, [filteredLogs])

  // Calculate stats
  const weekAgoWeight = logs.find((_, idx) => idx >= 6)?.weight_lbs
  const weeklyChange = latestWeight && weekAgoWeight
    ? latestWeight - weekAgoWeight
    : null

  const highestWeight = filteredLogs.length > 0 ? Math.max(...filteredLogs.map(l => l.weight_lbs)) : null
  const lowestWeight = filteredLogs.length > 0 ? Math.min(...filteredLogs.map(l => l.weight_lbs)) : null

  // Total weight lost from starting
  const totalLost = profile && latestWeight
    ? profile.starting_weight_lbs - latestWeight
    : null

  // Progress to goal
  const progressToGoal = profile?.goal_weight_lbs && latestWeight && profile.starting_weight_lbs
    ? Math.min(
        100,
        Math.max(
          0,
          ((profile.starting_weight_lbs - latestWeight) /
            (profile.starting_weight_lbs - profile.goal_weight_lbs)) *
            100
        )
      )
    : null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const miniChartData = chartData.slice(-14).map(d => ({ value: d.weight }))

  const timeRangeLabels: Record<TimeRange, string> = {
    week: "7D",
    month: "30D",
    year: "1Y",
    all: "All",
  }

  // Calculate Y-axis domain based on data + starting weight + goal
  const yAxisDomain = useMemo(() => {
    const weights = chartData.map(d => d.weight)
    if (profile) {
      weights.push(profile.starting_weight_lbs)
      if (profile.goal_weight_lbs) {
        weights.push(profile.goal_weight_lbs)
      }
    }
    if (weights.length === 0) return [0, 100]
    const min = Math.min(...weights)
    const max = Math.max(...weights)
    const padding = (max - min) * 0.1 || 10
    return [Math.floor(min - padding), Math.ceil(max + padding)]
  }, [chartData, profile])

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
      {/* Header with Starting Weight */}
      <div className="mb-4 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="headline text-3xl font-bold">Weight</h1>
            <p className="text-muted-foreground">Track your progress</p>
          </div>
          {profile && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Started at</p>
              <p className="text-2xl font-bold headline">{profile.starting_weight_lbs}</p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Progress Chart - Hero Section */}
      <Card className="mb-6 overflow-hidden animate-scale-in">
        <CardContent className="p-0">
          {/* Chart Header with Stats */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              {/* Current Weight + Change */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold headline">{latestWeight ?? "—"}</span>
                  <span className="text-muted-foreground">lbs</span>
                </div>
                {totalLost !== null && totalLost > 0 && (
                  <div className="flex items-center gap-1 text-primary text-sm mt-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-semibold">-{totalLost.toFixed(1)} lbs total</span>
                  </div>
                )}
              </div>

              {/* Goal Progress Ring */}
              {progressToGoal !== null && (
                <div className="text-center">
                  <ProgressRing
                    progress={progressToGoal}
                    size={64}
                    strokeWidth={5}
                    showGlow={progressToGoal >= 100}
                  >
                    <div className="text-center">
                      <span className="text-sm font-bold">{Math.round(progressToGoal)}%</span>
                    </div>
                  </ProgressRing>
                  <p className="text-xs text-muted-foreground mt-1">to goal</p>
                </div>
              )}
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-1 bg-surface2 rounded-lg p-1">
              {(["week", "month", "year", "all"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 text-xs h-8 ${
                    timeRange === range
                      ? "bg-primary text-primary-foreground hover:bg-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                >
                  {timeRangeLabels[range]}
                </Button>
              ))}
            </div>
          </div>

          {/* The Chart */}
          {chartData.length >= 2 ? (
            <div className="h-64 w-full px-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="oklch(0.65 0.2 145)" />
                      <stop offset="100%" stopColor="oklch(0.70 0.15 230)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.25 0.005 260)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.50 0.01 260)', fontSize: 10 }}
                    interval="preserveStartEnd"
                    dy={10}
                  />
                  <YAxis
                    domain={yAxisDomain}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.50 0.01 260)', fontSize: 10 }}
                    tickFormatter={(value) => `${value}`}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.18 0.005 260)',
                      border: '1px solid oklch(0.28 0.005 260)',
                      borderRadius: '8px',
                      color: 'oklch(0.93 0.01 260)',
                    }}
                    labelFormatter={(label) => label}
                    formatter={(value) => [`${value} lbs`, 'Weight']}
                  />
                  {/* Starting weight reference line */}
                  {profile && (
                    <ReferenceLine
                      y={profile.starting_weight_lbs}
                      stroke="oklch(0.50 0.01 260)"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Start: ${profile.starting_weight_lbs}`,
                        position: "insideTopRight",
                        fill: "oklch(0.60 0.01 260)",
                        fontSize: 10,
                      }}
                    />
                  )}
                  {/* Goal weight reference line */}
                  {profile?.goal_weight_lbs && (
                    <ReferenceLine
                      y={profile.goal_weight_lbs}
                      stroke="oklch(0.65 0.2 145)"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Goal: ${profile.goal_weight_lbs}`,
                        position: "insideBottomRight",
                        fill: "oklch(0.65 0.2 145)",
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={chartData.length <= 30 ? { fill: 'oklch(0.70 0.15 230)', strokeWidth: 0, r: 3 } : false}
                    activeDot={{ fill: 'oklch(0.85 0.2 125)', strokeWidth: 0, r: 6 }}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>Log at least 2 entries to see your progress chart</p>
            </div>
          )}

          {/* Chart Footer Stats */}
          <div className="p-4 pt-2 border-t border-border">
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Range Change</p>
                <p className={`font-semibold ${
                  rangeStats?.change && rangeStats.change < 0 ? "text-primary" :
                  rangeStats?.change && rangeStats.change > 0 ? "text-orange-400" : "text-muted-foreground"
                }`}>
                  {rangeStats ? `${rangeStats.change > 0 ? "+" : ""}${rangeStats.change.toFixed(1)} lbs` : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Lowest</p>
                <p className="font-semibold">{lowestWeight ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Highest</p>
                <p className="font-semibold">{highestWeight ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Entries</p>
                <p className="font-semibold">{chartData.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      {latestWeight && (
        <div className="mb-6 grid grid-cols-2 gap-3 stagger-children">
          {/* Current vs Last */}
          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">vs Last</p>
                  <p className="text-2xl font-bold">
                    {weightDiff !== null ? (
                      <span className={weightDiff < 0 ? "text-primary" : weightDiff > 0 ? "text-orange-400" : ""}>
                        {weightDiff === 0 ? "—" : `${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)}`}
                      </span>
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">lbs</p>
                </div>
                {weightDiff !== null && weightDiff !== 0 && (
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    weightDiff < 0 ? "bg-primary/20" : "bg-orange-500/20"
                  }`}>
                    {weightDiff < 0 ? (
                      <TrendingDown className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-orange-400" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Change */}
          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">7-Day</p>
                  <p className="text-2xl font-bold">
                    {weeklyChange !== null ? (
                      <span className={weeklyChange < 0 ? "text-primary" : weeklyChange > 0 ? "text-orange-400" : ""}>
                        {weeklyChange === 0 ? "—" : `${weeklyChange > 0 ? "+" : ""}${weeklyChange.toFixed(1)}`}
                      </span>
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">lbs</p>
                </div>
                <div className="w-16">
                  <MiniChart data={miniChartData} height={32} color={weeklyChange && weeklyChange < 0 ? "green" : "blue"} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Progress Bar (if goal exists) */}
      {profile?.goal_weight_lbs && latestWeight && (
        <Card className="mb-6 card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Goal Progress</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {profile.goal_weight_lbs} lbs target
              </span>
            </div>
            <div className="relative">
              <div className="h-4 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green to-lime transition-all duration-700 progress-shimmer"
                  style={{ width: `${progressToGoal ?? 0}%` }}
                />
              </div>
              {/* Milestone markers */}
              <div className="absolute top-0 left-1/4 h-4 w-0.5 bg-border/50" />
              <div className="absolute top-0 left-1/2 h-4 w-0.5 bg-border/50" />
              <div className="absolute top-0 left-3/4 h-4 w-0.5 bg-border/50" />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{profile.starting_weight_lbs}</span>
              <span className="text-primary font-medium">{latestWeight} now</span>
              <span className="text-primary">{profile.goal_weight_lbs}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Form */}
      <Card className="mb-6 card-glow animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-lg">Log Today</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="weight">Weight (lbs) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="mt-1 text-lg"
                required
              />
            </div>

            <div>
              <Label htmlFor="waist">Waist (inches)</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="Optional"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How do you feel?"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full glow-pulse"
              disabled={saving || !weight}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Saving...
                </span>
              ) : (
                "Log Weight"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Entries</CardTitle>
          {logs.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="text-xs"
            >
              {showAllLogs ? (
                <>Show Less <ChevronUp className="ml-1 h-3 w-3" /></>
              ) : (
                <>Show All <ChevronDown className="ml-1 h-3 w-3" /></>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No entries yet. Log your first weight above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(showAllLogs ? logs : logs.slice(0, 5)).map((log, idx) => {
                const prevLog = logs[idx + 1]
                const diff = prevLog ? log.weight_lbs - prevLog.weight_lbs : null

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl bg-surface2 p-3 transition-all duration-300 hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                        <span className="text-sm font-bold">{log.weight_lbs}</span>
                      </div>
                      <div>
                        <p className="font-medium">{formatDate(log.logged_at)}</p>
                        {log.waist_in && (
                          <p className="text-xs text-muted-foreground">
                            {log.waist_in}" waist
                          </p>
                        )}
                      </div>
                    </div>
                    {diff !== null && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        diff < 0 ? "text-primary" : diff > 0 ? "text-orange-400" : "text-muted-foreground"
                      }`}>
                        {diff < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : diff > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {diff !== 0 && `${Math.abs(diff).toFixed(1)}`}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
