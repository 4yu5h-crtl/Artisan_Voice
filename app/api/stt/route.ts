import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { audioContent, text } = await request.json()

    const apiKey = process.env.GOOGLE_STT_KEY
    if (!apiKey) {
      console.error("[app] STT API key not found in environment variables")
      return NextResponse.json({ error: "STT API key not configured" }, { status: 500 })
    }

    // If text is provided (fallback from Web Speech API), return it
    if (text) {
      return NextResponse.json({ transcript: text })
    }

    // If audioContent is provided, use Google STT API
    if (!audioContent) {
      return NextResponse.json({ error: "No audio content provided" }, { status: 400 })
    }

    console.log("[app] Making STT API request for audio content")

    const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
          model: "latest_long",
        },
        audio: {
          content: audioContent,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[app] STT API error response:", response.status, errorText)
      
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: "STT API key is invalid or expired. Please check your Google STT API key in Project Settings.",
          },
          { status: 403 },
        )
      }

      throw new Error(`STT API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("[app] STT API request successful")
    
    const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || ""
    
    if (!transcript) {
      return NextResponse.json({ error: "No speech detected in audio" }, { status: 400 })
    }

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error("[app] STT API Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 },
    )
  }
}
