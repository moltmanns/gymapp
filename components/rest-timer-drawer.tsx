"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Pause, Play, RotateCcw, X } from "lucide-react"

interface RestTimerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSeconds: number
}

export function RestTimerDrawer({
  open,
  onOpenChange,
  initialSeconds,
}: RestTimerDrawerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(initialSeconds)

  // Reset timer when drawer opens with new value
  useEffect(() => {
    if (open) {
      setSeconds(initialSeconds)
      setSelectedPreset(initialSeconds)
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [open, initialSeconds])

  // Timer countdown
  useEffect(() => {
    if (!isRunning || seconds <= 0) return

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setIsRunning(false)
          // Vibrate on completion if supported
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, seconds])

  const handlePreset = (secs: number) => {
    setSelectedPreset(secs)
    setSeconds(secs)
    setIsRunning(true)
  }

  const handleReset = () => {
    setSeconds(selectedPreset)
    setIsRunning(false)
  }

  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`
  }

  const progress = (seconds / selectedPreset) * 100

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="headline text-center text-2xl">
            Rest Timer
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center gap-8">
          {/* Timer display */}
          <div className="relative flex h-48 w-48 items-center justify-center">
            {/* Progress ring */}
            <svg className="absolute h-full w-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface2"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                strokeLinecap="round"
                className={seconds === 0 ? "text-primary" : "text-lime"}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span
              className={`text-5xl font-bold tabular-nums ${
                seconds === 0 ? "text-primary animate-pulse" : ""
              }`}
            >
              {formatTime(seconds)}
            </span>
          </div>

          {/* Preset buttons */}
          <div className="flex w-full gap-3">
            {[60, 90, 120].map((secs) => (
              <button
                key={secs}
                onClick={() => handlePreset(secs)}
                className={`rest-btn ${selectedPreset === secs ? "active" : ""}`}
              >
                {secs}s
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              className="w-24"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant={isRunning ? "secondary" : "gradient"}
              size="lg"
              onClick={togglePause}
              className="w-24"
            >
              {isRunning ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="w-24"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
