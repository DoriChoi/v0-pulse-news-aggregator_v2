"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, Clock, Sparkles, Mail, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { useState } from "react"
import { generatePDF } from "@/lib/pdf-utils"

interface NewsArticle {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  imageUrl?: string
}

interface NewsCardProps {
  article: NewsArticle
  isSelected: boolean
  onToggleSelection: (id: string) => void
}

export function NewsCard({ article, isSelected, onToggleSelection }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)

  const handleSummarize = async () => {
    const apiKey = localStorage.getItem("openai_api_key")

    if (!apiKey) {
      setSummary("OpenAI API 키를 먼저 설정해주세요. (우측 상단 설정 버튼)")
      return
    }

    setIsLoadingSummary(true)
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          link: article.link,
          apiKey: apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to summarize")
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error("[v0] Error summarizing article:", error)
      setSummary("요약을 생성하는데 실패했습니다.")
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(article.title)
    const body = encodeURIComponent(
      `${article.title}\n\n${article.description}\n\nRead more: ${article.link}\n\nSource: ${article.source}`,
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleDownloadPDF = () => {
    generatePDF([article])
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg relative">
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(article.id)}
          className="bg-background border-2"
        />
      </div>
      {article.imageUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={article.imageUrl || "/placeholder.svg"}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="secondary">{article.source}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
        <CardTitle className="line-clamp-2 text-balance">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3">{article.description}</CardDescription>
        {summary && (
          <div className="mt-4 p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">AI 요약</span>
            </div>
            <p className="text-sm text-foreground">{summary}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={handleSummarize}
            disabled={isLoadingSummary || !!summary}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoadingSummary ? "요약 중..." : summary ? "요약 완료" : "AI 요약"}
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" asChild>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              Read More
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleEmailShare}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
