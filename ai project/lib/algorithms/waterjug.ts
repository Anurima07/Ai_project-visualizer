export interface WaterJugConfig {
  capacities: number[]
  goals: number[]
}

export type WaterJugState = number[]

export function getNextStates(
  state: WaterJugState,
  config: WaterJugConfig
): { state: WaterJugState; action: string }[] {
  const { capacities } = config
  const n = capacities.length
  const next: { state: WaterJugState; action: string }[] = []

  for (let i = 0; i < n; i++) {
    // Fill jug i
    if (state[i] < capacities[i]) {
      const ns = [...state]
      ns[i] = capacities[i]
      next.push({ state: ns, action: `Fill Jug ${i + 1}` })
    }
    // Empty jug i
    if (state[i] > 0) {
      const ns = [...state]
      ns[i] = 0
      next.push({ state: ns, action: `Empty Jug ${i + 1}` })
    }
    // Pour jug i into jug j
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      if (state[i] > 0 && state[j] < capacities[j]) {
        const pour = Math.min(state[i], capacities[j] - state[j])
        const ns = [...state]
        ns[i] -= pour
        ns[j] += pour
        next.push({ state: ns, action: `Pour ${i + 1} → ${j + 1}` })
      }
    }
  }

  return next
}

export function isGoal(state: WaterJugState, config: WaterJugConfig): boolean {
  return config.goals.every((g, i) => state[i] === g)
}

export function heuristic(state: WaterJugState, config: WaterJugConfig): number {
  return config.goals.reduce((sum, g, i) => sum + Math.abs(state[i] - g), 0)
}

export function solveBFS(
  config: WaterJugConfig
): { path: { state: WaterJugState; action: string }[]; found: boolean } {
  const initial: WaterJugState = new Array(config.capacities.length).fill(0)
  if (isGoal(initial, config))
    return { path: [{ state: initial, action: "Start" }], found: true }

  const queue: {
    state: WaterJugState
    path: { state: WaterJugState; action: string }[]
  }[] = [{ state: initial, path: [{ state: initial, action: "Start" }] }]

  const visited = new Set<string>()
  visited.add(initial.join(","))

  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = getNextStates(current.state, config)

    for (const neighbor of neighbors) {
      const key = neighbor.state.join(",")
      if (visited.has(key)) continue
      visited.add(key)

      const newPath = [...current.path, neighbor]
      if (isGoal(neighbor.state, config))
        return { path: newPath, found: true }
      if (visited.size > 50000) return { path: [], found: false }
      queue.push({ state: neighbor.state, path: newPath })
    }
  }

  return { path: [], found: false }
}
