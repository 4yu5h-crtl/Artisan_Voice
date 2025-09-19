"use client"

import { Mic, Volume2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceIndicatorProps {
  isListening: boolean
  isSpeaking: boolean
  className?: string
}

export function VoiceIndicator({ isListening, isSpeaking, className }: VoiceIndicatorProps) {
  if (isSpeaking) {
    return (
      <div className={cn("flex items-center gap-2 text-blue-600", className)}>
        <Volume2 className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-medium">Speaking...</span>
      </div>
    )
  }

  if (isListening) {
    return (
      <div className={cn("flex items-center gap-2 text-red-600", className)}>
        <Mic className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-medium">Listening...</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5" />
      <span className="text-sm">Ready</span>
    </div>
  )
}
