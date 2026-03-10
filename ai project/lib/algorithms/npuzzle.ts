export type PuzzleState = number[]

export function getGoalState(size: number): PuzzleState {
  const total = size * size
  const goal: PuzzleState = []
  for (let i = 1; i < total; i++) goal.push(i)
  goal.push(0)
  return goal
}

export function manhattanDistance(state: PuzzleState, size: number): number {
  let dist = 0
  for (let i = 0; i < state.length; i++) {
    if (state[i] === 0) continue
    const goalIdx = state[i] - 1
    const currentRow = Math.floor(i / size)
    const currentCol = i % size
    const goalRow = Math.floor(goalIdx / size)
    const goalCol = goalIdx % size
    dist += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol)
  }
  return dist
}

export function isGoal(state: PuzzleState, size: number): boolean {
  const goal = getGoalState(size)
  return state.every((val, i) => val === goal[i])
}

export function getNextStates(state: PuzzleState, size: number): { state: PuzzleState; action: string }[] {
  const blankIdx = state.indexOf(0)
  const row = Math.floor(blankIdx / size)
  const col = blankIdx % size
  const moves: { dr: number; dc: number; action: string }[] = [
    { dr: -1, dc: 0, action: 'Down' },
    { dr: 1, dc: 0, action: 'Up' },
    { dr: 0, dc: -1, action: 'Right' },
    { dr: 0, dc: 1, action: 'Left' },
  ]

  const next: { state: PuzzleState; action: string }[] = []
  for (const move of moves) {
    const nr = row + move.dr
    const nc = col + move.dc
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      const newState = [...state]
      const newIdx = nr * size + nc
      newState[blankIdx] = newState[newIdx]
      newState[newIdx] = 0
      next.push({ state: newState, action: move.action })
    }
  }
  return next
}

export function shufflePuzzle(size: number): PuzzleState {
  let state = getGoalState(size)
  // perform random valid moves to ensure solvability
  for (let i = 0; i < size * size * 100; i++) {
    const moves = getNextStates(state, size)
    const randomMove = moves[Math.floor(Math.random() * moves.length)]
    state = randomMove.state
  }
  return state
}

interface AStarNode {
  state: PuzzleState
  g: number
  h: number
  f: number
  parent: AStarNode | null
  action: string
}

export function solveAStar(
  initial: PuzzleState,
  size: number,
  maxNodes: number = 100000
): { path: { state: PuzzleState; action: string; g: number; h: number; f: number }[]; found: boolean } {
  const goal = getGoalState(size)
  const h = manhattanDistance(initial, size)

  if (initial.every((v, i) => v === goal[i])) {
    return { path: [{ state: initial, action: 'Start', g: 0, h: 0, f: 0 }], found: true }
  }

  const startNode: AStarNode = { state: initial, g: 0, h, f: h, parent: null, action: 'Start' }
  const openList: AStarNode[] = [startNode]
  const visited = new Set<string>()
  visited.add(initial.join(','))

  let nodesExplored = 0

  while (openList.length > 0 && nodesExplored < maxNodes) {
    openList.sort((a, b) => a.f - b.f)
    const current = openList.shift()!
    nodesExplored++

    const neighbors = getNextStates(current.state, size)
    for (const neighbor of neighbors) {
      const key = neighbor.state.join(',')
      if (visited.has(key)) continue
      visited.add(key)

      const gVal = current.g + 1
      const hVal = manhattanDistance(neighbor.state, size)
      const fVal = gVal + hVal
      const node: AStarNode = {
        state: neighbor.state,
        g: gVal,
        h: hVal,
        f: fVal,
        parent: current,
        action: neighbor.action,
      }

      if (neighbor.state.every((v, i) => v === goal[i])) {
        const path: { state: PuzzleState; action: string; g: number; h: number; f: number }[] = []
        let cur: AStarNode | null = node
        while (cur) {
          path.unshift({ state: cur.state, action: cur.action, g: cur.g, h: cur.h, f: cur.f })
          cur = cur.parent
        }
        return { path, found: true }
      }

      openList.push(node)
    }
  }

  return { path: [], found: false }
}
