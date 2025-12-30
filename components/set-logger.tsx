"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Check,
  Minus,
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  logSet,
  updateSet,
  getSessionSets,
  getSuggestedWeight,
  type SetLog,
  type ProgressionSuggestion,
} from "@/lib/workout-helpers"

export interface SetData {
  id?: string
  setNumber: number
  weight: number
  reps: number
  rir: number | null
  completed: boolean
  saving?: boolean
}

interface SetLoggerProps {
  sessionId: string
  exerciseId: string
  userId: string
  targetSets: number
  repMin: number
  repMax: number
  startWeight: number | null
  incrementLbs: number
  onAllSetsCompleted?: (completed: boolean) => void
  compact?: boolean
}

export function SetLogger({
  sessionId,
  exerciseId,
  userId,
  targetSets,
  repMin,
  repMax,
  startWeight,
  incrementLbs,
  onAllSetsCompleted,
  compact = false,
}: SetLoggerProps) {
  const [sets, setSets] = useState<SetData[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load existing sets
      const existingSets = await getSessionSets(sessionId, exerciseId)

      // Load progression suggestion
      const prog = await getSuggestedWeight(
        userId,
        exerciseId,
        repMin,
        repMax,
        incrementLbs,
        startWeight || 0
      )
      setSuggestion(prog)

      if (existingSets.length > 0) {
        // Convert existing sets
        setSets(
          existingSets.map((s) => ({
            id: s.id,
            setNumber: s.set_number,
            weight: s.weight_lbs,
            reps: s.reps,
            rir: s.rir,
            completed: true,
          }))
        )
        setExpanded(true)
      } else {
        // Initialize empty sets
        const weight = prog.suggestedWeight || startWeight || 0
        const initialSets: SetData[] = Array.from({ length: targetSets }, (_, i) => ({
          setNumber: i + 1,
          weight,
          reps: repMin,
          rir: null,
          completed: false,
        }))
        setSets(initialSets)
      }
    } catch (err) {
      console.error("Error loading sets:", err)
    } finally {
      setLoading(false)
    }
  }, [sessionId, exerciseId, userId, targetSets, repMin, repMax, startWeight, incrementLbs])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Notify parent when all sets are completed
  useEffect(() => {
    const allCompleted = sets.length > 0 && sets.every((s) => s.completed)
    onAllSetsCompleted?.(allCompleted)
  }, [sets, onAllSetsCompleted])

  const updateLocalSet = (index: number, updates: Partial<SetData>) => {
    setSets((prev) => {
      const newSets = [...prev]
      newSets[index] = { ...newSets[index], ...updates }
      return newSets
    })
  }

  const incrementValue = (index: number, field: "weight" | "reps", delta: number) => {
    const set = sets[index]
    if (!set || set.completed) return

    const step = field === "weight" ? incrementLbs : 1
    const newVal = Math.max(0, set[field] + delta * step)
    updateLocalSet(index, { [field]: newVal })
  }

  const handleCompleteSet = async (index: number) => {
    const set = sets[index]
    if (!set) return

    // If already completed, just toggle off (don't delete)
    if (set.completed) {
      updateLocalSet(index, { completed: false })
      return
    }

    // Mark as saving
    updateLocalSet(index, { saving: true })

    try {
      if (set.id) {
        // Update existing set
        await updateSet(set.id, {
          weight_lbs: set.weight,
          reps: set.reps,
          rir: set.rir,
        })
        updateLocalSet(index, { completed: true, saving: false })
      } else {
        // Create new set
        const id = await logSet({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: set.setNumber,
          weight_lbs: set.weight,
          reps: set.reps,
          rir: set.rir,
          is_warmup: false,
        })

        if (id) {
          updateLocalSet(index, { id, completed: true, saving: false })
        } else {
          updateLocalSet(index, { saving: false })
        }
      }
    } catch (err) {
      console.error("Error saving set:", err)
      updateLocalSet(index, { saving: false })
    }
  }

  const completedCount = sets.filter((s) => s.completed).length
  const allCompleted = completedCount === sets.length && sets.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Compact mode - just show a summary button
  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between rounded-lg bg-surface2 p-3 text-left transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          {suggestion && (
            <div className={cn(
              "flex items-center gap-1.5 text-sm",
              suggestion.status === "increase" && "text-primary",
              suggestion.status === "decrease" && "text-orange-400",
              suggestion.status === "maintain" && "text-muted-foreground"
            )}>
              {suggestion.status === "increase" && <TrendingUp className="h-4 w-4" />}
              {suggestion.status === "decrease" && <TrendingDown className="h-4 w-4" />}
              <span className="font-semibold">{suggestion.suggestedWeight} lb</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {completedCount}/{sets.length} sets
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progression suggestion banner */}
      {suggestion && (
        <div className={cn(
          "flex items-center justify-between rounded-lg p-3",
          suggestion.status === "increase" && "bg-primary/10 border border-primary/30",
          suggestion.status === "decrease" && "bg-orange-500/10 border border-orange-500/30",
          suggestion.status === "maintain" && "bg-surface2"
        )}>
          <div className="flex items-center gap-2">
            {suggestion.status === "increase" && <TrendingUp className="h-5 w-5 text-primary" />}
            {suggestion.status === "decrease" && <TrendingDown className="h-5 w-5 text-orange-400" />}
            {suggestion.status === "maintain" && <Minus className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="font-semibold">{suggestion.suggestedWeight} lb</p>
              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            </div>
          </div>
          {compact && (
            <button onClick={() => setExpanded(false)} className="p-1 hover:bg-background/50 rounded">
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Header row */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-2">
        <div className="w-8 text-center">Set</div>
        <div className="text-center">Weight</div>
        <div className="text-center">Reps</div>
        <div className="w-20 text-center">RIR</div>
        <div className="w-10"></div>
      </div>

      {/* Set rows */}
      {sets.map((set, idx) => (
        <div
          key={set.setNumber}
          className={cn(
            "grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-2 rounded-lg p-2 transition-all",
            set.completed
              ? "bg-primary/10 border border-primary/30"
              : "bg-surface2"
          )}
        >
          {/* Set number */}
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
            set.completed ? "bg-primary text-primary-foreground" : "bg-background"
          )}>
            {set.completed ? <Check className="h-4 w-4" /> : set.setNumber}
          </div>

          {/* Weight input with +/- */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => incrementValue(idx, "weight", -1)}
              disabled={set.completed}
              className="h-8 w-8 rounded bg-background flex items-center justify-center hover:bg-muted disabled:opacity-50"
            >
              <Minus className="h-3 w-3" />
            </button>
            <Input
              type="number"
              value={set.weight || ""}
              onChange={(e) => updateLocalSet(idx, { weight: parseFloat(e.target.value) || 0 })}
              className="h-8 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              disabled={set.completed}
            />
            <button
              onClick={() => incrementValue(idx, "weight", 1)}
              disabled={set.completed}
              className="h-8 w-8 rounded bg-background flex items-center justify-center hover:bg-muted disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Reps input with +/- */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => incrementValue(idx, "reps", -1)}
              disabled={set.completed}
              className="h-8 w-8 rounded bg-background flex items-center justify-center hover:bg-muted disabled:opacity-50"
            >
              <Minus className="h-3 w-3" />
            </button>
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) => updateLocalSet(idx, { reps: parseInt(e.target.value) || 0 })}
              className="h-8 w-12 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              disabled={set.completed}
            />
            <button
              onClick={() => incrementValue(idx, "reps", 1)}
              disabled={set.completed}
              className="h-8 w-8 rounded bg-background flex items-center justify-center hover:bg-muted disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* RIR buttons */}
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((rir) => (
              <button
                key={rir}
                onClick={() => updateLocalSet(idx, { rir: set.rir === rir ? null : rir })}
                disabled={set.completed}
                className={cn(
                  "h-8 w-8 rounded text-xs font-medium transition-colors",
                  set.rir === rir
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted",
                  set.completed && "opacity-50"
                )}
              >
                {rir}
              </button>
            ))}
          </div>

          {/* Complete button */}
          <Button
            variant={set.completed ? "default" : "outline"}
            size="sm"
            onClick={() => handleCompleteSet(idx)}
            disabled={set.saving}
            className={cn("w-10 h-8", set.completed && "bg-primary")}
          >
            {set.saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}

      {/* Summary when all complete */}
      {allCompleted && (
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-center animate-scale-in">
          <p className="text-sm font-medium text-primary">
            All {sets.length} sets logged!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Avg: {Math.round(sets.reduce((sum, s) => sum + s.reps, 0) / sets.length)} reps @ {sets[0]?.weight} lb
          </p>
        </div>
      )}
    </div>
  )
}
