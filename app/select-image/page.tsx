"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Upload, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"

export default function SelectImagePage() {
  const router = useRouter()
  const { speak, speakThenListen, isListening, isSpeaking, lastCommand, error } = useVoiceLoop()
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)

  useEffect(() => {
    if (isVoiceEnabled) {
      initializeImageSelection()
    }
  }, [isVoiceEnabled])

  useEffect(() => {
    if (lastCommand && isVoiceEnabled) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  const initializeImageSelection = async () => {
    const message =
      "Now let's get your product image. You can say 'upload' to select from your gallery, or say 'capture' to take a new photo. What would you like to do?"

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

    if (lowerCommand.includes("upload") || lowerCommand.includes("gallery") || lowerCommand.includes("select")) {
      handleUploadImage()
    } else if (lowerCommand.includes("capture") || lowerCommand.includes("camera") || lowerCommand.includes("take")) {
      handleCaptureImage()
    } else if (lowerCommand.includes("help")) {
      speak("You can say 'upload' to select from gallery, or 'capture' to take a photo.")
    } else {
      speak("I didn't understand that command. Please say 'upload' or 'capture'.")
    }
  }

  const handleUploadImage = () => {
    router.push("/upload")
  }

  const handleCaptureImage = () => {
    router.push("/capture")
  }

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled)
    if (!isVoiceEnabled) {
      speak("Voice mode enabled")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Select Your Product Image</h1>
          <p className="text-gray-600">Choose how you want to add your product photo</p>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} className="flex-1" />
              <Button variant={isVoiceEnabled ? "default" : "outline"} size="sm" onClick={toggleVoice} className="ml-4">
                {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">Error: {error}</p>}
            {lastCommand && <p className="text-sm text-gray-600 mt-2">You said: "{lastCommand}"</p>}
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="space-y-4">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-white/80 backdrop-blur-sm"
            onClick={handleUploadImage}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Upload from Gallery</CardTitle>
              <CardDescription>Select an existing photo of your product</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
              >
                Choose from Gallery
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">Voice command: "Upload"</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-white/80 backdrop-blur-sm"
            onClick={handleCaptureImage}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl">Capture New Photo</CardTitle>
              <CardDescription>Take a fresh photo of your product</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                size="lg"
                variant="outline"
              >
                Open Camera
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">Voice command: "Capture"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
