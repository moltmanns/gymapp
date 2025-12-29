"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: string
  label: string
  completed: boolean
  active?: boolean
}

interface StepIndicatorProps {
  steps: Step[]
  className?: string
  orientation?: "horizontal" | "vertical"
}

export function StepIndicator({
  steps,
  className,
  orientation = "vertical",
}: StepIndicatorProps) {
  const completedCount = steps.filter((s) => s.completed).length
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0

  if (orientation === "horizontal") {
    return (
      <div className={cn("w-full", className)}>
        {/* Progress bar */}
        <div className="relative h-1 w-full rounded-full bg-surface2 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green to-lime transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center",
                idx === 0 && "items-start",
                idx === steps.length - 1 && "items-end"
              )}
            >
              <div
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-300",
                  step.completed
                    ? "bg-primary scale-110"
                    : step.active
                    ? "bg-lime animate-pulse"
                    : "bg-surface2"
                )}
              />
              {step.label && (
                <span className="mt-1 text-[10px] text-muted-foreground truncate max-w-[60px]">
                  {step.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vertical orientation
  return (
    <div className={cn("flex flex-col", className)}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1

        return (
          <div key={step.id} className="flex gap-3">
            {/* Step indicator column */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  step.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.active
                    ? "border-lime bg-lime/20 text-lime"
                    : "border-border bg-surface text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{idx + 1}</span>
                )}
              </div>
              {/* Connecting line */}
              {!isLast && (
                <div className="relative w-0.5 flex-1 min-h-[24px] bg-border">
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 bg-gradient-to-b from-primary to-lime transition-all duration-500",
                      step.completed ? "h-full" : "h-0"
                    )}
                  />
                </div>
              )}
            </div>
            {/* Label */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <span
                className={cn(
                  "text-sm font-medium leading-8 transition-colors",
                  step.completed
                    ? "text-foreground"
                    : step.active
                    ? "text-lime"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Compact horizontal progress for cards
interface ProgressDotsProps {
  total: number
  completed: number
  className?: string
}

export function ProgressDots({ total, completed, className }: ProgressDotsProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            idx < completed
              ? "bg-primary scale-110"
              : "bg-surface2"
          )}
        />
      ))}
    </div>
  )
}
