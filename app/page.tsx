"use client"

import { useState } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TimeRangeFilter } from "@/components/time-range-filter"
import { BulkActions } from "@/components/bulk-actions"
import { RegionFilter } from "@/components/region-filter"

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [timeRange, setTimeRange] = useState(7)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [activeRegion, setActiveRegion] = useState("all") // Added region state

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
    setSelectedArticles([])
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={handleRefresh} />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />
          <NewsCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          <TimeRangeFilter timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          <NewsFeed
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            timeRange={timeRange}
            refreshTrigger={refreshTrigger}
            selectedArticles={selectedArticles}
            onSelectionChange={setSelectedArticles}
            activeRegion={activeRegion} // Pass region to NewsFeed
          />
        </div>
      </main>
      {selectedArticles.length > 0 && (
        <BulkActions selectedCount={selectedArticles.length} onClearSelection={() => setSelectedArticles([])} />
      )}
    </div>
  )
}
