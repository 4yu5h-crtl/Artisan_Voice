"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Instagram, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"

interface InstagramPost {
  caption: string
  hashtags: string[]
  altText: string
}

export default function EditPostPage() {
  const router = useRouter()
  const { speak, speakThenListen, isListening, isSpeaking, lastCommand } = useVoiceLoop()
  const [post, setPost] = useState<InstagramPost | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editedCaption, setEditedCaption] = useState("")
  const [editedHashtags, setEditedHashtags] = useState("")
  const [editedAltText, setEditedAltText] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    // Get data from session storage
    const image = sessionStorage.getItem("selectedImage")
    const postData = sessionStorage.getItem("generatedPost")

    setSelectedImage(image)

    if (postData) {
      const parsedPost = JSON.parse(postData)
      setPost(parsedPost)
      setEditedCaption(parsedPost.caption)
      setEditedHashtags(parsedPost.hashtags.join(" "))
      setEditedAltText(parsedPost.altText)
    }

    // Provide editing suggestions
    initializeEditingSuggestions()
  }, [])

  useEffect(() => {
    if (lastCommand) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  const initializeEditingSuggestions = async () => {
    const suggestions = [
      "Make the caption more personal and engaging",
      "Add trending hashtags for better reach",
      "Include a call-to-action in your caption",
      "Make the alt text more descriptive",
      "Add location-based hashtags if relevant",
      "Include brand-specific hashtags",
      "Make the tone more conversational",
      "Add emojis to make it more visually appealing",
    ]

    setSuggestions(suggestions)

    speak(
      "Here are some suggestions to improve your post: You can make the caption more personal, add trending hashtags, or include a call-to-action. Edit the fields below and say 'save' when ready, or 'post' to publish as is.",
    )
  }

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("back")) {
      router.push("/generate-post")
    } else if (lowerCommand.includes("save") || lowerCommand.includes("update")) {
      handleSaveChanges()
    } else if (lowerCommand.includes("post") || lowerCommand.includes("publish")) {
      handlePostToInstagram()
    } else if (lowerCommand.includes("suggestions") || lowerCommand.includes("help")) {
      speakSuggestions()
    } else {
      speak("You can say 'save' to update changes, 'post' to publish, or 'back' to go back.")
    }
  }

  const speakSuggestions = () => {
    const randomSuggestions = suggestions.slice(0, 3).join(", ")
    speak(`Here are some editing suggestions: ${randomSuggestions}`)
  }

  const handleSaveChanges = () => {
    if (!post) return

    const updatedPost: InstagramPost = {
      caption: editedCaption,
      hashtags: editedHashtags.split(" ").filter((tag) => tag.trim() !== ""),
      altText: editedAltText,
    }

    // Update session storage
    sessionStorage.setItem("generatedPost", JSON.stringify(updatedPost))
    setPost(updatedPost)

    speak("Changes saved successfully! Say 'post' to publish or continue editing.")
  }

  const handlePostToInstagram = () => {
    speak(
      "I would post this to Instagram now, but I need Instagram API credentials to do that. This feature requires Instagram Business API access.",
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading post data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/generate-post")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Instagram Post</h1>
            <p className="text-gray-600">Customize your content</p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
            {lastCommand && <p className="text-sm text-gray-600 mt-2">You said: "{lastCommand}"</p>}
          </CardContent>
        </Card>

        {/* Image Preview */}
        {selectedImage && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Product preview"
                className="w-full h-48 object-cover"
              />
            </CardContent>
          </Card>
        )}

        {/* Editing Form */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              Edit Post Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Caption</label>
              <Textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                placeholder="Write your Instagram caption..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hashtags</label>
              <Input
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2 #hashtag3"
              />
              <p className="text-xs text-gray-500">Separate hashtags with spaces</p>
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Alt Text</label>
              <Textarea
                value={editedAltText}
                onChange={(e) => setEditedAltText(e.target.value)}
                placeholder="Describe the image for accessibility..."
                className="min-h-[60px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="bg-blue-50/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              Editing Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSaveChanges}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button
            onClick={handlePostToInstagram}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            size="lg"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Post to Instagram
          </Button>
        </div>

        {/* Voice Commands */}
        <Card className="bg-gray-50/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Voice Commands</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• "Save" - Save your changes</p>
              <p>• "Post" - Publish to Instagram</p>
              <p>• "Suggestions" - Hear editing tips</p>
              <p>• "Back" - Return to post preview</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
