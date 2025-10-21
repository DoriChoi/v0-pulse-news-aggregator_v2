"use client"

import { useEffect, useState } from "react"
import { NewsCard } from "@/components/news-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { NewsArticle } from "@/types/article"

interface NewsFeedProps {
  activeCategory: string
  searchQuery: string
  timeRange: number
  refreshTrigger: number
  selectedArticles: string[]
  onSelectionChange: (selected: string[]) => void
  activeRegion: string
}

export function NewsFeed({
  activeCategory,
  searchQuery,
  timeRange,
  refreshTrigger,
  selectedArticles,
  onSelectionChange,
  activeRegion,
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true)
        const response = await fetch(`/api/news?t=${Date.now()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch news")
        }
        const data = await response.json()
        setArticles(data.articles || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [refreshTrigger])

  const filteredArticles = articles.filter((article) => {
    // Filter by category
    const matchesCategory = activeCategory === "all" || article.category === activeCategory

    // Filter by search query (case-insensitive search in title, description, and source)
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.source.toLowerCase().includes(searchQuery.toLowerCase())

    const articleDate = new Date(article.pubDate)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - timeRange)
    const matchesTimeRange = articleDate >= cutoffDate

    const matchesRegion = activeRegion === "all" || article.region === activeRegion

    return matchesCategory && matchesSearch && matchesTimeRange && matchesRegion
  })

  const handleToggleSelection = (articleId: string) => {
    if (selectedArticles.includes(articleId)) {
      onSelectionChange(selectedArticles.filter((id) => id !== articleId))
    } else {
      onSelectionChange([...selectedArticles, articleId])
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (filteredArticles.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No articles found</AlertTitle>
        <AlertDescription>
          {searchQuery
            ? `No articles found matching "${searchQuery}"${activeCategory !== "all" ? ` in the ${activeCategory} category` : ""}${activeRegion !== "all" ? ` in ${activeRegion === "domestic" ? "국내" : "해외"} news` : ""}.`
            : activeCategory === "all"
              ? "Check back later for the latest news updates."
              : `No articles found in the ${activeCategory} category.`}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredArticles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          isSelected={selectedArticles.includes(article.id)}
          onToggleSelection={handleToggleSelection}
        />
      ))}
    </div>
  )
}
