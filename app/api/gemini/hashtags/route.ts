import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, context = "" } = await request.json()

    const apiKey = process.env.GEMINI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const prompt = `Analyze this image and generate trending hashtags and SEO tags. ${context ? `Additional context: ${context}` : ""}
    
    Please provide:
    1. 10-15 trending hashtags relevant to the image
    2. 5-10 SEO keywords
    3. 3-5 niche-specific hashtags
    
    Format as JSON with arrays for hashtags, seo_keywords, and niche_hashtags.`

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
    console.error("Gemini Hashtag Error:", error)
    return NextResponse.json({ error: "Failed to generate hashtags" }, { status: 500 })
  }
}
