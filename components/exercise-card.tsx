"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Timer, Info } from "lucide-react"
import type { TemplateItemWithExercise } from "@/lib/database.types"

interface ExerciseCardProps {
  item: TemplateItemWithExercise
  exerciseIndex: number
  onRestTimer: (seconds: number) => void
  children?: React.ReactNode
}

export function ExerciseCard({
  item,
  exerciseIndex,
  onRestTimer,
  children,
}: ExerciseCardProps) {
  const [showCues, setShowCues] = useState(false)
  const [showDemo, setShowDemo] = useState(true)

  const { exercise } = item
  const isPlank = exercise.name.toLowerCase().includes("plank")
  const repLabel = isPlank
    ? `${item.rep_min}-${item.rep_max}s`
    : `${item.rep_min}-${item.rep_max} reps`

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Exercise {exerciseIndex + 1}
            </p>
            <CardTitle className="headline text-xl">{exercise.name}</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">
              {item.sets} x {repLabel}
            </p>
            {item.start_weight_lbs && (
              <p className="text-sm text-muted-foreground">
                Start: {item.start_weight_lbs} lbs
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Demo Video */}
        {exercise.demo_url && showDemo && (
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface2">
            <video
              src={exercise.demo_url}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowDemo(!showDemo)}
          >
            {showDemo ? "Hide Demo" : "Show Demo"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowCues(!showCues)}
          >
            <Info className="mr-1 h-4 w-4" />
            {showCues ? "Hide Cues" : "Form Cues"}
          </Button>
        </div>

        {/* Form Cues */}
        {showCues && exercise.form_cues && (
          <div className="rounded-lg bg-surface2 p-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {exercise.form_cues}
            </p>
          </div>
        )}

        {/* Prescription Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Timer className="h-4 w-4" />
            Rest: {item.rest_seconds}s
          </span>
          {item.increment_lbs > 0 && (
            <span>Progress: +{item.increment_lbs} lbs</span>
          )}
        </div>

        {/* Rest Timer Buttons */}
        <div className="flex gap-2">
          {[60, 90, 120].map((sec) => (
            <Button
              key={sec}
              variant={item.rest_seconds === sec ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => onRestTimer(sec)}
            >
              {sec}s
            </Button>
          ))}
        </div>

        {/* Set Logger (passed as children) */}
        {children}
      </CardContent>
    </Card>
  )
}
