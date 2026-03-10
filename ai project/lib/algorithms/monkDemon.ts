export interface MCState {
  monksLeft: number
  demonsLeft: number
  monksRight: number
  demonsRight: number
  boatOnLeft: boolean
}

export interface MCConfig {
  totalMonks: number
  totalDemons: number
  boatCapacity: number
}

export function createInitialState(config: MCConfig): MCState {
  return {
    monksLeft: config.totalMonks,
    demonsLeft: config.totalDemons,
    monksRight: 0,
    demonsRight: 0,
    boatOnLeft: true,
  }
}

export function isGoal(state: MCState): boolean {
  return state.monksLeft === 0 && state.demonsLeft === 0
}

export function isValid(state: MCState): boolean {
  if (state.monksLeft < 0 || state.demonsLeft < 0 || state.monksRight < 0 || state.demonsRight < 0)
    return false
  // monks can't be outnumbered by demons on either side (if monks present)
  if (state.monksLeft > 0 && state.demonsLeft > state.monksLeft) return false
  if (state.monksRight > 0 && state.demonsRight > state.monksRight) return false
  return true
}

export function getNextStates(
  state: MCState,
  config: MCConfig
): { state: MCState; action: string }[] {
  const results: { state: MCState; action: string }[] = []
  const { boatCapacity } = config

  for (let m = 0; m <= boatCapacity; m++) {
    for (let d = 0; d <= boatCapacity - m; d++) {
      if (m + d === 0 || m + d > boatCapacity) continue

      let newState: MCState
      if (state.boatOnLeft) {
        if (m > state.monksLeft || d > state.demonsLeft) continue
        newState = {
          monksLeft: state.monksLeft - m,
          demonsLeft: state.demonsLeft - d,
          monksRight: state.monksRight + m,
          demonsRight: state.demonsRight + d,
          boatOnLeft: false,
        }
      } else {
        if (m > state.monksRight || d > state.demonsRight) continue
        newState = {
          monksLeft: state.monksLeft + m,
          demonsLeft: state.demonsLeft + d,
          monksRight: state.monksRight - m,
          demonsRight: state.demonsRight - d,
          boatOnLeft: true,
        }
      }

      if (isValid(newState)) {
        const dir = state.boatOnLeft ? '→' : '←'
        const parts: string[] = []
        if (m > 0) parts.push(`${m} monk${m > 1 ? 's' : ''}`)
        if (d > 0) parts.push(`${d} demon${d > 1 ? 's' : ''}`)
        results.push({ state: newState, action: `${parts.join(' & ')} ${dir}` })
      }
    }
  }

  return results
}

export function stateKey(state: MCState): string {
  return `${state.monksLeft},${state.demonsLeft},${state.monksRight},${state.demonsRight},${state.boatOnLeft}`
}

export function solveBFS(config: MCConfig): {
  path: { state: MCState; action: string }[]
  found: boolean
} {
  const initial = createInitialState(config)
  if (isGoal(initial)) return { path: [{ state: initial, action: 'Start' }], found: true }

  const queue: { state: MCState; path: { state: MCState; action: string }[] }[] = [
    { state: initial, path: [{ state: initial, action: 'Start' }] },
  ]
  const visited = new Set<string>()
  visited.add(stateKey(initial))

  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = getNextStates(current.state, config)

    for (const neighbor of neighbors) {
      const key = stateKey(neighbor.state)
      if (visited.has(key)) continue
      visited.add(key)

      const newPath = [...current.path, neighbor]
      if (isGoal(neighbor.state)) return { path: newPath, found: true }
      if (visited.size > 50000) return { path: [], found: false }
      queue.push({ state: neighbor.state, path: newPath })
    }
  }

  return { path: [], found: false }
}
