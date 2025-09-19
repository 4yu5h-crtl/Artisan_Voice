"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mic, MicOff, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { speak } from "@/services/googleTTS"
import { Badge } from "@/components/ui/badge"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function ProductFactsPage() {
  const router = useRouter()
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [productFacts, setProductFacts] = useState("")
  const [isCollecting, setIsCollecting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const [transcript, setTranscript] = useState("")
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    // Get the selected image from session storage
    const image = sessionStorage.getItem("selectedImage")
    setSelectedImage(image)

    if (isVoiceEnabled && !hasStarted) {
      setHasStarted(true)
      initializeFactsCollection()
    }
  }, [isVoiceEnabled, hasStarted])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const initializeFactsCollection = async () => {
    const message =
      "Perfect! Now I'd love to hear about your craft. Tell me about your creation - the techniques you used, materials, inspiration, or what makes it special. I'll use both your image and story to create authentic Instagram content that showcases your artisan skills. Please start speaking and I'll listen for up to 3 seconds of silence."

    try {
      setIsSpeaking(true)
      await speak(message)
      setIsSpeaking(false)

      setTimeout(() => {
        if (isVoiceEnabled) {
          startFactsCollection()
        }
      }, 3000)
    } catch (error) {
      console.error("Voice initialization error:", error)
      setIsSpeaking(false)
    }
  }

  const startFactsCollection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      speak("Speech recognition is not supported in this browser.")
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    let finalTranscript = ""
    let silenceTimer: NodeJS.Timeout | null = null

    recognition.onstart = () => {
      console.log("[app] Speech recognition started for facts collection")
      setIsCollecting(true)
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript + interimTranscript)

      // Reset silence timer on new speech
      if (silenceTimer) {
        clearTimeout(silenceTimer)
      }

      // Start 3-second silence timer
      silenceTimer = setTimeout(() => {
        recognition.stop()
      }, 3000)
    }

    recognition.onend = async () => {
      console.log("[app] Speech recognition ended")
      setIsCollecting(false)
      if (silenceTimer) {
        clearTimeout(silenceTimer)
      }

      if (finalTranscript.trim()) {
        setProductFacts(finalTranscript.trim())
        setIsSpeaking(true)
        await speak(
          "Wonderful! Your craft story will make your Instagram post much more authentic and engaging. Now, where would you like to showcase this? Say 'Instagram' for social media, or 'E-commerce' for marketplaces.",
        )
        setIsSpeaking(false)
        setTimeout(() => startPlatformSelection(), 2000)
      } else {
        setIsSpeaking(true)
        await speak(
          "I didn't catch any details about your craft. I can still create a post from your image alone, or you can try sharing your story again.",
        )
        setIsSpeaking(false)
        setTimeout(() => startCommandListening(), 2000)
      }
    }

    recognition.onerror = async (event: any) => {
      console.error("[app] Speech recognition error:", event.error)
      setIsCollecting(false)
      setIsSpeaking(true)
      await speak("There was an error with speech recognition. You can try again or skip to platform selection.")
      setIsSpeaking(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const startPlatformSelection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase()
      console.log("[app] Platform command:", command)

      if (command.includes("instagram")) {
        handlePlatformSelection("instagram")
      } else if (command.includes("e-commerce") || command.includes("ecommerce") || command.includes("marketplace")) {
        handlePlatformSelection("ecommerce")
      } else if (command.includes("skip")) {
        handleSkipFacts()
      } else if (command.includes("try again") || command.includes("retry")) {
        startFactsCollection()
      } else {
        speak("Please say 'Instagram' for social media, 'E-commerce' for marketplaces, 'try again', or 'skip'.")
        setTimeout(() => startPlatformSelection(), 2000)
      }
    }

    recognition.start()
  }

  const startCommandListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase()
      console.log("[app] General command:", command)

      if (command.includes("try again") || command.includes("retry")) {
        startFactsCollection()
      } else if (command.includes("skip")) {
        handleSkipFacts()
      } else if (command.includes("instagram")) {
        handlePlatformSelection("instagram")
      } else {
        speak("You can say 'try again', 'skip', or 'Instagram'.")
        setTimeout(() => startCommandListening(), 2000)
      }
    }

    recognition.start()
  }

  const handleSkipFacts = async () => {
    setProductFacts("")
    setIsSpeaking(true)
    await speak(
      "Skipping craft details. Where would you like to showcase your work? Say 'Instagram' for social media or 'E-commerce' for marketplaces.",
    )
    setIsSpeaking(false)
    setTimeout(() => startPlatformSelection(), 2000)
  }

  const handlePlatformSelection = async (platform: string) => {
    if (platform === "instagram") {
      // Store product facts in session storage
      sessionStorage.setItem("productFacts", productFacts)
      sessionStorage.setItem("selectedPlatform", "instagram")
      setIsSpeaking(true)
      await speak(
        "Excellent choice! Instagram is perfect for showcasing your beautiful handmade work. Let me create your social media content...",
      )
      setIsSpeaking(false)
      router.push("/generate-post")
    } else if (platform === "ecommerce") {
      setIsSpeaking(true)
      await speak(
        "E-commerce platforms are coming soon! For now, let's create Instagram content to build your following. Redirecting...",
      )
      setIsSpeaking(false)
      sessionStorage.setItem("productFacts", productFacts)
      sessionStorage.setItem("selectedPlatform", "instagram")
      setTimeout(() => router.push("/generate-post"), 2000)
    }
  }

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled)
    if (!isVoiceEnabled) {
      speak("Voice mode enabled")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/select-image")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Craft Story</h1>
            <p className="text-muted-foreground">Tell me about your handmade creation</p>
          </div>
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Selected product"
                className="w-full h-48 object-cover"
              />
            </CardContent>
          </Card>
        )}

        {/* Voice Status */}
        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <VoiceIndicator isListening={isCollecting} isSpeaking={isSpeaking} className="flex-1" />
              <Button variant={isVoiceEnabled ? "default" : "outline"} size="sm" onClick={toggleVoice} className="ml-4">
                {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>
            {isCollecting && <p className="text-sm text-secondary mt-2">Listening for your craft story...</p>}
            {isSpeaking && <p className="text-sm text-primary mt-2">Speaking...</p>}
          </CardContent>
        </Card>

        {/* Facts Collection Area */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Your Craft Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transcript || productFacts ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-foreground">{transcript || productFacts}</p>
                </div>
                {!isCollecting && productFacts && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handlePlatformSelection("instagram")}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="lg"
                      >
                        Continue to Instagram
                      </Button>
                      <Button
                        onClick={() => handlePlatformSelection("ecommerce")}
                        variant="outline"
                        className="w-full relative"
                        size="lg"
                      >
                        E-commerce Platforms
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Coming Soon
                        </Badge>
                      </Button>
                    </div>
                    <Button onClick={startFactsCollection} variant="outline" className="w-full bg-transparent">
                      Add More Details
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Share Your Craft Story</h3>
                  <p className="text-muted-foreground text-sm">
                    Tell me about your creation - the techniques, materials, inspiration, or what makes it special as a
                    handmade piece
                  </p>
                </div>
                {!isCollecting && !isSpeaking && (
                  <div className="space-y-2">
                    <Button
                      onClick={startFactsCollection}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="lg"
                    >
                      Start Speaking
                    </Button>
                    <Button onClick={handleSkipFacts} variant="outline" className="w-full bg-transparent">
                      Skip Craft Details
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3">How it works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Share your craft's unique story and techniques</p>
              <p>• I'll listen and stop after 3 seconds of silence</p>
              <p>• Mention materials, inspiration, or special methods</p>
              <p>• Choose Instagram or E-commerce platforms (coming soon)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
