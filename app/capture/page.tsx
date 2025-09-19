"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, ArrowLeft, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"

export default function CapturePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isContinuousListening, setIsContinuousListening] = useState(false)
  const { speak, speakThenListen, listen, isListening, isSpeaking, lastCommand } = useVoiceLoop()

  useEffect(() => {
    initializeCamera()
    initializeVoiceLoop()

    return () => {
      setIsContinuousListening(false)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (lastCommand) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  const initializeVoiceLoop = async () => {
    const message = "Camera is ready! Say 'capture' to take a photo, or 'back' to return to the image selection page."

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
      router.push("/select-image")
    } else if (lowerCommand.includes("capture") || lowerCommand.includes("take") || lowerCommand.includes("photo")) {
      if (!capturedImage) {
        handleCapture()
      } else {
        speak("Photo already captured. Say 'retake' for a new photo or 'continue' to proceed.")
      }
    } else if (lowerCommand.includes("retake") || lowerCommand.includes("again")) {
      handleRetake()
    } else if (lowerCommand.includes("continue") || lowerCommand.includes("proceed") || lowerCommand.includes("next")) {
      if (capturedImage) {
        handleContinue()
      } else {
        speak("Please capture a photo first.")
      }
    } else {
      speak("You can say 'capture', 'retake', 'continue', or 'back'.")
    }
  }

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error("Camera access error:", error)
      speak("Unable to access camera. Please check permissions.")
    }
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageData)
        speak("Photo captured successfully! Say 'continue' to proceed, or 'retake' for a new photo.")
        startContinuousListening()
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setIsContinuousListening(false)
    speak("Ready to take a new photo. Say 'capture' when ready.")
  }

  const handleContinue = () => {
    if (capturedImage) {
      setIsContinuousListening(false)
      sessionStorage.setItem("selectedImage", capturedImage)
      sessionStorage.setItem("imageFileName", `captured-${Date.now()}.jpg`)
      speak("Perfect! Now let's gather some details about your product...")
      router.push("/product-facts")
    }
  }

  const startContinuousListening = async () => {
    console.log("[app] Starting continuous listening for continue command")
    setIsContinuousListening(true)

    const listenForCommand = async () => {
      if (!isContinuousListening) return

      try {
        const command = await listen(5000)
        if (command && isContinuousListening) {
          console.log("[app] Continuous listening received:", command)
          handleVoiceCommand(command)
        }

        // Continue listening if still in continuous mode
        if (isContinuousListening) {
          setTimeout(listenForCommand, 1000)
        }
      } catch (error) {
        console.error("[app] Continuous listening error:", error)
        if (isContinuousListening) {
          setTimeout(listenForCommand, 2000)
        }
      }
    }

    // Start the listening loop
    setTimeout(listenForCommand, 1000)
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
            <h1 className="text-2xl font-bold text-foreground">Capture Product Photo</h1>
            <p className="text-muted-foreground">Take a photo of your handmade creation</p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-primary/20 bg-card shadow-sm">
          <CardContent className="pt-6">
            <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
            {lastCommand && <p className="text-sm text-muted-foreground mt-2">You said: "{lastCommand}"</p>}
          </CardContent>
        </Card>

        {/* Camera/Preview Area */}
        <Card className="overflow-hidden bg-card">
          <CardContent className="p-0">
            {capturedImage ? (
              <div className="relative">
                <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-64 object-cover" />
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover bg-muted" />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted text-foreground">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p>Loading camera...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {capturedImage ? (
            <>
              <Button
                onClick={handleContinue}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                Continue with This Photo
              </Button>
              <Button onClick={handleRetake} variant="outline" className="w-full bg-transparent">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Photo
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCapture}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
              disabled={!isStreaming}
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
          )}
        </div>

        {/* Voice Commands */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-2">Voice Commands</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {capturedImage ? (
                <>
                  <li>• "Continue" - Proceed with this photo</li>
                  <li>• "Retake" - Take a new photo</li>
                </>
              ) : (
                <li>• "Capture" - Take a photo</li>
              )}
              <li>• "Back" - Return to image selection</li>
            </ul>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
