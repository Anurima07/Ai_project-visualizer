"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { ControlPanel } from "@/components/control-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Shuffle } from "lucide-react"
import {
  type PuzzleState,
  manhattanDistance,
  isGoal,
  getNextStates,
  shufflePuzzle,
  solveAStar,
} from "@/lib/algorithms/npuzzle"

export default function NPuzzlePage() {
  const [size, setSize] = useState(3)
  const [puzzle, setPuzzle] = useState<PuzzleState>(() => shufflePuzzle(3))
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [step, setStep] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [metrics, setMetrics] = useState({ g: 0, h: 0, f: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)
  const pathRef = useRef<{ state: PuzzleState; action: string; g: number; h: number; f: number }[]>([])
  const pathIdxRef = useRef(0)

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPuzzle(shufflePuzzle(size))
    setIsRunning(false)
    setIsPaused(false)
    setStep(0)
    setStatusMsg("")
    setMetrics({ g: 0, h: manhattanDistance(shufflePuzzle(size), size), f: 0 })
    pausedRef.current = false
    pathIdxRef.current = 0
    pathRef.current = []
  }, [size])

  const handleShuffle = useCallback(() => {
    if (isRunning) return
    const newPuzzle = shufflePuzzle(size)
    setPuzzle(newPuzzle)
    setStep(0)
    setStatusMsg("")
    const h = manhattanDistance(newPuzzle, size)
    setMetrics({ g: 0, h, f: h })
  }, [size, isRunning])

  const animateStep = useCallback((path: typeof pathRef.current, idx: number) => {
    if (idx >= path.length) {
      setIsRunning(false)
      setStatusMsg("Solved!")
      return
    }
    if (pausedRef.current) return

    const s = path[idx]
    setPuzzle(s.state)
    setStep(idx)
    setMetrics({ g: s.g, h: s.h, f: s.f })
    pathIdxRef.current = idx

    timerRef.current = setTimeout(() => animateStep(path, idx + 1), 500)
  }, [])

  const handleSolve = useCallback(() => {
    if (size > 4) {
      setStatusMsg("A* is limited to 4x4 for performance. Use manual mode for larger puzzles.")
      return
    }
    setStatusMsg("Solving...")
    // use setTimeout to let UI update
    setTimeout(() => {
      const result = solveAStar(puzzle, size)
      if (!result.found) {
        setStatusMsg("No solution found (search limit reached).")
        return
      }
      pathRef.current = result.path
      setIsRunning(true)
      setIsPaused(false)
      pausedRef.current = false
      setStatusMsg(`Solving... (${result.path.length - 1} moves)`)
      animateStep(result.path, 0)
    }, 50)
  }, [puzzle, size, animateStep])

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

  const handleTileClick = useCallback((idx: number) => {
    if (isRunning) return
    const blankIdx = puzzle.indexOf(0)
    const row = Math.floor(idx / size)
    const col = idx % size
    const blankRow = Math.floor(blankIdx / size)
    const blankCol = blankIdx % size

    if ((Math.abs(row - blankRow) === 1 && col === blankCol) ||
        (Math.abs(col - blankCol) === 1 && row === blankRow)) {
      const newPuzzle = [...puzzle]
      newPuzzle[blankIdx] = newPuzzle[idx]
      newPuzzle[idx] = 0
      setPuzzle(newPuzzle)
      setStep((s) => s + 1)
      const h = manhattanDistance(newPuzzle, size)
      setMetrics((m) => ({ g: m.g + 1, h, f: m.g + 1 + h }))
    }
  }, [isRunning, puzzle, size])

  const handleSizeChange = useCallback((val: string) => {
    const newSize = Number(val)
    setSize(newSize)
    const newPuzzle = shufflePuzzle(newSize)
    setPuzzle(newPuzzle)
    setStep(0)
    setStatusMsg("")
    const h = manhattanDistance(newPuzzle, newSize)
    setMetrics({ g: 0, h, f: h })
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsRunning(false)
    setIsPaused(false)
  }, [])

  useEffect(() => {
    const h = manhattanDistance(puzzle, size)
    setMetrics((m) => ({ ...m, h, f: m.g + h }))
  }, [puzzle, size])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const goalReached = isGoal(puzzle, size)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="N-Puzzle" description="A* search with Manhattan distance heuristic" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Config */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Configuration</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Label className="text-xs text-muted-foreground">Puzzle Size</Label>
              <Select value={String(size)} onValueChange={handleSizeChange} disabled={isRunning}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3x3 (8-puzzle)</SelectItem>
                  <SelectItem value="4">4x4 (15-puzzle)</SelectItem>
                  <SelectItem value="5">5x5 (24-puzzle)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleShuffle} disabled={isRunning} className="gap-2">
              <Shuffle className="h-4 w-4" />
              Shuffle
            </Button>
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
            disabled={size > 4}
          />
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">g(n)</p>
            <p className="text-lg font-mono font-bold text-foreground">{metrics.g}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">h(n)</p>
            <p className="text-lg font-mono font-bold text-foreground">{metrics.h}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">f(n) = g + h</p>
            <p className="text-lg font-mono font-bold text-primary">{metrics.f}</p>
          </div>
          {goalReached && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
              <p className="text-sm font-semibold text-success">Solved!</p>
            </div>
          )}
        </div>

        {/* Puzzle Grid */}
        <div className="rounded-xl border border-border bg-card p-6">
          {!isRunning && (
            <p className="text-xs text-muted-foreground mb-4">Click a tile adjacent to the blank space to move it</p>
          )}
          <div
            className="inline-grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {puzzle.map((val, idx) => {
              const tileSize = size <= 3 ? "w-16 h-16 text-xl" : size <= 4 ? "w-14 h-14 text-lg" : "w-11 h-11 text-sm"
              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  disabled={val === 0}
                  className={`${tileSize} rounded-lg font-bold font-mono flex items-center justify-center transition-all duration-200 ${
                    val === 0
                      ? "bg-transparent border border-dashed border-border"
                      : "bg-secondary text-foreground border border-border hover:bg-primary/20 hover:border-primary/40 cursor-pointer active:scale-95"
                  }`}
                >
                  {val !== 0 ? val : ""}
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
