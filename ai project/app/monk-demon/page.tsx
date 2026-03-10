"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { ControlPanel } from "@/components/control-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  type MCState,
  type MCConfig,
  createInitialState,
  isGoal,
  getNextStates,
  solveBFS,
} from "@/lib/algorithms/monkDemon"

function Entity({ type, count }: { type: "monk" | "demon"; count: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-6 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
            type === "monk"
              ? "bg-chart-1/20 text-chart-1 border border-chart-1/30"
              : "bg-destructive/20 text-destructive border border-destructive/30"
          }`}
        >
          {type === "monk" ? "M" : "D"}
        </div>
      ))}
    </div>
  )
}

function RiverScene({ state, boatOnLeft }: { state: MCState; boatOnLeft: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {/* Left bank */}
      <div className="flex-1 rounded-lg border border-border bg-card p-4 min-h-32">
        <p className="text-xs text-muted-foreground mb-2 font-mono">Left Bank</p>
        <div className="flex flex-col gap-2">
          <Entity type="monk" count={state.monksLeft} />
          <Entity type="demon" count={state.demonsLeft} />
        </div>
      </div>

      {/* River */}
      <div className="flex flex-col items-center w-20 shrink-0">
        <div className="h-24 w-full rounded-lg bg-chart-3/10 border border-chart-3/20 flex items-center justify-center relative">
          <div className="text-xs text-chart-3 font-mono">River</div>
          <div
            className={`absolute w-10 h-6 rounded-md bg-chart-4/30 border border-chart-4/40 transition-all duration-700 ${
              boatOnLeft ? "-left-2" : "-right-2"
            } flex items-center justify-center`}
          >
            <span className="text-[10px] text-chart-4 font-mono">Boat</span>
          </div>
        </div>
      </div>

      {/* Right bank */}
      <div className="flex-1 rounded-lg border border-border bg-card p-4 min-h-32">
        <p className="text-xs text-muted-foreground mb-2 font-mono">Right Bank</p>
        <div className="flex flex-col gap-2">
          <Entity type="monk" count={state.monksRight} />
          <Entity type="demon" count={state.demonsRight} />
        </div>
      </div>
    </div>
  )
}

export default function MonkDemonPage() {
  const [config, setConfig] = useState<MCConfig>({ totalMonks: 3, totalDemons: 3, boatCapacity: 2 })
  const [state, setState] = useState<MCState>(() => createInitialState({ totalMonks: 3, totalDemons: 3, boatCapacity: 2 }))
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [step, setStep] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [currentAction, setCurrentAction] = useState("Start")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)
  const pathRef = useRef<{ state: MCState; action: string }[]>([])
  const pathIdxRef = useRef(0)

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState(createInitialState(config))
    setIsRunning(false)
    setIsPaused(false)
    setStep(0)
    setStatusMsg("")
    setCurrentAction("Start")
    pausedRef.current = false
    pathIdxRef.current = 0
    pathRef.current = []
  }, [config])

  const animateStep = useCallback((path: { state: MCState; action: string }[], idx: number) => {
    if (idx >= path.length) {
      setIsRunning(false)
      setStatusMsg("All monks and demons crossed safely!")
      return
    }
    if (pausedRef.current) return

    setState(path[idx].state)
    setCurrentAction(path[idx].action)
    setStep(idx)
    pathIdxRef.current = idx

    timerRef.current = setTimeout(() => animateStep(path, idx + 1), 800)
  }, [])

  const handleSolve = useCallback(() => {
    const result = solveBFS(config)
    if (!result.found) {
      setStatusMsg("No solution exists for this configuration.")
      return
    }
    pathRef.current = result.path
    setIsRunning(true)
    setIsPaused(false)
    pausedRef.current = false
    setStatusMsg(`Solving... (${result.path.length - 1} crossings)`)
    animateStep(result.path, 0)
  }, [config, animateStep])

  const handlePause = useCallback(() => {
    pausedRef.current = true
    setIsPaused(true)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleResume = useCallback(() => {
    pausedRef.current = false
    setIsPaused(false)
    animateStep(pathRef.current, pathIdxRef.current + 1)
  }, [animateStep])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const availableActions = getNextStates(state, config)
  const goalReached = isGoal(state)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Monk & Demon" description="Missionaries & Cannibals with BFS search" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Config */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Configuration</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="monks" className="text-xs text-muted-foreground">Monks</Label>
              <Input id="monks" type="number" min={1} max={10} value={config.totalMonks} disabled={isRunning}
                onChange={(e) => { const v = Number(e.target.value); setConfig((c) => ({ ...c, totalMonks: v })); setState(createInitialState({ ...config, totalMonks: v })); setStep(0) }} />
            </div>
            <div>
              <Label htmlFor="demons" className="text-xs text-muted-foreground">Demons</Label>
              <Input id="demons" type="number" min={1} max={10} value={config.totalDemons} disabled={isRunning}
                onChange={(e) => { const v = Number(e.target.value); setConfig((c) => ({ ...c, totalDemons: v })); setState(createInitialState({ ...config, totalDemons: v })); setStep(0) }} />
            </div>
            <div>
              <Label htmlFor="boat" className="text-xs text-muted-foreground">Boat Capacity</Label>
              <Input id="boat" type="number" min={2} max={5} value={config.boatCapacity} disabled={isRunning}
                onChange={(e) => { const v = Number(e.target.value); setConfig((c) => ({ ...c, boatCapacity: v })) }} />
            </div>
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

        {/* River Visualization */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <RiverScene state={state} boatOnLeft={state.boatOnLeft} />
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground font-mono">
              Action: <span className="text-foreground">{currentAction}</span>
              {goalReached && (
                <span className="text-success font-semibold ml-2">Everyone crossed safely!</span>
              )}
            </p>
          </div>
        </div>

        {/* Manual Controls */}
        {!isRunning && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Manual Mode</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Select who to move across the river. Boat is on the {state.boatOnLeft ? "left" : "right"} bank.
            </p>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setState(action.state)
                    setCurrentAction(action.action)
                    setStep((s) => s + 1)
                  }}
                  disabled={goalReached}
                >
                  {action.action}
                </Button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
