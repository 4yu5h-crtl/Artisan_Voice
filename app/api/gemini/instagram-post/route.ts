import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const productFacts = formData.get("productFacts") as string
    const platform = formData.get("platform") as string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const geminiApiKey = process.env.GEMINI_KEY
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString("base64")

    const prompt = `
    You are creating an Instagram post for a local artisan showcasing their handmade craft. 

    ARTISAN'S STORY & CONTEXT: ${productFacts || "No additional context provided"}
    
    Please analyze both the image AND the artisan's story above to create authentic, engaging content that:
    
    1. CAPTION (2-3 sentences):
       - Incorporate specific details from the artisan's story (techniques, materials, inspiration mentioned)
       - Highlight the handmade/artisan aspect
       - Use a warm, authentic tone that reflects the craft community
       - Include relevant emojis that match the craft type
       - If no story provided, focus on what you see in the image
    
    2. HASHTAGS (10-15 tags):
       - Mix of craft-specific tags based on the story/image
       - Local artisan and handmade community tags
       - Material-specific tags if mentioned in the story
       - Technique-specific tags if mentioned
       - General engagement tags
    
    3. ALT TEXT:
       - Describe the visual elements for accessibility
       - Include craft type and key materials if visible
    
    Format as JSON:
    {
      "caption": "engaging caption incorporating the artisan's story",
      "hashtags": ["#handmade", "#artisan", "#craft", ...],
      "altText": "descriptive alt text"
    }
    
    IMPORTANT: If the artisan shared their story, weave those specific details into the caption naturally. Their personal touch and techniques are what make their work unique.
    `

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
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
                    mime_type: image.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", errorText)
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
    }

    const result = await response.json()

    if (!result.candidates || result.candidates.length === 0) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 })
    }

    const generatedText = result.candidates[0].content.parts[0].text

    try {
      const postContent = parseInstagramResponse(generatedText)

      return NextResponse.json({
        success: true,
        post: postContent,
      })
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError)
      console.error("Raw response:", generatedText)
      return NextResponse.json({ error: "Failed to parse generated content" }, { status: 500 })
    }
  } catch (error) {
    console.error("Instagram post generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function parseInstagramResponse(response: string) {
  try {
    // First, try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      const cleanJson = jsonMatch[1].trim()
      return JSON.parse(cleanJson)
    }
  } catch (error) {
    console.error("JSON parsing failed, trying fallback:", error)
  }

  // Fallback parsing if JSON extraction fails
  const lines = response.split("\n").filter((line) => line.trim())
  let caption = ""
  const hashtags: string[] = []
  let altText = ""

  let currentSection = ""

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    if (lowerLine.includes("caption") && !lowerLine.includes("alt")) {
      currentSection = "caption"
      // Extract caption text after colon or quotes
      const captionMatch = line.match(/caption[^:]*:?\s*["']?([^"'\n]+)["']?/i)
      if (captionMatch) {
        caption = captionMatch[1].trim()
      }
    } else if (lowerLine.includes("hashtag")) {
      currentSection = "hashtags"
      // Extract hashtags from the line
      const hashtagMatches = line.match(/#\w+/g)
      if (hashtagMatches) {
        hashtags.push(...hashtagMatches)
      }
    } else if (lowerLine.includes("alt")) {
      currentSection = "altText"
      const altMatch = line.match(/alt[^:]*:?\s*["']?([^"'\n]+)["']?/i)
      if (altMatch) {
        altText = altMatch[1].trim()
      }
    } else if (currentSection === "caption" && line.trim() && !line.includes(":")) {
      // Continue building caption from multiple lines
      caption += " " + line.trim()
    } else if (currentSection === "hashtags") {
      // Look for more hashtags in subsequent lines
      const moreHashtags = line.match(/#\w+/g)
      if (moreHashtags) {
        hashtags.push(...moreHashtags)
      }
    }
  }

  // Ensure we have some content even if parsing fails
  return {
    caption: caption || "Check out this amazing product! 🌟",
    hashtags: hashtags.length > 0 ? hashtags : ["#product", "#amazing", "#musthave"],
    altText: altText || "Product image",
  }
}
