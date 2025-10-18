import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { title, description, link, apiKey } = await request.json()

    console.log("[v0] Summarize request received")

    if (!title && !description) {
      return NextResponse.json({ error: "Title or description is required" }, { status: 400 })
    }

    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 })
    }

    const content = `${title}\n\n${description || ""}`

    try {
      console.log("[v0] Calling OpenAI API for summarization")

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "당신은 뉴스 기사를 요약하는 전문가입니다. 핵심 내용만 간결하게 3-4문장으로 요약해주세요.",
            },
            {
              role: "user",
              content: `다음 뉴스 기사를 한국어로 요약해주세요:\n\n${content}`,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      console.log("[v0] OpenAI API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] OpenAI API error response:", errorText)

        if (response.status === 401) {
          return NextResponse.json(
            { error: "Invalid API key. Please check your OpenAI API key in settings." },
            { status: 401 },
          )
        }

        if (response.status === 429) {
          return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
        }

        return NextResponse.json({ error: `OpenAI API error: ${response.statusText}` }, { status: response.status })
      }

      const data = await response.json()
      console.log("[v0] Summary generated successfully")

      const summary = data.choices?.[0]?.message?.content || "요약을 생성할 수 없습니다."

      return NextResponse.json({ summary })
    } catch (apiError: any) {
      console.error("[v0] OpenAI API error:", apiError)
      console.error("[v0] Error details:", apiError.message)

      return NextResponse.json({ error: "Failed to call OpenAI API. Please check your API key." }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Summarization error:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return NextResponse.json({ error: "Failed to generate summary. Please try again." }, { status: 500 })
  }
}
