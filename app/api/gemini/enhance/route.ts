import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, enhancementType, additionalContext = "" } = await request.json()

    const apiKey = process.env.GEMINI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const prompt = getEnhancementPrompt(enhancementType, additionalContext)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64.split(",")[1],
                  },
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const result = data.candidates[0].content.parts[0].text

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Gemini Enhancement Error:", error)
    return NextResponse.json({ error: "Failed to enhance image" }, { status: 500 })
  }
}

function getEnhancementPrompt(type: string, context: string) {
  const prompts = {
    amazon: `Analyze this product image and provide detailed enhancement suggestions for Amazon listings. Focus on:
    - Image quality improvements
    - Lighting and contrast adjustments
    - Background optimization
    - Product positioning
    - Text overlay suggestions
    ${context ? `Additional context: ${context}` : ""}`,

    instagram: `Analyze this image and provide enhancement suggestions for Instagram posts. Focus on:
    - Visual appeal and engagement
    - Color grading suggestions
    - Composition improvements
    - Filter recommendations
    - Story-telling elements
    ${context ? `Additional context: ${context}` : ""}`,

    general: `Analyze this image and provide general enhancement suggestions. Focus on:
    - Overall image quality
    - Lighting and exposure
    - Color balance
    - Composition
    - Technical improvements
    ${context ? `Additional context: ${context}` : ""}`,
  }

  return prompts[type as keyof typeof prompts] || prompts.general
}
