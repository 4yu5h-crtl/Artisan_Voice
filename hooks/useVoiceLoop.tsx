"use client"

import { useState, useCallback, useEffect } from "react"
import { ttsService } from "@/services/googleTTS"
import { sttService } from "@/services/googleSTT"
import { voiceManager } from "@/services/voiceManager"

export function useVoiceLoop() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastCommand, setLastCommand] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      console.log("[app] useVoiceLoop cleanup - stopping all voice activities")
      voiceManager.stopAll()
    }
  }, [])

  const speak = useCallback(async (text: string) => {
    try {
      console.log("[app] useVoiceLoop speak:", text.substring(0, 50) + "...")
      setIsSpeaking(true)
      setError(null)
      if (voiceManager.isCurrentlySpeaking) {
        console.log("[app] Already speaking, skipping duplicate request")
        return
      }
      await ttsService.speak(text)
    } catch (err) {
      console.error("[app] useVoiceLoop speak error:", err)
      setError(err instanceof Error ? err.message : "Speech error")
    } finally {
      setIsSpeaking(false)
    }
  }, [])

  const listen = useCallback(async (timeout = 5000, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        setIsListening(true)
        setError(null)
        const command = await sttService.startListening({ timeout })
        setLastCommand(command)
        return command
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Listening error"
        
        if (attempt < retries && errorMessage.includes("Network error")) {
          // Wait before retry for network errors
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        
        setError(errorMessage)
        return ""
      } finally {
        setIsListening(false)
      }
    }
    return ""
  }, [])

  const speakThenListen = useCallback(
    async (text: string, timeout = 5000) => {
      await speak(text)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return await listen(timeout)
    },
    [speak, listen],
  )

  const stopListening = useCallback(() => {
    sttService.stopListening()
    setIsListening(false)
  }, [])

  const stopAll = useCallback(() => {
    voiceManager.stopAll()
    setIsListening(false)
    setIsSpeaking(false)
  }, [])

  return {
    speak,
    listen,
    speakThenListen,
    stopListening,
    stopAll,
    isListening,
    isSpeaking,
    lastCommand,
    error,
    isActive: isListening || isSpeaking,
  }
}
