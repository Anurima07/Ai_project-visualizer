"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { ControlPanel } from "@/components/control-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Minus, Droplets } from "lucide-react"
import {
  type WaterJugState,
  type WaterJugConfig,
  getNextStates,
  isGoal,
  heuristic,
  solveBFS,
} from "@/lib/algorithms/waterjug"

const JUG_COLORS = [
  "bg-chart-1/70",
  "bg-chart-3/70",
  "bg-chart-2/70",
  "bg-chart-4/70",
  "bg-chart-5/70",
]
const JUG_TEXT_COLORS = [
  "text-chart-1",
  "text-chart-3",
  "text-chart-2",
  "text-chart-4",
  "text-chart-5",
]

function JugVisual({
  index,
  current,
  capacity,
  goal,
}: {
  index: number
  current: number
  capacity: number
  goal: number
}) {
  const pct = capacity > 0 ? (current / capacity) * 100 : 0
  const goalPct = capacity > 0 ? (goal / capacity) * 100 : 0
  const colorIdx = index % JUG_COLORS.length
  const atGoal = current === goal

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
        Jug {index + 1}
      </span>
      <div className="relative w-20 h-44 sm:w-24 sm:h-52 rounded-xl border-2 border-border bg-secondary/50 overflow-hidden shadow-lg">
        {/* Goal line marker */}
        {goal > 0 && (
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-primary/60 z-10"
            style={{ bottom: `${goalPct}%` }}
          >
            <span className="absolute -top-3 -right-1 text-[10px] font-mono text-primary/80">
              {goal}
            </span>
          </div>
        )}
        {/* Water fill */}
        <div
          className={`absolute bottom-0 left-0 right-0 ${JUG_COLORS[colorIdx]} transition-all duration-500 ease-out`}
          style={{ height: `${pct}%` }}
        />
        {/* Current amount */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold font-mono ${JUG_TEXT_COLORS[colorIdx]} drop-shadow-md`}>
            {current}
          </span>
        </div>
        {/* Goal reached glow */}
        {atGoal && goal > 0 && (
          <div className="absolute inset-0 border-2 border-success rounded-xl animate-pulse" />
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-muted-foreground font-mono">
          cap: {capacity}
        </span>
        <span className="text-xs text-primary/80 font-mono">
          goal: {goal}
        </span>
      </div>
    </div>
  )
}

export default function WaterJugPage() {
  const [numJugs, setNumJugs] = useState(2)
  const [capacities, setCapacities] = useState([4, 3])
  const [goals, setGoals] = useState([2, 0])
  const [state, setState] = useState<WaterJugState>([0, 0])
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [step, setStep] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [solutionPath, setSolutionPath] = useState<{ state: WaterJugState; action: string }[]>([])
  const [currentAction, setCurrentAction] = useState("Start")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)
  const pathIdxRef = useRef(0)

  const config: WaterJugConfig = { capacities, goals }

  const addJug = useCallback(() => {
    if (numJugs >= 5 || isRunning) return
    const n = numJugs + 1
    setNumJugs(n)
    setCapacities((c) => [...c, 3])
    setGoals((g) => [...g, 0])
    setState((s) => [...s, 0])
    setStep(0)
    setStatusMsg("")
  }, [numJugs, isRunning])

  const removeJug = useCallback(() => {
    if (numJugs <= 2 || isRunning) return
    const n = numJugs - 1
    setNumJugs(n)
    setCapacities((c) => c.slice(0, n))
    setGoals((g) => g.slice(0, n))
    setState((s) => s.slice(0, n))
    setStep(0)
    setStatusMsg("")
  }, [numJugs, isRunning])

  const updateCapacity = useCallback(
    (idx: number, val: number) => {
      if (isRunning) return
      setCapacities((c) => {
        const next = [...c]
        next[idx] = Math.max(1, Math.min(20, val))
        return next
      })
      setGoals((g) => {
        const next = [...g]
        next[idx] = Math.min(next[idx], Math.max(1, Math.min(20, val)))
        return next
      })
      setState(new Array(numJugs).fill(0))
      setStep(0)
      setStatusMsg("")
    },
    [isRunning, numJugs]
  )

  const updateGoal = useCallback(
    (idx: number, val: number) => {
      if (isRunning) return
      setGoals((g) => {
        const next = [...g]
        next[idx] = Math.max(0, Math.min(capacities[idx], val))
        return next
      })
    },
    [isRunning, capacities]
  )

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState(new Array(numJugs).fill(0))
    setIsRunning(false)
    setIsPaused(false)
    setStep(0)
    setStatusMsg("")
    setSolutionPath([])
    setCurrentAction("Start")
    pausedRef.current = false
    pathIdxRef.current = 0
  }, [numJugs])

  const animateSolution = useCallback(
    (path: { state: WaterJugState; action: string }[], idx: number) => {
      if (idx >= path.length) {
        setIsRunning(false)
        setStatusMsg("Solution found!")
        return
      }
      if (pausedRef.current) return

      setState(path[idx].state)
      setCurrentAction(path[idx].action)
      setStep(idx)
      pathIdxRef.current = idx

      timerRef.current = setTimeout(() => animateSolution(path, idx + 1), 600)
    },
    []
  )

  const handleSolve = useCallback(() => {
    const result = solveBFS(config)
    if (!result.found) {
      setStatusMsg("No solution exists for this configuration.")
      return
    }
    setSolutionPath(result.path)
    setIsRunning(true)
    setIsPaused(false)
    pausedRef.current = false
    setStatusMsg(`Solving... (${result.path.length - 1} steps)`)
    animateSolution(result.path, 0)
  }, [config, animateSolution])

  const handlePause = useCallback(() => {
    pausedRef.current = true
    setIsPaused(true)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleResume = useCallback(() => {
    pausedRef.current = false
    setIsPaused(false)
    animateSolution(solutionPath, pathIdxRef.current + 1)
  }, [solutionPath, animateSolution])

  const applyManualAction = useCallback(
    (actionFn: () => void) => {
      if (isRunning) return
      actionFn()
      setStep((s) => s + 1)
    },
    [isRunning]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const manualActions = getNextStates(state, config)
  const h = heuristic(state, config)
  const goalReached = isGoal(state, config)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Water Jug Problem"
        description="BFS search with configurable containers"
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Configuration Panel */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              Configuration
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                Containers: {numJugs}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={removeJug}
                disabled={numJugs <= 2 || isRunning}
              >
                <Minus className="h-3 w-3" />
                <span className="sr-only">Remove container</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={addJug}
                disabled={numJugs >= 5 || isRunning}
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Add container</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numJugs}, minmax(0, 1fr))` }}>
            {capacities.map((cap, i) => (
              <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground text-center tracking-wider uppercase">
                  Jug {i + 1}
                </p>
                <div>
                  <Label htmlFor={`cap-${i}`} className="text-xs text-muted-foreground">
                    Capacity
                  </Label>
                  <Input
                    id={`cap-${i}`}
                    type="number"
                    min={1}
                    max={20}
                    value={cap}
                    disabled={isRunning}
                    onChange={(e) => updateCapacity(i, Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`goal-${i}`} className="text-xs text-muted-foreground">
                    Goal
                  </Label>
                  <Input
                    id={`goal-${i}`}
                    type="number"
                    min={0}
                    max={cap}
                    value={goals[i]}
                    disabled={isRunning}
                    onChange={(e) => updateGoal(i, Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <ControlPanel
            isRunning={isRunning}
            isPaused={isPaused}
            onStart={handleSolve}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            stepCount={step}
            statusMessage={statusMsg}
          />
        </div>

        {/* Visualization */}
        <div className="rounded-xl border border-border bg-card p-8 mb-6">
          <div className="flex items-end justify-center gap-6 sm:gap-10 flex-wrap">
            {state.map((val, i) => (
              <JugVisual
                key={i}
                index={i}
                current={val}
                capacity={capacities[i]}
                goal={goals[i]}
              />
            ))}
          </div>
          <div className="mt-8 text-center space-y-1">
            <p className="text-sm font-mono text-muted-foreground">
              Action:{" "}
              <span className="text-foreground font-semibold">
                {currentAction}
              </span>
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              h(n) = {h}
              {goalReached && (
                <span className="text-success font-semibold ml-3">
                  Goal Reached!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Manual Controls */}
        {!isRunning && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Manual Mode
            </h2>
            {manualActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions available</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {manualActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      applyManualAction(() => {
                        setState(action.state)
                        setCurrentAction(action.action)
                      })
                    }
                    disabled={goalReached}
                    className="font-mono text-xs"
                  >
                    {action.action}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
