import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, userFacts = "", captionType = "general" } = await request.json()

    const apiKey = process.env.GEMINI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const prompt = `Analyze this image and generate engaging captions. ${userFacts ? `User provided facts: ${userFacts}` : ""}
    
    Please provide:
    1. A compelling main caption (1-2 sentences)
    2. A detailed story caption (3-4 sentences)
    3. A short punchy caption (under 10 words)
    4. An inspirational caption
    
    Make them engaging and suitable for social media.`

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
    console.error("Gemini Caption Error:", error)
    return NextResponse.json({ error: "Failed to generate captions" }, { status: 500 })
  }
}
