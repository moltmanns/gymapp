"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProgressRing } from "@/components/ui/progress-ring"
import { MiniChart } from "@/components/ui/mini-chart"
import {
  Apple,
  Target,
  Footprints,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Flame,
  Check,
  RefreshCw,
  Smartphone,
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from "recharts"
import type { DietLog } from "@/lib/database.types"

interface ChartData {
  date: string
  protein: number
  label: string
  hitTarget: boolean
}

// Extend Window interface for Sensor APIs
declare global {
  interface Window {
    Pedometer?: new (options?: { frequency: number }) => {
      addEventListener: (event: string, callback: (e: { steps: number }) => void) => void
      start: () => void
      stop: () => void
    }
  }
}

export default function DietPage() {
  const [logs, setLogs] = useState<DietLog[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)

  // Form state
  const [protein, setProtein] = useState("")
  const [calories, setCalories] = useState("")
  const [steps, setSteps] = useState("")
  const [notes, setNotes] = useState("")

  // Step sync state
  const [stepSyncSupported, setStepSyncSupported] = useState(false)
  const [syncingSteps, setSyncingSteps] = useState(false)
  const [stepSyncError, setStepSyncError] = useState<string | null>(null)

  // Daily target
  const proteinTarget = 220

  // Check if step sensor is available
  useEffect(() => {
    const checkStepSensor = async () => {
      // Check for Pedometer API (experimental)
      if ("Pedometer" in window) {
        setStepSyncSupported(true)
        return
      }

      // Check for Generic Sensor API with motion permissions
      if ("permissions" in navigator && navigator.permissions) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (navigator.permissions as any).query({ name: "accelerometer" })
          if (result.state === "granted" || result.state === "prompt") {
            setStepSyncSupported(true)
          }
        } catch {
          // Permission query not supported for this sensor
        }
      }
    }

    checkStepSensor()
  }, [])

  // Function to sync steps from device
  const syncStepsFromDevice = useCallback(async () => {
    setSyncingSteps(true)
    setStepSyncError(null)

    try {
      // Try Pedometer API first (Chrome Android with flag)
      if ("Pedometer" in window && window.Pedometer) {
        const pedometer = new window.Pedometer({ frequency: 1 })

        return new Promise<void>((resolve) => {
          pedometer.addEventListener("reading", (e: { steps: number }) => {
            setSteps(e.steps.toString())
            pedometer.stop()
            resolve()
          })
          pedometer.start()

          // Timeout after 3 seconds
          setTimeout(() => {
            pedometer.stop()
            resolve()
          }, 3000)
        })
      }

      // If no sensor API available, show helpful message
      setStepSyncError(
        "Step sync requires a supported device. Try entering steps manually from your health app."
      )
    } catch (err) {
      console.error("Step sync error:", err)
      setStepSyncError("Could not access step sensor. Please enter steps manually.")
    } finally {
      setSyncingSteps(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("diet_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(30)

      const logsData = (data || []) as DietLog[]
      setLogs(logsData)

      // Generate chart data (reverse for chronological order)
      const chart = logsData
        .slice(0, 14)
        .reverse()
        .map((log) => ({
          date: log.logged_at,
          protein: log.protein_g,
          label: new Date(log.logged_at + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "short",
          }).slice(0, 2),
          hitTarget: log.protein_g >= proteinTarget,
        }))
      setChartData(chart)
    } catch (err) {
      console.error("Error loading logs:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!protein) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please sign in to log diet")
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("diet_logs") as any).upsert(
        {
          user_id: user.id,
          logged_at: new Date().toISOString().split("T")[0],
          protein_g: parseInt(protein),
          calories: calories ? parseInt(calories) : null,
          steps: steps ? parseInt(steps) : null,
          notes: notes || null,
        },
        { onConflict: "user_id,logged_at" }
      )

      if (error) throw error

      // Reset and reload
      setProtein("")
      setCalories("")
      setSteps("")
      setNotes("")
      await loadLogs()
    } catch (err) {
      console.error("Error saving:", err)
      alert("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const todayLog = logs[0]
  const todayProtein = todayLog?.protein_g || 0
  const proteinProgress = Math.min((todayProtein / proteinTarget) * 100, 100)
  const targetHit = todayProtein >= proteinTarget

  // Calculate stats
  const avgProtein = logs.length > 0
    ? Math.round(logs.reduce((sum, log) => sum + log.protein_g, 0) / logs.length)
    : 0
  const daysHitTarget = logs.filter(log => log.protein_g >= proteinTarget).length
  const hitRate = logs.length > 0 ? Math.round((daysHitTarget / logs.length) * 100) : 0

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const miniChartData = chartData.map(d => ({ value: d.protein }))

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
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="headline text-3xl font-bold">Diet Log</h1>
        <p className="text-muted-foreground">Protein-first tracking</p>
      </div>

      {/* Today's Progress - Hero Card */}
      <Card className={`mb-6 animate-scale-in ${targetHit ? 'card-glow glow-green' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Today's Protein</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold headline">{todayProtein}</span>
                <span className="text-lg text-muted-foreground">/ {proteinTarget}g</span>
              </div>
              {targetHit && (
                <div className="flex items-center gap-1 mt-2 text-primary text-sm">
                  <Check className="h-4 w-4" />
                  Target reached!
                </div>
              )}
            </div>
            <ProgressRing
              progress={proteinProgress}
              size={80}
              strokeWidth={6}
              showGlow={targetHit}
            >
              <div className="text-center">
                <span className="text-lg font-bold headline">{Math.round(proteinProgress)}%</span>
              </div>
            </ProgressRing>
          </div>

          {/* Animated Progress bar */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface2">
            <div
              className={`h-full bg-gradient-to-r from-green to-lime transition-all duration-700 ease-out ${targetHit ? 'progress-shimmer' : ''}`}
              style={{ width: `${proteinProgress}%` }}
            />
            {/* Target line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
              style={{ left: '100%', transform: 'translateX(-1px)' }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {targetHit
              ? `+${todayProtein - proteinTarget}g over target`
              : `${proteinTarget - todayProtein}g remaining`}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        {/* Calories */}
        <Card className="stat-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Cal</span>
            </div>
            <p className="text-xl font-bold">
              {todayLog?.calories || "—"}
            </p>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="stat-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <Footprints className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Steps</span>
            </div>
            <p className="text-xl font-bold">
              {todayLog?.steps ? (todayLog.steps / 1000).toFixed(1) + "k" : "—"}
            </p>
          </CardContent>
        </Card>

        {/* Average */}
        <Card className="stat-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Avg</span>
            </div>
            <p className="text-xl font-bold">{avgProtein}g</p>
          </CardContent>
        </Card>
      </div>

      {/* Protein Chart */}
      {chartData.length >= 3 && (
        <Card className="mb-6 animate-fade-in-up">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Protein History
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">{hitRate}%</span> hit rate
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.60 0.01 260)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.60 0.01 260)', fontSize: 11 }}
                    domain={[0, 'dataMax + 20']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.18 0.005 260)',
                      border: '1px solid oklch(0.28 0.005 260)',
                      borderRadius: '8px',
                      color: 'oklch(0.93 0.01 260)',
                    }}
                    formatter={(value) => [`${value}g`, 'Protein']}
                  />
                  <ReferenceLine
                    y={proteinTarget}
                    stroke="oklch(0.65 0.2 145)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Bar
                    dataKey="protein"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hitTarget ? 'oklch(0.65 0.2 145)' : 'oklch(0.35 0.01 260)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Mini stats under chart */}
            <div className="flex justify-between mt-4 pt-4 border-t border-border text-sm">
              <div className="text-muted-foreground">
                <span className="text-foreground font-medium">{daysHitTarget}</span> days at target
              </div>
              <div className="text-muted-foreground">
                <span className="text-foreground font-medium">{logs.length}</span> days tracked
              </div>
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
              <Label htmlFor="protein">Protein (g) *</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="Enter protein grams"
                className="mt-1 text-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="steps" className="flex items-center justify-between">
                  <span>Steps</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={syncStepsFromDevice}
                    disabled={syncingSteps}
                    className="h-6 px-2 text-xs text-primary hover:text-primary"
                  >
                    {syncingSteps ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Smartphone className="h-3 w-3 mr-1" />
                    )}
                    {syncingSteps ? "Syncing..." : "Sync"}
                  </Button>
                </Label>
                <Input
                  id="steps"
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="From health app"
                  className="mt-1"
                />
                {stepSyncError && (
                  <p className="text-xs text-muted-foreground mt-1">{stepSyncError}</p>
                )}
              </div>
            </div>

            {/* Step Sync Instructions Card (shown when no steps entered) */}
            {!steps && !stepSyncError && (
              <div className="rounded-lg bg-surface2 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Footprints className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Quick Step Entry</p>
                    <p>
                      Check your phone&apos;s health app (Apple Health, Google Fit, Samsung Health)
                      and enter today&apos;s step count above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you eat?"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full glow-pulse"
              disabled={saving || !protein}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Saving...
                </span>
              ) : (
                "Log Diet"
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
              <Apple className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No entries yet. Log your first meal above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(showAllLogs ? logs : logs.slice(0, 5)).map((log) => {
                const hitTarget = log.protein_g >= proteinTarget

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl bg-surface2 p-3 transition-all duration-300 hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        hitTarget ? 'bg-primary/20' : 'bg-background'
                      }`}>
                        {hitTarget ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : (
                          <span className="text-sm font-bold">{log.protein_g}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {log.protein_g}g protein
                          {hitTarget && (
                            <span className="ml-2 text-xs text-primary">Target!</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(log.logged_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground space-y-0.5">
                      {log.calories && <div>{log.calories} cal</div>}
                      {log.steps && <div>{(log.steps / 1000).toFixed(1)}k steps</div>}
                    </div>
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
