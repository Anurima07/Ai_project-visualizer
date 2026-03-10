"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import {
  type VacuumState,
  cloneGrid,
  countDirty,
  isClean,
  generateSimpleReflexPath,
  solveBFSOptimal,
} from "@/lib/algorithms/vacuum"

function createRandomGrid(rows: number, cols: number, dirtyPct = 0.3): boolean[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() < dirtyPct)
  )
}

export default function VacuumWorldPage() {
  const [gridSize, setGridSize] = useState(4)
  const [grid, setGrid] = useState<boolean[][]>(() => createRandomGrid(4, 4))
  const [agentRow, setAgentRow] = useState(0)
  const [agentCol, setAgentCol] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [step, setStep] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [mode, setMode] = useState<"reflex" | "bfs">("reflex")
  const [currentAction, setCurrentAction] = useState("Start")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)
  const pathRef = useRef<{ state: VacuumState; action: string }[]>([])
  const pathIdxRef = useRef(0)

  const dirty = countDirty(grid)

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const newGrid = createRandomGrid(gridSize, gridSize)
    setGrid(newGrid)
    setAgentRow(0)
    setAgentCol(0)
    setIsRunning(false)
    setIsPaused(false)
    setStep(0)
    setStatusMsg("")
    setCurrentAction("Start")
    pausedRef.current = false
    pathIdxRef.current = 0
    pathRef.current = []
  }, [gridSize])

  const animateStep = useCallback((path: { state: VacuumState; action: string }[], idx: number) => {
    if (idx >= path.length) {
      setIsRunning(false)
      setStatusMsg("Cleaning complete!")
      return
    }
    if (pausedRef.current) return

    const s = path[idx]
    setGrid(cloneGrid(s.state.grid))
    setAgentRow(s.state.agentRow)
    setAgentCol(s.state.agentCol)
    setCurrentAction(s.action)
    setStep(idx)
    pathIdxRef.current = idx

    timerRef.current = setTimeout(() => animateStep(path, idx + 1), 400)
  }, [])

  const handleSolve = useCallback(() => {
    setStatusMsg("Computing path...")
    setTimeout(() => {
      let path: { state: VacuumState; action: string }[]
      if (mode === "reflex") {
        path = generateSimpleReflexPath(grid, agentRow, agentCol)
      } else {
        // limit BFS to small grids
        if (gridSize > 5) {
          setStatusMsg("BFS optimal is limited to 5x5 grids. Use reflex mode for larger grids.")
          return
        }
        const result = solveBFSOptimal(grid, agentRow, agentCol)
        if (!result.found) {
          setStatusMsg("Could not find optimal solution (search limit reached). Try reflex mode.")
          return
        }
        path = result.path
      }

      if (path.length <= 1) {
        setStatusMsg("Grid is already clean!")
        return
      }

      pathRef.current = path
      setIsRunning(true)
      setIsPaused(false)
      pausedRef.current = false
      setStatusMsg(`Cleaning... (${path.length - 1} steps, ${mode === "reflex" ? "Simple Reflex" : "BFS Optimal"})`)
      animateStep(path, 0)
    }, 50)
  }, [grid, agentRow, agentCol, mode, gridSize, animateStep])

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

  const toggleDirt = useCallback((r: number, c: number) => {
    if (isRunning) return
    setGrid((prev) => {
      const next = cloneGrid(prev)
      next[r][c] = !next[r][c]
      return next
    })
  }, [isRunning])

  const handleSizeChange = useCallback((val: string) => {
    const newSize = Number(val)
    setGridSize(newSize)
    setGrid(createRandomGrid(newSize, newSize))
    setAgentRow(0)
    setAgentCol(0)
    setStep(0)
    setStatusMsg("")
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsRunning(false)
    setIsPaused(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Vacuum Cleaner World" description="Compare simple reflex vs BFS optimal cleaning" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Config */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Configuration</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Label className="text-xs text-muted-foreground">Grid Size</Label>
              <Select value={String(gridSize)} onValueChange={handleSizeChange} disabled={isRunning}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}x{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground">Agent Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "reflex" | "bfs")} disabled={isRunning}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reflex">Simple Reflex</SelectItem>
                  <SelectItem value="bfs">BFS Optimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {!isRunning ? (
            <Button onClick={handleSolve} className="gap-2">
              <Play className="h-4 w-4" />
              Start Cleaning
            </Button>
          ) : isPaused ? (
            <Button onClick={handleResume} variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline" className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={handleReset} variant="secondary" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <span className="text-sm font-mono text-muted-foreground">Step: {step}</span>
          {isRunning && !isPaused && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          {statusMsg && <span className="text-sm text-muted-foreground">{statusMsg}</span>}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Dirty Cells</p>
            <p className={`text-lg font-mono font-bold ${dirty === 0 ? "text-success" : "text-destructive"}`}>{dirty}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Agent Position</p>
            <p className="text-lg font-mono font-bold text-foreground">({agentRow}, {agentCol})</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Action</p>
            <p className="text-lg font-mono font-bold text-primary">{currentAction}</p>
          </div>
          {isClean(grid) && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
              <p className="text-sm font-semibold text-success">All Clean!</p>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="rounded-xl border border-border bg-card p-6">
          {!isRunning && (
            <p className="text-xs text-muted-foreground mb-4">Click cells to toggle dirt</p>
          )}
          <div
            className="inline-grid gap-1"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) =>
              row.map((isDirty, c) => {
                const isAgent = r === agentRow && c === agentCol
                const cellSize = gridSize <= 5 ? "w-12 h-12" : gridSize <= 7 ? "w-10 h-10" : "w-8 h-8"
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => toggleDirt(r, c)}
                    className={`${cellSize} rounded-md flex items-center justify-center text-xs font-bold font-mono transition-all duration-200 border ${
                      isAgent
                        ? "bg-primary/30 border-primary text-primary ring-2 ring-primary/30"
                        : isDirty
                          ? "bg-chart-4/20 border-chart-4/30 text-chart-4"
                          : "bg-secondary border-border text-muted-foreground"
                    } ${!isRunning ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
                  >
                    {isAgent ? "V" : isDirty ? "D" : ""}
                  </button>
                )
              })
            )}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary/30 border border-primary" /> Agent (V)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-chart-4/20 border border-chart-4/30" /> Dirty (D)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-secondary border border-border" /> Clean
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
