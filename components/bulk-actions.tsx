"use client"

import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { generatePDF } from "@/lib/pdf-utils"
import { useEffect, useState } from "react"

interface BulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
}

export function BulkActions({ selectedCount, onClearSelection }: BulkActionsProps) {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    // Fetch articles when component mounts
    async function fetchArticles() {
      try {
        const response = await fetch("/api/news")
        const data = await response.json()
        setArticles(data.articles || [])
      } catch (error) {
        console.error("Failed to fetch articles:", error)
      }
    }
    fetchArticles()
  }, [])

  const handleBulkDownload = async () => {
    // Get selected article IDs from localStorage or parent component
    const selectedIds = JSON.parse(localStorage.getItem("selectedArticles") || "[]")
    const selectedArticles = articles.filter((article) => selectedIds.includes(article.id))

    if (selectedArticles.length > 0) {
      generatePDF(selectedArticles)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-full shadow-lg px-6 py-3 flex items-center gap-4">
        <span className="font-medium">{selectedCount} selected</span>
        <Button variant="secondary" size="sm" onClick={handleBulkDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
