import Link from "next/link"
import { Brain, Droplets, Crown, Grid3X3, Ship, Sparkles } from "lucide-react"

const problems = [
  {
    title: "Water Jug",
    description: "Measure exact amounts of water using two jugs of different capacities. Uses BFS to find the optimal solution.",
    href: "/water-jug",
    icon: Droplets,
    algorithm: "BFS",
    color: "text-chart-1",
    bg: "bg-chart-1/10",
    borderColor: "border-chart-1/20",
  },
  {
    title: "N-Queens",
    description: "Place N queens on an NxN chessboard so no two queens attack each other. Solved via backtracking.",
    href: "/n-queen",
    icon: Crown,
    algorithm: "Backtracking",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    borderColor: "border-chart-2/20",
  },
  {
    title: "N-Puzzle",
    description: "Slide numbered tiles into order on a grid. Uses A* search with Manhattan distance heuristic.",
    href: "/n-puzzle",
    icon: Grid3X3,
    algorithm: "A* Search",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    borderColor: "border-chart-3/20",
  },
  {
    title: "Monk & Demon",
    description: "Transport monks and demons across a river without letting demons outnumber monks. BFS finds safe crossings.",
    href: "/monk-demon",
    icon: Ship,
    algorithm: "BFS",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    borderColor: "border-chart-4/20",
  },
  {
    title: "Vacuum World",
    description: "An agent navigates a grid to clean all dirty cells. Compare simple reflex vs. BFS optimal strategies.",
    href: "/vacuum-world",
    icon: Sparkles,
    algorithm: "BFS / Reflex",
    color: "text-chart-5",
    bg: "bg-chart-5/10",
    borderColor: "border-chart-5/20",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight sm:text-4xl text-balance">
              AI Search Visualizer
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
            Interactive visualizations of classic AI search algorithms. Explore each problem manually or watch the AI solver animate the solution step by step.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Link
              key={problem.href}
              href={problem.href}
              className={`group relative flex flex-col rounded-xl border ${problem.borderColor} ${problem.bg} p-6 transition-all hover:border-border hover:shadow-lg hover:shadow-background/50 hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-lg bg-secondary p-2.5 ${problem.color}`}>
                  <problem.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded-md bg-secondary">
                  {problem.algorithm}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {problem.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {problem.description}
              </p>
              <div className="mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {'Explore →'}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-border mt-10">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
          Built for educational purposes. Each problem supports manual interaction and AI-powered solving.
        </div>
      </footer>
    </div>
  )
}
