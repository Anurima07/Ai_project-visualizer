export type Board = (number | null)[]

export function countConflicts(queens: Board, n: number): number {
  let conflicts = 0
  for (let i = 0; i < n; i++) {
    if (queens[i] === null) continue
    for (let j = i + 1; j < n; j++) {
      if (queens[j] === null) continue
      if (queens[i] === queens[j]) conflicts++
      if (Math.abs(queens[i]! - queens[j]!) === Math.abs(i - j)) conflicts++
    }
  }
  return conflicts
}

export function getConflictCells(queens: Board, n: number): Set<string> {
  const cells = new Set<string>()
  for (let i = 0; i < n; i++) {
    if (queens[i] === null) continue
    for (let j = i + 1; j < n; j++) {
      if (queens[j] === null) continue
      if (queens[i] === queens[j] || Math.abs(queens[i]! - queens[j]!) === Math.abs(i - j)) {
        cells.add(`${i},${queens[i]}`)
        cells.add(`${j},${queens[j]}`)
      }
    }
  }
  return cells
}

export interface SolveStep {
  queens: Board
  row: number
  action: 'place' | 'remove' | 'done'
}

export function solveBacktracking(n: number): SolveStep[] {
  const steps: SolveStep[] = []
  const queens: Board = new Array(n).fill(null)

  function isSafe(row: number, col: number): boolean {
    for (let i = 0; i < row; i++) {
      if (queens[i] === null) continue
      if (queens[i] === col) return false
      if (Math.abs(queens[i]! - col) === Math.abs(i - row)) return false
    }
    return true
  }

  function solve(row: number): boolean {
    if (row === n) {
      steps.push({ queens: [...queens], row: -1, action: 'done' })
      return true
    }

    for (let col = 0; col < n; col++) {
      if (isSafe(row, col)) {
        queens[row] = col
        steps.push({ queens: [...queens], row, action: 'place' })

        if (solve(row + 1)) return true

        queens[row] = null
        steps.push({ queens: [...queens], row, action: 'remove' })
      }
    }

    return false
  }

  solve(0)
  return steps
}
