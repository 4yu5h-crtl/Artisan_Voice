"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Instagram, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"

interface InstagramPost {
  caption: string
  hashtags: string[]
  altText: string
}

export default function GeneratePostPage() {
  const router = useRouter()
  const { speak, speakThenListen, isListening, isSpeaking, lastCommand } = useVoiceLoop()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<InstagramPost | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [productFacts, setProductFacts] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get data from session storage
    const image = sessionStorage.getItem("selectedImage")
    const facts = sessionStorage.getItem("productFacts") || ""

    setSelectedImage(image)
    setProductFacts(facts)

    // Start generation automatically
    if (image) {
      generateInstagramPost(image, facts)
    }
  }, [])

  useEffect(() => {
    if (lastCommand && generatedPost) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand, generatedPost])

  const generateInstagramPost = async (imageData: string, facts: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      const message = facts
        ? "Analyzing your beautiful craft and the story you shared to create the perfect Instagram post..."
        : "Analyzing your image to create engaging Instagram content..."

      speak(message)

      // Convert base64 to blob for API
      const response = await fetch(imageData)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append("image", blob, "product-image.jpg")
      formData.append("productFacts", facts)
      formData.append("platform", "instagram")

      const apiResponse = await fetch("/api/gemini/instagram-post", {
        method: "POST",
        body: formData,
      })

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.status}`)
      }

      const result = await apiResponse.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setGeneratedPost(result.post)

      const completionMessage = facts
        ? "Perfect! I've created your Instagram post using both your image and craft story. The caption highlights your unique techniques and materials. Say 'post' to publish or 'edit' to make changes."
        : "Your Instagram post is ready! I've created content based on your image. Say 'post' to publish or 'edit' to make changes."

      speak(completionMessage)
    } catch (error) {
      console.error("Generation error:", error)
      setError(error instanceof Error ? error.message : "Failed to generate post")
      speak("Sorry, I encountered an error generating your post. Please try again or go back to edit your details.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("back")) {
      router.push("/product-facts")
    } else if (lowerCommand.includes("post") || lowerCommand.includes("publish")) {
      handlePostToInstagram()
    } else if (lowerCommand.includes("edit") || lowerCommand.includes("modify") || lowerCommand.includes("change")) {
      handleEditPost()
    } else if (lowerCommand.includes("regenerate") || lowerCommand.includes("try again")) {
      if (selectedImage) {
        generateInstagramPost(selectedImage, productFacts)
      }
    } else {
      speak("You can say 'post' to publish, 'edit' to make changes, or 'back' to go back.")
    }
  }

  const handlePostToInstagram = () => {
    speak(
      "I would post this to Instagram now, but I need Instagram API credentials to do that. This feature requires Instagram Business API access.",
    )
    // Here you would integrate with Instagram API
    // For now, just show the error message as requested
  }

  const handleEditPost = () => {
    if (generatedPost) {
      // Store the generated post for editing
      sessionStorage.setItem("generatedPost", JSON.stringify(generatedPost))
      speak("Taking you to the edit page where you can modify your post...")
      router.push("/edit-post")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/product-facts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generate Instagram Post</h1>
            <p className="text-gray-600">AI-powered content creation</p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
            {lastCommand && <p className="text-sm text-gray-600 mt-2">You said: "{lastCommand}"</p>}
          </CardContent>
        </Card>

        {/* Generation Status */}
        {isGenerating && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Generating your Instagram post...</p>
                  <p className="text-sm text-gray-600">Analyzing image and creating content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Generation Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <Button
                  onClick={() => selectedImage && generateInstagramPost(selectedImage, productFacts)}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Post Preview */}
        {generatedPost && (
          <div className="space-y-4">
            {/* Instagram Post Template */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  Instagram Post Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image */}
                {selectedImage && (
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt={generatedPost.altText}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Caption */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Caption:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{generatedPost.caption}</p>
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Hashtags:</h4>
                  <div className="flex flex-wrap gap-1">
                    {generatedPost.hashtags.map((hashtag, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Alt Text:</h4>
                  <p className="text-sm text-gray-600 italic">{generatedPost.altText}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePostToInstagram}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                size="lg"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Post to Instagram
              </Button>
              <Button onClick={handleEditPost} variant="outline" className="w-full bg-transparent">
                <Sparkles className="h-4 w-4 mr-2" />
                Edit Post Content
              </Button>
              <Button
                onClick={() => selectedImage && generateInstagramPost(selectedImage, productFacts)}
                variant="outline"
                className="w-full"
              >
                Regenerate Content
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-gray-50/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Voice Commands</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• "Post" - Publish to Instagram</p>
              <p>• "Edit" - Modify the content</p>
              <p>• "Try again" - Regenerate content</p>
              <p>• "Back" - Return to product facts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
