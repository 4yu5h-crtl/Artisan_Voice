"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Hash, Search, Copy, Check, Loader2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"
import { geminiService } from "@/services/geminiAI"

interface HashtagData {
  hashtags: string[]
  seo_keywords: string[]
  niche_hashtags: string[]
}

export default function HashtagsPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [hashtagData, setHashtagData] = useState<HashtagData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const { speak, speakThenListen, isListening, isSpeaking, lastCommand } = useVoiceLoop()

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
    if (lastCommand) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  const initializeVoiceLoop = async () => {
    const message =
      "Ready to generate hashtags and SEO tags for your image! Say 'generate' to create trending hashtags, or 'back' to return home."

    try {
      const command = await speakThenListen(message, 6000)
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
    } else if (
      lowerCommand.includes("generate") ||
      lowerCommand.includes("create") ||
      lowerCommand.includes("hashtag")
    ) {
      handleGenerateHashtags()
    } else if (lowerCommand.includes("copy")) {
      if (lowerCommand.includes("hashtag") || lowerCommand.includes("trending")) {
        handleCopySection("hashtags")
      } else if (lowerCommand.includes("seo") || lowerCommand.includes("keyword")) {
        handleCopySection("seo")
      } else if (lowerCommand.includes("niche")) {
        handleCopySection("niche")
      } else if (lowerCommand.includes("all")) {
        handleCopyAll()
      }
    } else if (lowerCommand.includes("done") || lowerCommand.includes("finish")) {
      handleFinish()
    } else {
      speak("You can say 'generate', 'copy hashtags', 'copy seo', 'copy all', or 'back'.")
    }
  }

  const handleGenerateHashtags = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    speak("Generating trending hashtags and SEO keywords for your image. This may take a moment...")

    try {
      const result = await geminiService.generateHashtags(selectedImage)
      const parsedData = parseHashtagResponse(result)
      setHashtagData(parsedData)
      speak(
        "Hashtags and SEO tags generated successfully! I've created trending hashtags, SEO keywords, and niche-specific tags. Say 'copy hashtags', 'copy seo', or 'copy all' to copy them.",
      )
    } catch (error) {
      console.error("Hashtag generation error:", error)
      speak("Sorry, there was an error generating hashtags. Please try again or go back.")
    } finally {
      setIsProcessing(false)
    }
  }

  const parseHashtagResponse = (response: string): HashtagData => {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          hashtags: parsed.hashtags || [],
          seo_keywords: parsed.seo_keywords || [],
          niche_hashtags: parsed.niche_hashtags || [],
        }
      }
    } catch (error) {
      // Fallback to text parsing
    }

    // Fallback parsing
    const lines = response.split("\n").filter((line) => line.trim())
    const hashtags: string[] = []
    const seoKeywords: string[] = []
    const nicheHashtags: string[] = []

    lines.forEach((line) => {
      if (line.includes("#")) {
        const tags = line.match(/#\w+/g)
        if (tags) hashtags.push(...tags)
      } else if (line.toLowerCase().includes("seo") || line.toLowerCase().includes("keyword")) {
        const words = line.split(/[,\s]+/).filter((word) => word.length > 2)
        seoKeywords.push(...words)
      }
    })

    return {
      hashtags: hashtags.length > 0 ? hashtags : ["#trending", "#viral", "#amazing"],
      seo_keywords: seoKeywords.length > 0 ? seoKeywords : ["trending", "viral", "popular"],
      niche_hashtags: nicheHashtags.length > 0 ? nicheHashtags : ["#niche", "#specific"],
    }
  }

  const handleCopySection = async (section: string) => {
    if (!hashtagData) return

    let textToCopy = ""
    switch (section) {
      case "hashtags":
        textToCopy = hashtagData.hashtags.join(" ")
        break
      case "seo":
        textToCopy = hashtagData.seo_keywords.join(", ")
        break
      case "niche":
        textToCopy = hashtagData.niche_hashtags.join(" ")
        break
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedSection(section)
      speak(`${section} copied to clipboard!`)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      speak("Unable to copy to clipboard.")
    }
  }

  const handleCopyAll = async () => {
    if (!hashtagData) return

    const allText = [
      "HASHTAGS:",
      hashtagData.hashtags.join(" "),
      "\nSEO KEYWORDS:",
      hashtagData.seo_keywords.join(", "),
      "\nNICHE HASHTAGS:",
      hashtagData.niche_hashtags.join(" "),
    ].join("\n")

    try {
      await navigator.clipboard.writeText(allText)
      setCopiedSection("all")
      speak("All hashtags and keywords copied to clipboard!")
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      speak("Unable to copy to clipboard.")
    }
  }

  const handleFinish = () => {
    speak("Great job! Your image has been fully processed. Returning to home page.")
    // Clear session storage
    sessionStorage.removeItem("selectedImage")
    sessionStorage.removeItem("imageFileName")
    router.push("/")
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
            <h1 className="text-2xl font-bold text-gray-900">Hashtags & SEO</h1>
            <p className="text-gray-600">Trending tags and keywords</p>
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
                alt="Selected for hashtags"
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        {!hashtagData && !isProcessing && (
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Hash className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generate Hashtags</h3>
                  <p className="text-gray-600">Create trending hashtags and SEO keywords</p>
                </div>
                <Button onClick={handleGenerateHashtags} size="lg" className="w-full">
                  <Hash className="h-4 w-4 mr-2" />
                  Generate Tags
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="text-lg font-medium">Generating hashtags...</span>
              </div>
              <p className="text-center text-gray-600 mt-2">AI is analyzing trends and creating optimal tags</p>
            </CardContent>
          </Card>
        )}

        {/* Generated Hashtags */}
        {hashtagData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Tags</h3>

            {/* Trending Hashtags */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">Trending Hashtags</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySection("hashtags")}
                    className="bg-transparent"
                  >
                    {copiedSection === "hashtags" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>Popular hashtags for maximum reach</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hashtagData.hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO Keywords */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">SEO Keywords</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySection("seo")}
                    className="bg-transparent"
                  >
                    {copiedSection === "seo" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>Keywords for search optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hashtagData.seo_keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="border-blue-200 text-blue-700">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Niche Hashtags */}
            <Card className="border-2 border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-base">Niche Hashtags</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySection("niche")}
                    className="bg-transparent"
                  >
                    {copiedSection === "niche" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>Targeted tags for specific audiences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hashtagData.niche_hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={handleCopyAll} className="w-full" size="lg">
                {copiedSection === "all" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy All Tags
              </Button>
              <Button onClick={handleFinish} variant="outline" className="w-full bg-transparent">
                <Home className="h-4 w-4 mr-2" />
                Finish & Go Home
              </Button>
            </div>
          </div>
        )}

        {/* Voice Commands */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Voice Commands</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {!hashtagData ? (
                <li>• "Generate" - Create hashtags and SEO tags</li>
              ) : (
                <>
                  <li>• "Copy hashtags" - Copy trending hashtags</li>
                  <li>• "Copy SEO" - Copy SEO keywords</li>
                  <li>• "Copy all" - Copy everything</li>
                  <li>• "Finish" - Complete and go home</li>
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
