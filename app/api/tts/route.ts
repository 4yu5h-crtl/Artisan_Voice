import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, options = {} } = await request.json()

    const apiKey = process.env.GOOGLE_TTS_KEY
    if (!apiKey) {
      console.error("[app] TTS API key not found in environment variables")
      return NextResponse.json({ error: "TTS API key not configured" }, { status: 500 })
    }

    console.log("[app] Making TTS API request for text:", text.substring(0, 50) + "...")

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: options.languageCode || "en-US",
          name: options.voiceName || "en-US-Standard-A",
          ssmlGender: options.gender || "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: options.rate || 1.0,
          pitch: options.pitch || 0.0,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[app] TTS API error response:", response.status, errorText)

      if (response.status === 403) {
        return NextResponse.json(
          {
            error: "TTS API key is invalid or expired. Please check your Google TTS API key in Project Settings.",
          },
          { status: 403 },
        )
      }

      throw new Error(`TTS API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("[app] TTS API request successful")
    return NextResponse.json({ audioContent: data.audioContent })
  } catch (error) {
    console.error("[app] TTS API Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate speech",
      },
      { status: 500 },
    )
  }
}
