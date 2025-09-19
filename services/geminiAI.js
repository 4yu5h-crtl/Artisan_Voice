class GeminiAIService {
  constructor() {}

  async enhanceImage(imageBase64, enhancementType, additionalContext = "") {
    try {
      const response = await fetch("/api/gemini/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          enhancementType,
          additionalContext,
        }),
      })

      if (!response.ok) {
        throw new Error(`Enhancement API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data.result
    } catch (error) {
      console.error("Gemini Enhancement Error:", error)
      throw error
    }
  }

  async generateCaptions(imageBase64, userFacts = "", captionType = "general") {
    try {
      const response = await fetch("/api/gemini/captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          userFacts,
          captionType,
        }),
      })

      if (!response.ok) {
        throw new Error(`Captions API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data.result
    } catch (error) {
      console.error("Gemini Caption Error:", error)
      throw error
    }
  }

  async generateHashtags(imageBase64, context = "") {
    try {
      const response = await fetch("/api/gemini/hashtags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error(`Hashtags API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data.result
    } catch (error) {
      console.error("Gemini Hashtag Error:", error)
      throw error
    }
  }
}

export const geminiService = new GeminiAIService()
