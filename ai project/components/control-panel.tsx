"use client"

import { Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ControlPanelProps {
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  stepCount?: number
  statusMessage?: string
  disabled?: boolean
}

export function ControlPanel({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onReset,
  stepCount,
  statusMessage,
  disabled = false,
}: ControlPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isRunning ? (
        <Button onClick={onStart} disabled={disabled} className="gap-2">
          <Play className="h-4 w-4" />
          Solve with AI
        </Button>
      ) : isPaused ? (
        <Button onClick={onResume} variant="outline" className="gap-2">
          <Play className="h-4 w-4" />
          Resume
        </Button>
      ) : (
        <Button onClick={onPause} variant="outline" className="gap-2">
          <Pause className="h-4 w-4" />
          Pause
        </Button>
      )}
      <Button onClick={onReset} variant="secondary" className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
      {stepCount !== undefined && (
        <span className="text-sm font-mono text-muted-foreground">
          Step: {stepCount}
        </span>
      )}
      {isRunning && !isPaused && (
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
      )}
      {statusMessage && (
        <span className="text-sm text-muted-foreground">{statusMessage}</span>
      )}
    </div>
  )
}
