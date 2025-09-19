"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, ShoppingBag, Instagram, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"
import { geminiService } from "@/services/geminiAI"

export default function EnhancePage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [enhancementType, setEnhancementType] = useState<string | null>(null)
  const [enhancementResult, setEnhancementResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { speak, speakThenListen, isListening, isSpeaking, lastCommand } = useVoiceLoop()

  useEffect(() => {
    // Load image from previous page
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
    if (lastCommand) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  const initializeVoiceLoop = async () => {
    const message =
      "Image loaded successfully! Would you like me to enhance this for Amazon, Instagram, or general use? You can also say 'captions' to generate captions instead."

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
    } else if (lowerCommand.includes("amazon")) {
      handleEnhancement("amazon")
    } else if (lowerCommand.includes("instagram")) {
      handleEnhancement("instagram")
    } else if (lowerCommand.includes("general")) {
      handleEnhancement("general")
    } else if (lowerCommand.includes("caption") || lowerCommand.includes("story")) {
      handleContinueToCaption()
    } else if (lowerCommand.includes("hashtag") || lowerCommand.includes("seo")) {
      handleContinueToHashtags()
    } else {
      speak("Please say 'Amazon', 'Instagram', 'general', 'captions', or 'back'.")
    }
  }

  const handleEnhancement = async (type: string) => {
    if (!selectedImage) return

    setEnhancementType(type)
    setIsProcessing(true)
    speak(`Analyzing your image for ${type} enhancement. This may take a moment...`)

    try {
      const result = await geminiService.enhanceImage(selectedImage, type)
      setEnhancementResult(result)
      speak(
        `Enhancement analysis complete! I've provided detailed suggestions for optimizing your image for ${type}. Say 'captions' to generate captions, 'hashtags' for SEO tags, or 'back' to return home.`,
      )
    } catch (error) {
      console.error("Enhancement error:", error)
      speak("Sorry, there was an error analyzing your image. Please try again or go back.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinueToCaption = () => {
    speak("Proceeding to caption generation...")
    router.push("/captions")
  }

  const handleContinueToHashtags = () => {
    speak("Proceeding to hashtag generation...")
    router.push("/hashtags")
  }

  const getEnhancementIcon = (type: string) => {
    switch (type) {
      case "amazon":
        return <ShoppingBag className="h-6 w-6" />
      case "instagram":
        return <Instagram className="h-6 w-6" />
      default:
        return <Zap className="h-6 w-6" />
    }
  }

  const getEnhancementColor = (type: string) => {
    switch (type) {
      case "amazon":
        return "bg-orange-100 text-orange-600 border-orange-200"
      case "instagram":
        return "bg-pink-100 text-pink-600 border-pink-200"
      default:
        return "bg-blue-100 text-blue-600 border-blue-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enhance Image</h1>
            <p className="text-gray-600">AI-powered image optimization</p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
            {lastCommand && <p className="text-sm text-gray-600 mt-2">Last command: "{lastCommand}"</p>}
          </CardContent>
        </Card>

        {/* Image Preview */}
        {selectedImage && (
          <Card>
            <CardContent className="pt-6">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Selected for enhancement"
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Enhancement Options */}
        {!enhancementResult && !isProcessing && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Choose Enhancement Type</h3>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleEnhancement("amazon")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Amazon Optimization</CardTitle>
                    <CardDescription>Perfect for product listings</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleEnhancement("instagram")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Instagram className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Instagram Ready</CardTitle>
                    <CardDescription>Optimized for social media</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleEnhancement("general")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">General Enhancement</CardTitle>
                    <CardDescription>Overall image improvement</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-lg font-medium">Analyzing image...</span>
              </div>
              <p className="text-center text-gray-600 mt-2">
                AI is examining your image for optimization opportunities
              </p>
            </CardContent>
          </Card>
        )}

        {/* Enhancement Results */}
        {enhancementResult && enhancementType && (
          <Card className={`border-2 ${getEnhancementColor(enhancementType)}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getEnhancementColor(enhancementType)}`}>
                  {getEnhancementIcon(enhancementType)}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {enhancementType.charAt(0).toUpperCase() + enhancementType.slice(1)} Enhancement
                  </CardTitle>
                  <CardDescription>AI analysis complete</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{enhancementResult}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {enhancementResult && (
          <div className="space-y-3">
            <Button onClick={handleContinueToCaption} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Captions
            </Button>
            <Button onClick={handleContinueToHashtags} variant="outline" className="w-full bg-transparent">
              Generate Hashtags & SEO
            </Button>
          </div>
        )}

        {/* Voice Commands */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Voice Commands</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {!enhancementResult ? (
                <>
                  <li>• "Amazon" - Optimize for Amazon</li>
                  <li>• "Instagram" - Optimize for Instagram</li>
                  <li>• "General" - General enhancement</li>
                </>
              ) : (
                <>
                  <li>• "Captions" - Generate captions</li>
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
