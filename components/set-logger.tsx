"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SetData {
  setNumber: number
  weight: number
  reps: number
  rir: number | null
  completed: boolean
}

interface SetLoggerProps {
  sets: SetData[]
  onChange: (sets: SetData[]) => void
  startWeight?: number | null
  repMin: number
  repMax: number
}

export function SetLogger({
  sets,
  onChange,
  startWeight,
  repMin,
  repMax,
}: SetLoggerProps) {
  const updateSet = (index: number, updates: Partial<SetData>) => {
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], ...updates }
    onChange(newSets)
  }

  const incrementValue = (
    index: number,
    field: "weight" | "reps",
    delta: number
  ) => {
    const currentVal = sets[index][field]
    const step = field === "weight" ? 5 : 1
    const newVal = Math.max(0, currentVal + delta * step)
    updateSet(index, { [field]: newVal })
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
        <div className="w-8 text-center">Set</div>
        <div className="text-center">Weight</div>
        <div className="text-center">Reps</div>
        <div className="text-center">RIR</div>
        <div className="w-10"></div>
      </div>

      {/* Set rows */}
      {sets.map((set, idx) => (
        <div
          key={set.setNumber}
          className={cn(
            "grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2 rounded-lg p-2 transition-colors",
            set.completed
              ? "bg-primary/10 border border-primary/30"
              : "bg-surface2"
          )}
        >
          {/* Set number */}
          <div className="w-8 text-center text-sm font-semibold">
            {set.setNumber}
          </div>

          {/* Weight input with +/- */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => incrementValue(idx, "weight", -1)}
              disabled={set.completed}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={set.weight || ""}
              onChange={(e) =>
                updateSet(idx, { weight: parseFloat(e.target.value) || 0 })
              }
              className="h-9 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder={startWeight?.toString() || "0"}
              disabled={set.completed}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => incrementValue(idx, "weight", 1)}
              disabled={set.completed}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Reps input with +/- */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => incrementValue(idx, "reps", -1)}
              disabled={set.completed}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) =>
                updateSet(idx, { reps: parseInt(e.target.value) || 0 })
              }
              className="h-9 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder={`${repMin}-${repMax}`}
              disabled={set.completed}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => incrementValue(idx, "reps", 1)}
              disabled={set.completed}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* RIR select */}
          <select
            value={set.rir ?? ""}
            onChange={(e) =>
              updateSet(idx, {
                rir: e.target.value === "" ? null : parseInt(e.target.value),
              })
            }
            className="h-9 rounded-md border border-border bg-input px-2 text-sm text-center"
            disabled={set.completed}
          >
            <option value="">-</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          {/* Complete button */}
          <Button
            type="button"
            variant={set.completed ? "default" : "outline"}
            size="icon-sm"
            onClick={() => updateSet(idx, { completed: !set.completed })}
            className={cn(set.completed && "bg-primary text-primary-foreground")}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
