import { NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"

const RSS_FEEDS = [
  {
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    source: "BBC World",
    region: "international",
  },
  {
    url: "https://www.theguardian.com/world/rss",
    source: "The Guardian",
    region: "international",
  },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    source: "NY Times World",
    region: "international",
  },
  {
    url: "https://www.reddit.com/r/worldnews/.rss",
    source: "Reddit World News",
    region: "international",
  },
  {
    url: "https://feeds.feedburner.com/TechCrunch/",
    source: "TechCrunch",
    region: "international",
  },
  {
    url: "https://www.technologyreview.com/topnews.rss",
    source: "MIT Technology Review",
    region: "international",
  },
  {
    url: "http://rss.cnn.com/rss/edition_world.rss",
    source: "CNN World",
    region: "international",
  },
  {
    url: "https://www.yna.co.kr/rss/society.xml",
    source: "연합뉴스 사회",
    region: "domestic",
  },
  {
    url: "https://www.yna.co.kr/rss/industry.xml",
    source: "연합뉴스 산업",
    region: "domestic",
  },
  {
    url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER",
    source: "SBS 뉴스",
    region: "domestic",
  },
]

interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
  category?: string | string[] // Add category field from RSS
  "media:thumbnail"?: { "@_url": string }
  "media:content"?: { "@_url": string }
  enclosure?: { "@_url": string; "@_type": string }
  "media:group"?: {
    "media:content": { "@_url": string }
  }
}

function categorizeArticle(title: string, description: string, rssCategory?: string | string[]): string {
  const text = `${title} ${description}`.toLowerCase()

  if (rssCategory) {
    // Ensure category is a string
    let categoryStr = ""
    if (Array.isArray(rssCategory)) {
      categoryStr = rssCategory[0]?.toString() || ""
    } else if (typeof rssCategory === "object") {
      categoryStr = JSON.stringify(rssCategory)
    } else {
      categoryStr = String(rssCategory)
    }

    const categoryLower = categoryStr.toLowerCase()

    if (categoryLower.includes("business") || categoryLower.includes("economy") || categoryLower.includes("finance"))
      return "business"
    if (categoryLower.includes("tech") || categoryLower.includes("science")) return "technology"
    if (categoryLower.includes("health") || categoryLower.includes("medical")) return "health"
    if (categoryLower.includes("sport")) return "sports"
    if (categoryLower.includes("entertainment") || categoryLower.includes("culture")) return "entertainment"
  }

  // Keyword-based categorization
  if (
    text.includes("business") ||
    text.includes("economy") ||
    text.includes("market") ||
    text.includes("stock") ||
    text.includes("trade") ||
    text.includes("finance")
  )
    return "business"

  if (
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("ai") ||
    text.includes("software") ||
    text.includes("computer") ||
    text.includes("digital")
  )
    return "technology"

  if (
    text.includes("science") ||
    text.includes("research") ||
    text.includes("study") ||
    text.includes("scientist") ||
    text.includes("discovery")
  )
    return "science"

  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("hospital") ||
    text.includes("doctor") ||
    text.includes("disease") ||
    text.includes("vaccine")
  )
    return "health"

  if (
    text.includes("sport") ||
    text.includes("football") ||
    text.includes("basketball") ||
    text.includes("soccer") ||
    text.includes("olympic") ||
    text.includes("championship")
  )
    return "sports"

  if (
    text.includes("entertainment") ||
    text.includes("movie") ||
    text.includes("music") ||
    text.includes("celebrity") ||
    text.includes("film") ||
    text.includes("actor")
  )
    return "entertainment"

  // Default to world news
  return "world"
}

async function fetchOGImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return undefined

    const html = await response.text()

    const ogImageMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i)

    if (ogImageMatch && ogImageMatch[1]) {
      return ogImageMatch[1]
    }

    const twitterImageMatch =
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["'][^>]*>/i)

    if (twitterImageMatch && twitterImageMatch[1]) {
      return twitterImageMatch[1]
    }

    return undefined
  } catch (error) {
    return undefined
  }
}

export async function GET() {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    })

    const allArticles = await Promise.all(
      RSS_FEEDS.map(async (feed) => {
        try {
          console.log(`[v0] Fetching ${feed.source} from ${feed.url}`)

          const response = await fetch(feed.url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
            },
            next: { revalidate: 300 },
          })

          if (!response.ok) {
            console.log(`[v0] Skipping ${feed.source}: ${response.status}`)
            return [] // Silently skip failed feeds
          }

          const xmlData = await response.text()
          const result = parser.parse(xmlData)

          const items = result.rss?.channel?.item || result.feed?.entry || []
          const itemsArray = Array.isArray(items) ? items : [items]

          console.log(`[v0] Successfully fetched ${itemsArray.length} articles from ${feed.source}`)

          const articles = await Promise.all(
            itemsArray.slice(0, 10).map(async (item: RSSItem, index: number) => {
              let imageUrl =
                item["media:thumbnail"]?.["@_url"] ||
                item["media:content"]?.["@_url"] ||
                item["media:group"]?.["media:content"]?.["@_url"] ||
                (item.enclosure?.["@_type"]?.startsWith("image") ? item.enclosure?.["@_url"] : undefined)

              if (!imageUrl && item.link) {
                imageUrl = await fetchOGImage(item.link)
              }

              const category = categorizeArticle(item.title || "", item.description || "", item.category)

              return {
                id: `${feed.source}-${index}-${Date.now()}`,
                title: item.title || "No title",
                description: item.description || item.summary || "No description available",
                link: item.link || "#",
                pubDate: item.pubDate || item.published || new Date().toISOString(),
                source: feed.source,
                imageUrl,
                category,
                region: feed.region, // Added region field
              }
            }),
          )

          return articles
        } catch (error) {
          console.log(
            `[v0] Skipping ${feed.source} due to error:`,
            error instanceof Error ? error.message : "Unknown error",
          )
          return []
        }
      }),
    )

    const articles = allArticles.flat().sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    console.log(`[v0] Total articles fetched: ${articles.length}`)

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("[v0] Error in news API:", error)
    return NextResponse.json({ error: "Failed to fetch news", articles: [] }, { status: 500 })
  }
}
