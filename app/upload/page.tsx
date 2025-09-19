"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, ArrowLeft, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isActivelyListening, setIsActivelyListening] = useState(false)
  const { speak, speakThenListen, listen, isListening, isSpeaking, lastCommand } = useVoiceLoop()

  useEffect(() => {
    initializeVoiceLoop()
  }, [])

  useEffect(() => {
    if (lastCommand) {
      console.log("[app] Voice command received:", lastCommand)
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  useEffect(() => {
    if (selectedImage && !isListening && !isSpeaking && !isActivelyListening) {
      startContinuousListening()
    }
  }, [selectedImage, isListening, isSpeaking])

  const initializeVoiceLoop = async () => {
    const message =
      "You're on the upload page. Please select an image from your gallery, or say 'back' to return to the image selection page."

    try {
      const command = await speakThenListen(message, 6000)
      if (command) {
        handleVoiceCommand(command)
      }
    } catch (error) {
      console.error("Voice loop error:", error)
    }
  }

  const startContinuousListening = async () => {
    if (isActivelyListening) return

    setIsActivelyListening(true)
    console.log("[app] Starting continuous listening for continue command")

    try {
      while (selectedImage && !isSpeaking) {
        const command = await listen(10000) // Listen for 10 seconds
        if (command) {
          console.log("[app] Continuous listening received:", command)
          handleVoiceCommand(command)
          break // Exit loop after handling command
        }
        // Small delay before listening again
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
    console.error("[app] Continuous listening error:", error)
    } finally {
      setIsActivelyListening(false)
    }
  }

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()
    console.log("[app] Processing command:", lowerCommand)

    if (lowerCommand.includes("back") || lowerCommand.includes("home")) {
      router.push("/select-image")
    } else if (lowerCommand.includes("select") || lowerCommand.includes("choose") || lowerCommand.includes("upload")) {
      handleFileSelect()
    } else if (lowerCommand.includes("continue") || lowerCommand.includes("next")) {
      if (selectedImage) {
        handleContinue()
      } else {
        speak("Please select an image first.")
        setTimeout(() => startContinuousListening(), 2000)
      }
    } else {
      speak("You can say 'select image', 'continue', or 'back' to go home.")
      setTimeout(() => startContinuousListening(), 2000)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      speak("Please select a valid image file.")
    }
  }

  const handleContinue = () => {
    if (selectedImage && imageFile) {
      setIsActivelyListening(false)
      sessionStorage.setItem("selectedImage", selectedImage)
      sessionStorage.setItem("imageFileName", imageFile.name)
      speak("Great! Now let's collect some information about your product...")
      router.push("/product-facts")
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
            <Badge variant="secondary" className="mb-1">
              For Local Artisans
            </Badge>
            <h1 className="text-2xl font-bold text-foreground">Upload Product Image</h1>
            <p className="text-muted-foreground">Select your handmade product photo</p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-primary/20 bg-card shadow-sm">
          <CardContent className="pt-6">
            <VoiceIndicator isListening={isListening || isActivelyListening} isSpeaking={isSpeaking} />
            {lastCommand && <p className="text-sm text-muted-foreground mt-2">You said: "{lastCommand}"</p>}
            {isActivelyListening && <p className="text-sm text-secondary mt-1">Listening for "continue" command...</p>}
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-primary/30 bg-card">
          <CardContent className="pt-6">
            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt="Selected"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Image selected successfully!</p>
                  <div className="space-y-2">
                    <Button
                      onClick={handleContinue}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="lg"
                    >
                      Continue with This Image
                    </Button>
                    <Button onClick={handleFileSelect} variant="outline" className="w-full bg-transparent">
                      Select Different Image
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Select an Image</h3>
                  <p className="text-muted-foreground">Choose an image of your handmade creation</p>
                </div>
                <Button
                  onClick={handleFileSelect}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose from Gallery
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Commands */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-2">Voice Commands</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• "Select image" - Choose from gallery</li>
              <li>• "Continue" - Proceed with selected image</li>
              <li>• "Back" - Return to image selection</li>
            </ul>
          </CardContent>
        </Card>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  )
}
