"use client"

import Link from "next/link"
import { ArrowLeft, Brain } from "lucide-react"

interface PageHeaderProps {
  title: string
  description: string
  showBack?: boolean
}

export function PageHeader({ title, description, showBack = true }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
        {showBack && (
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        )}
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
