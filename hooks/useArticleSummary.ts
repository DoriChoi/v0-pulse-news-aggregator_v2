import { useState } from "react"

/**
 * 기사 AI 요약 커스텀 훅
 * OpenAI API를 사용하여 기사 요약 생성
 */
export function useArticleSummary() {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 기사 요약 생성
   */
  const generateSummary = async (title: string, description: string, link: string) => {
    // API 키 확인
    const apiKey = localStorage.getItem("openai_api_key")

    if (!apiKey) {
      setSummary("OpenAI API 키를 먼저 설정해주세요. (우측 상단 설정 버튼)")
      setError("API key not found")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          link,
          apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to summarize")
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      console.error("[v0] Error summarizing article:", err)
      const errorMessage = "요약을 생성하는데 실패했습니다."
      setSummary(errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 요약 초기화
   */
  const resetSummary = () => {
    setSummary(null)
    setError(null)
    setIsLoading(false)
  }

  return {
    summary,
    isLoading,
    error,
    generateSummary,
    resetSummary,
  }
}
