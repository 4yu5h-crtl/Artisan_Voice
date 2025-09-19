"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Palette, Heart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoiceIndicator } from "@/components/VoiceIndicator"
import { useVoiceLoop } from "@/hooks/useVoiceLoop"

export default function WelcomePage() {
  const router = useRouter()
  const { speak, speakThenListen, isListening, isSpeaking, lastCommand, error } = useVoiceLoop()
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (isVoiceEnabled && !hasStarted) {
      initializeWelcome()
    }
  }, [isVoiceEnabled])

  useEffect(() => {
    if (lastCommand && isVoiceEnabled) {
      handleVoiceCommand(lastCommand)
    }
  }, [lastCommand])

  const initializeWelcome = async () => {
    const welcomeMessage =
      "Welcome to Artisan Voice! This platform helps local artisans create beautiful marketing content for their handmade products. Whether you're a potter, woodworker, jewelry maker, or any other craftsperson, I'll help you tell your story. Please say 'start' to begin showcasing your craft."

    try {
      const command = await speakThenListen(welcomeMessage, 10000)
      if (command) {
        handleVoiceCommand(command)
      }
    } catch (error) {
      console.error("Voice loop error:", error)
    }
  }

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes("start") || lowerCommand.includes("begin")) {
      handleStart()
    } else if (lowerCommand.includes("help")) {
      speak("Please say 'start' to begin showcasing your artisan products.")
    } else {
      speak("I didn't understand that. Please say 'start' to begin.")
    }
  }

  const handleStart = () => {
    setHasStarted(true)
    speak("Wonderful! Let's showcase your beautiful handmade products. Redirecting to image selection...")
    setTimeout(() => {
      router.push("/select-image")
    }, 2000)
  }

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled)
    if (!isVoiceEnabled) {
      speak("Voice mode enabled")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-8 pt-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Palette className="h-12 w-12 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="mb-2">
              For Local Artisans
            </Badge>
            <h1 className="text-4xl font-bold text-foreground text-balance">Artisan Voice</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Create compelling marketing content for your handmade products with AI-powered storytelling
            </p>
          </div>
        </div>

        {/* Voice Status */}
        <Card className="border-2 border-primary/20 bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} className="flex-1" />
              <Button variant={isVoiceEnabled ? "default" : "outline"} size="sm" onClick={toggleVoice} className="ml-4">
                {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>
            {error && (
              <div className="text-sm text-destructive mt-2 p-2 bg-destructive/10 rounded">
                <p className="font-medium">Voice Error:</p>
                <p>{error}</p>
                {error.includes("Network error") && (
                  <p className="text-xs mt-1">Try refreshing the page or check your internet connection</p>
                )}
                {error.includes("Microphone access denied") && (
                  <p className="text-xs mt-1">Click the microphone icon in your browser's address bar to allow access</p>
                )}
              </div>
            )}
            {lastCommand && <p className="text-sm text-muted-foreground mt-2">You said: "{lastCommand}"</p>}
          </CardContent>
        </Card>

        {/* Start Button */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-card border-primary/10"
          onClick={handleStart}
        >
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Showcase?</h2>
            <p className="text-muted-foreground mb-6">
              Say "start" or tap here to begin creating content for your handmade products
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Start Creating
            </Button>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-primary/10">
            <CardContent className="pt-4 pb-4 text-center">
              <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-foreground">Authentic Stories</h3>
              <p className="text-xs text-muted-foreground">Share your craft's unique journey</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/10">
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-foreground">Connect Locally</h3>
              <p className="text-xs text-muted-foreground">Reach your community</p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3 text-center">How it works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  1
                </div>
                <span>Upload or capture your handmade product</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  2
                </div>
                <span>Share your craft's story and techniques</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  3
                </div>
                <span>AI creates compelling marketing content</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  4
                </div>
                <span>Share across multiple platforms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
