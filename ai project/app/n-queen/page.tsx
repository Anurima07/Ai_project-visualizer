"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { ControlPanel } from "@/components/control-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Crown, Trash2, Grid3X3 } from "lucide-react"
import {
  type Board,
  countConflicts,
  getConflictCells,
  solveBacktracking,
} from "@/lib/algorithms/nqueen"

const BOARD_SIZES = [4, 5, 6, 7, 8, 10, 12, 16]

export default function NQueenPage() {
  const [n, setN] = useState(8)
  const [queens, setQueens] = useState<Board>(new Array(8).fill(null))
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [step, setStep] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [speed, setSpeed] = useState(300)
  const [highlightRow, setHighlightRow] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)
  const stepsRef = useRef<{ queens: Board; row: number; action: string }[]>([])
  const stepIdxRef = useRef(0)

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setQueens(new Array(n).fill(null))
    setIsRunning(false)
    setIsPaused(false)
    setStep(0)
    setStatusMsg("")
    setHighlightRow(null)
    pausedRef.current = false
    stepIdxRef.current = 0
    stepsRef.current = []
  }, [n])

  const animateStep = useCallback(
    (steps: { queens: Board; row: number; action: string }[], idx: number) => {
      if (idx >= steps.length) {
        setIsRunning(false)
        setStatusMsg("Solution found!")
        setHighlightRow(null)
        return
      }
      if (pausedRef.current) return

      const s = steps[idx]
      setQueens([...s.queens])
      setStep(idx + 1)
      setHighlightRow(s.row >= 0 ? s.row : null)
      stepIdxRef.current = idx

      timerRef.current = setTimeout(() => animateStep(steps, idx + 1), speed)
    },
    [speed]
  )

  const handleSolve = useCallback(() => {
    const steps = solveBacktracking(n)
    if (steps.length === 0) {
      setStatusMsg("No solution found.")
      return
    }
    stepsRef.current = steps
    setIsRunning(true)
    setIsPaused(false)
    pausedRef.current = false
    setStatusMsg(`Solving ${n}-Queens...`)
    animateStep(steps, 0)
  }, [n, animateStep])

  const handlePause = useCallback(() => {
    pausedRef.current = true
    setIsPaused(true)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleResume = useCallback(() => {
    pausedRef.current = false
    setIsPaused(false)
    animateStep(stepsRef.current, stepIdxRef.current + 1)
  }, [animateStep])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (isRunning) return
      setQueens((prev) => {
        const next = [...prev]
        next[row] = next[row] === col ? null : col
        return next
      })
      setStep((s) => s + 1)
    },
    [isRunning]
  )

  const handleSizeChange = useCallback((newN: number) => {
    setN(newN)
    setQueens(new Array(newN).fill(null))
    setStep(0)
    setStatusMsg("")
    setHighlightRow(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsRunning(false)
    setIsPaused(false)
  }, [])

  const clearBoard = useCallback(() => {
    if (isRunning) return
    setQueens(new Array(n).fill(null))
    setStep(0)
    setStatusMsg("")
  }, [isRunning, n])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const conflicts = countConflicts(queens, n)
  const conflictCells = getConflictCells(queens, n)
  const placedCount = queens.filter((q) => q !== null).length

  // Determine cell sizing based on n
  const cellClass =
    n <= 6
      ? "w-12 h-12 sm:w-14 sm:h-14"
      : n <= 8
        ? "w-10 h-10 sm:w-12 sm:h-12"
        : n <= 12
          ? "w-7 h-7 sm:w-9 sm:h-9"
          : "w-5 h-5 sm:w-7 sm:h-7"

  const queenSize =
    n <= 6 ? "h-6 w-6" : n <= 8 ? "h-5 w-5" : n <= 12 ? "h-4 w-4" : "h-3 w-3"

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="N-Queens Problem"
        description="Backtracking search with interactive board"
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Config Section */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Configuration
            </h2>
          </div>

          {/* Board size selector */}
          <div className="mb-5">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Board Size
            </Label>
            <div className="flex flex-wrap gap-2">
              {BOARD_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  disabled={isRunning}
                  className={`h-9 min-w-[3rem] rounded-lg border text-sm font-mono font-medium transition-all ${
                    n === size
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Animation Speed:{" "}
              <span className="text-foreground font-mono">{speed}ms</span>
            </Label>
            <Slider
              value={[speed]}
              onValueChange={(v) => setSpeed(v[0])}
              min={50}
              max={800}
              step={50}
              disabled={isRunning && !isPaused}
              className="max-w-sm"
            />
          </div>
        </div>

        {/* Controls + Stats Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
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
          {!isRunning && (
            <Button
              variant="secondary"
              size="sm"
              onClick={clearBoard}
              className="gap-2 self-start"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Board
            </Button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Queens</span>
            <span className="text-sm font-mono font-bold text-foreground">
              {placedCount}/{n}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Conflicts</span>
            <span
              className={`text-sm font-mono font-bold ${
                conflicts > 0 ? "text-destructive" : "text-success"
              }`}
            >
              {conflicts}
            </span>
          </div>
          {placedCount === n && conflicts === 0 && (
            <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-success" />
              <span className="text-sm font-semibold text-success">
                Valid Solution!
              </span>
            </div>
          )}
        </div>

        {/* Board */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6 overflow-x-auto">
          {!isRunning && (
            <p className="text-xs text-muted-foreground mb-3">
              Click any cell to place or remove a queen
            </p>
          )}
          <div
            className="inline-grid gap-0"
            style={{
              gridTemplateColumns: `2rem repeat(${n}, auto)`,
              gridTemplateRows: `2rem repeat(${n}, auto)`,
            }}
          >
            {/* Top-left empty corner */}
            <div />

            {/* Column labels row */}
            {Array.from({ length: n }).map((_, c) => (
              <div
                key={`col-${c}`}
                className={`${cellClass} flex items-center justify-center`}
              >
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {String.fromCharCode(65 + c)}
                </span>
              </div>
            ))}

            {/* Board rows (row label + cells) */}
            {Array.from({ length: n }).map((_, row) => (
              <>
                {/* Row label */}
                <div
                  key={`rl-${row}`}
                  className={`${cellClass} flex items-center justify-center`}
                >
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {row + 1}
                  </span>
                </div>

                {/* Cells */}
                {Array.from({ length: n }).map((_, col) => {
                  const isDark = (row + col) % 2 === 1
                  const hasQueen = queens[row] === col
                  const isConflict = conflictCells.has(`${row},${col}`)
                  const isHighlighted = highlightRow === row

                  return (
                    <button
                      key={`${row}-${col}`}
                      onClick={() => handleCellClick(row, col)}
                      className={`${cellClass} flex items-center justify-center transition-all duration-200 border border-border/30 ${
                        isDark ? "bg-secondary/80" : "bg-card"
                      } ${
                        isHighlighted && isRunning
                          ? "ring-1 ring-primary/50"
                          : ""
                      } ${
                        isConflict && hasQueen
                          ? "bg-destructive/25 ring-1 ring-destructive/50"
                          : ""
                      } ${
                        !isRunning
                          ? "hover:bg-primary/15 cursor-pointer active:scale-95"
                          : "cursor-default"
                      }`}
                    >
                      {hasQueen && (
                        <Crown
                          className={`${queenSize} transition-transform duration-200 ${
                            isConflict
                              ? "text-destructive drop-shadow-md"
                              : "text-primary drop-shadow-md"
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
