export interface VacuumState {
  grid: boolean[][] // true = dirty
  agentRow: number
  agentCol: number
}

export function cloneGrid(grid: boolean[][]): boolean[][] {
  return grid.map((row) => [...row])
}

export function countDirty(grid: boolean[][]): number {
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell) count++
    }
  }
  return count
}

export function isClean(grid: boolean[][]): boolean {
  return countDirty(grid) === 0
}

// Simple reflex agent: if dirty, clean; else move to nearest dirty cell
export function simpleReflexStep(state: VacuumState): { state: VacuumState; action: string } | null {
  const { grid, agentRow, agentCol } = state

  if (grid[agentRow][agentCol]) {
    const newGrid = cloneGrid(grid)
    newGrid[agentRow][agentCol] = false
    return { state: { grid: newGrid, agentRow, agentCol }, action: 'Clean' }
  }

  // find nearest dirty cell using BFS
  const size = grid.length
  const visited = new Set<string>()
  const queue: { r: number; c: number; path: { r: number; c: number }[] }[] = [
    { r: agentRow, c: agentCol, path: [] },
  ]
  visited.add(`${agentRow},${agentCol}`)

  const dirs = [
    { dr: -1, dc: 0, action: 'Up' },
    { dr: 1, dc: 0, action: 'Down' },
    { dr: 0, dc: -1, action: 'Left' },
    { dr: 0, dc: 1, action: 'Right' },
  ]

  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const dir of dirs) {
      const nr = cur.r + dir.dr
      const nc = cur.c + dir.dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= grid[0].length) continue
      const key = `${nr},${nc}`
      if (visited.has(key)) continue
      visited.add(key)

      const newPath = [...cur.path, { r: nr, c: nc }]
      if (grid[nr][nc]) {
        // move one step toward dirty
        const firstStep = newPath[0]
        const action =
          firstStep.r < agentRow
            ? 'Up'
            : firstStep.r > agentRow
              ? 'Down'
              : firstStep.c < agentCol
                ? 'Left'
                : 'Right'
        return {
          state: { grid: cloneGrid(grid), agentRow: firstStep.r, agentCol: firstStep.c },
          action,
        }
      }
      queue.push({ r: nr, c: nc, path: newPath })
    }
  }

  return null
}

// BFS optimal cleaning path
interface BFSNode {
  grid: boolean[][]
  agentRow: number
  agentCol: number
  path: { state: VacuumState; action: string }[]
}

export function solveBFSOptimal(
  initialGrid: boolean[][],
  startRow: number,
  startCol: number,
  maxNodes: number = 50000
): { path: { state: VacuumState; action: string }[]; found: boolean } {
  const rows = initialGrid.length
  const cols = initialGrid[0].length

  const initialState: VacuumState = {
    grid: cloneGrid(initialGrid),
    agentRow: startRow,
    agentCol: startCol,
  }

  if (isClean(initialGrid)) {
    return { path: [{ state: initialState, action: 'Start' }], found: true }
  }

  function stateKey(s: VacuumState): string {
    const gridKey = s.grid.map((r) => r.map((c) => (c ? '1' : '0')).join('')).join('|')
    return `${s.agentRow},${s.agentCol}:${gridKey}`
  }

  const queue: BFSNode[] = [
    { grid: initialGrid, agentRow: startRow, agentCol: startCol, path: [{ state: initialState, action: 'Start' }] },
  ]
  const visited = new Set<string>()
  visited.add(stateKey(initialState))

  const dirs = [
    { dr: -1, dc: 0, action: 'Up' },
    { dr: 1, dc: 0, action: 'Down' },
    { dr: 0, dc: -1, action: 'Left' },
    { dr: 0, dc: 1, action: 'Right' },
  ]

  let explored = 0

  while (queue.length > 0 && explored < maxNodes) {
    const cur = queue.shift()!
    explored++

    // Try cleaning current cell
    if (cur.grid[cur.agentRow][cur.agentCol]) {
      const newGrid = cloneGrid(cur.grid)
      newGrid[cur.agentRow][cur.agentCol] = false
      const newState: VacuumState = { grid: newGrid, agentRow: cur.agentRow, agentCol: cur.agentCol }
      const key = stateKey(newState)
      if (!visited.has(key)) {
        visited.add(key)
        const newPath = [...cur.path, { state: newState, action: 'Clean' }]
        if (isClean(newGrid)) return { path: newPath, found: true }
        queue.push({ grid: newGrid, agentRow: cur.agentRow, agentCol: cur.agentCol, path: newPath })
      }
    }

    // Try moving in each direction
    for (const dir of dirs) {
      const nr = cur.agentRow + dir.dr
      const nc = cur.agentCol + dir.dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      const newState: VacuumState = { grid: cloneGrid(cur.grid), agentRow: nr, agentCol: nc }
      const key = stateKey(newState)
      if (visited.has(key)) continue
      visited.add(key)
      const newPath = [...cur.path, { state: newState, action: dir.action }]
      if (isClean(cur.grid) && !cur.grid[nr][nc]) continue
      queue.push({ grid: cloneGrid(cur.grid), agentRow: nr, agentCol: nc, path: newPath })
    }
  }

  return { path: [], found: false }
}

export function generateSimpleReflexPath(
  initialGrid: boolean[][],
  startRow: number,
  startCol: number,
  maxSteps: number = 500
): { state: VacuumState; action: string }[] {
  let current: VacuumState = {
    grid: cloneGrid(initialGrid),
    agentRow: startRow,
    agentCol: startCol,
  }
  const path: { state: VacuumState; action: string }[] = [{ state: { ...current, grid: cloneGrid(current.grid) }, action: 'Start' }]

  for (let i = 0; i < maxSteps; i++) {
    if (isClean(current.grid)) break
    const next = simpleReflexStep(current)
    if (!next) break
    current = next.state
    path.push({ state: { ...current, grid: cloneGrid(current.grid) }, action: next.action })
  }

  return path
}
