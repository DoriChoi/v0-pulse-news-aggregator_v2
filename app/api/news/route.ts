import { NextResponse } from "next/server"
import { RSS_FEEDS } from "@/lib/news/feeds"
import { fetchRSSFeed } from "@/lib/news/rss-fetcher"

/**
 * 뉴스 피드 API 엔드포인트
 * 모든 RSS 피드를 수집하여 통합된 뉴스 목록 반환
 */
export async function GET() {
  try {
    // 모든 RSS 피드 병렬 수집
    const allArticles = await Promise.all(RSS_FEEDS.map((feed) => fetchRSSFeed(feed)))

    // 결과 병합 및 날짜순 정렬
    const articles = allArticles.flat().sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    console.log(`[v0] Total articles fetched: ${articles.length}`)

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("[v0] Error in news API:", error)
    return NextResponse.json({ error: "Failed to fetch news", articles: [] }, { status: 500 })
  }
}
