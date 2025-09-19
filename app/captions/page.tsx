"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageSquare, Copy, Check, Loader2, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"
import { geminiService } from "@/services/geminiAI"

interface CaptionSet {
  main: string
  story: string
  short: string
  inspirational: string
}

export default function CaptionsPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userFacts, setUserFacts] = useState("")
  const [captions, setCaptions] = useState<CaptionSet | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isListeningForFacts, setIsListeningForFacts] = useState(false)
  const { speak, speakThenListen, listen, isListening, isSpeaking, lastCommand } = useVoiceLoop()

  useEffect(() => {
    const imageData = sessionStorage.getItem("selectedImage")
    if (imageData) {
      setSelectedImage(imageData)
      initializeVoiceLoop()
    } else {
      speak("No image found. Returning to home page.")
      router.push("/")
    }
  }, [])

  useEffect(() => {
    if (lastCommand && !isListeningForFacts) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand, isListeningForFacts])

  const initializeVoiceLoop = async () => {
    const message =
      "Ready to generate captions for your image! Would you like to provide any facts or details about the image first? Say 'add facts' to provide details, or 'generate' to create captions now."

    try {
      const command = await speakThenListen(message, 8000)
      if (command) {
        handleVoiceCommand(command)
      }
    } catch (error) {
      console.error("Voice loop error:", error)
    }
  }

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("back") || lowerCommand.includes("home")) {
      router.push("/")
    } else if (lowerCommand.includes("facts") || lowerCommand.includes("details") || lowerCommand.includes("add")) {
      handleAddFacts()
    } else if (
      lowerCommand.includes("generate") ||
      lowerCommand.includes("create") ||
      lowerCommand.includes("caption")
    ) {
      handleGenerateCaptions()
    } else if (lowerCommand.includes("hashtag") || lowerCommand.includes("seo") || lowerCommand.includes("tags")) {
      handleContinueToHashtags()
    } else if (lowerCommand.includes("copy") && captions) {
      const numbers = lowerCommand.match(/\d+/)
      if (numbers) {
        const index = Number.parseInt(numbers[0]) - 1
        if (index >= 0 && index < 4) {
          handleCopyCaption(index)
        }
      }
    } else {
      speak("You can say 'add facts', 'generate captions', 'hashtags', 'copy 1', or 'back'.")
    }
  }

  const handleAddFacts = async () => {
    setIsListeningForFacts(true)
    speak("Please tell me any facts or details about this image that should be included in the captions.")

    try {
      const facts = await listen(10000) // Longer timeout for facts
      if (facts) {
        setUserFacts(facts)
        speak(`Got it! I'll include these details: ${facts}. Say 'generate' to create captions now.`)
      }
    } catch (error) {
      speak("I didn't catch that. You can try again or say 'generate' to create captions without additional facts.")
    } finally {
      setIsListeningForFacts(false)
    }
  }

  const handleGenerateCaptions = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    speak("Generating engaging captions for your image. This may take a moment...")

    try {
      const result = await geminiService.generateCaptions(selectedImage, userFacts)
      const parsedCaptions = parseCaptionResponse(result)
      setCaptions(parsedCaptions)
      speak(
        "Captions generated successfully! I've created four different styles for you. Say 'copy' followed by a number to copy a caption, or 'hashtags' to generate hashtags.",
      )
    } catch (error) {
      console.error("Caption generation error:", error)
      speak("Sorry, there was an error generating captions. Please try again or go back.")
    } finally {
      setIsProcessing(false)
    }
  }

  const parseCaptionResponse = (response: string): CaptionSet => {
    // Simple parsing - in a real app, you'd want more robust parsing
    const lines = response.split("\n").filter((line) => line.trim())
    return {
      main:
        lines.find((line) => line.includes("main") || line.includes("Main"))?.replace(/^\d+\.?\s*/, "") ||
        lines[0] ||
        "Engaging caption for your image",
      story:
        lines.find((line) => line.includes("story") || line.includes("Story"))?.replace(/^\d+\.?\s*/, "") ||
        lines[1] ||
        "A detailed story about this moment captured in time.",
      short:
        lines.find((line) => line.includes("short") || line.includes("Short"))?.replace(/^\d+\.?\s*/, "") ||
        lines[2] ||
        "Perfect moment",
      inspirational:
        lines
          .find((line) => line.includes("inspirational") || line.includes("Inspirational"))
          ?.replace(/^\d+\.?\s*/, "") ||
        lines[3] ||
        "Inspiration captured in a single frame",
    }
  }

  const handleCopyCaption = async (index: number) => {
    if (!captions) return

    const captionArray = [captions.main, captions.story, captions.short, captions.inspirational]
    const caption = captionArray[index]

    try {
      await navigator.clipboard.writeText(caption)
      setCopiedIndex(index)
      speak(`Caption ${index + 1} copied to clipboard!`)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      speak("Unable to copy to clipboard.")
    }
  }

  const handleContinueToHashtags = () => {
    speak("Proceeding to hashtag generation...")
    router.push("/hashtags")
  }

  const captionTypes = [
    { label: "Main Caption", key: "main" as keyof CaptionSet, description: "Perfect for most posts" },
    { label: "Story Caption", key: "story" as keyof CaptionSet, description: "Detailed narrative" },
    { label: "Short & Punchy", key: "short" as keyof CaptionSet, description: "Quick impact" },
    { label: "Inspirational", key: "inspirational" as keyof CaptionSet, description: "Motivational tone" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generate Captions</h1>
            <p className="text-gray-600">AI-powered caption creation</p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
            {lastCommand && !isListeningForFacts && (
              <p className="text-sm text-gray-600 mt-2">Last command: "{lastCommand}"</p>
            )}
            {isListeningForFacts && <p className="text-sm text-blue-600 mt-2">Listening for image facts...</p>}
          </CardContent>
        </Card>

        {/* Image Preview */}
        {selectedImage && (
          <Card>
            <CardContent className="pt-6">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Selected for captions"
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* User Facts Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Additional Details (Optional)
            </CardTitle>
            <CardDescription>Add facts or context to improve caption quality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="e.g., This was taken at sunset in Paris, celebrating our anniversary..."
              value={userFacts}
              onChange={(e) => setUserFacts(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddFacts} variant="outline" size="sm" className="bg-transparent">
                Add via Voice
              </Button>
              <Button onClick={handleGenerateCaptions} size="sm" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Generate Captions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Processing State */}
        {isProcessing && (
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-lg font-medium">Creating captions...</span>
              </div>
              <p className="text-center text-gray-600 mt-2">AI is crafting engaging captions for your image</p>
            </CardContent>
          </Card>
        )}

        {/* Generated Captions */}
        {captions && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Captions</h3>
            {captionTypes.map((type, index) => (
              <Card key={type.key} className="border-2 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{type.label}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCaption(index)}
                      className="bg-transparent"
                    >
                      {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{captions[type.key]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Next Steps */}
        {captions && (
          <Button onClick={handleContinueToHashtags} className="w-full" size="lg">
            <Hash className="h-4 w-4 mr-2" />
            Generate Hashtags & SEO
          </Button>
        )}

        {/* Voice Commands */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Voice Commands</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {!captions ? (
                <>
                  <li>• "Add facts" - Provide image details</li>
                  <li>• "Generate" - Create captions</li>
                </>
              ) : (
                <>
                  <li>• "Copy 1/2/3/4" - Copy specific caption</li>
                  <li>• "Hashtags" - Generate hashtags</li>
                </>
              )}
              <li>• "Back" - Return to home page</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
