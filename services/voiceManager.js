class VoiceManager {
  constructor() {
    this.isCurrentlySpeaking = false
    this.isCurrentlyListening = false
    this.currentAudio = null
    this.speechQueue = []
    this.isProcessingQueue = false
    this.abortController = null
    this.pendingRequests = new Set()
  }

  // Stop all current voice activities
  stopAll() {
    console.log("[app] Stopping all voice activities")

    // Stop current audio
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }

    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    this.speechQueue = []
    this.isProcessingQueue = false

    // Abort any ongoing requests
    if (this.abortController) {
      this.abortController.abort()
    }

    this.pendingRequests.clear()

    this.isCurrentlySpeaking = false
    this.isCurrentlyListening = false
  }

  // Check if any voice activity is happening
  isActive() {
    return this.isCurrentlySpeaking || this.isCurrentlyListening
  }

  // Set speaking state
  setSpeaking(speaking) {
    this.isCurrentlySpeaking = speaking
  }

  // Set listening state
  setListening(listening) {
    this.isCurrentlyListening = listening
  }

  // Set current audio
  setCurrentAudio(audio) {
    this.currentAudio = audio
  }

  // Set abort controller
  setAbortController(controller) {
    this.abortController = controller
  }

  async processQueue() {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log("[app] Processing voice queue, items:", this.speechQueue.length)

    while (this.speechQueue.length > 0) {
      const { text, options, resolve, reject } = this.speechQueue.shift()

      try {
        console.log("[app] Speaking from queue:", text.substring(0, 50) + "...")
        await this.directSpeak(text, options)
        resolve()
      } catch (error) {
        console.error("[app] Queue speech error:", error)
        reject(error)
      }
    }

    this.isProcessingQueue = false
    console.log("[app] Voice queue processing complete")
  }

  async queueSpeak(text, options = {}) {
    const requestKey = text.substring(0, 50)
    if (this.pendingRequests.has(requestKey)) {
      console.log("[app] Duplicate request prevented:", requestKey)
      return
    }

    this.pendingRequests.add(requestKey)

    return new Promise((resolve, reject) => {
      // Clear any existing queue items to prevent overlaps
      this.speechQueue = []

      this.speechQueue.push({
        text,
        options,
        resolve: () => {
          this.pendingRequests.delete(requestKey)
          resolve()
        },
        reject: (error) => {
          this.pendingRequests.delete(requestKey)
          reject(error)
        },
      })
      console.log("[app] Added to voice queue:", text.substring(0, 50) + "...")
      this.processQueue()
    })
  }

  async directSpeak(text, options = {}) {
    const requestKey = text.substring(0, 50)
    if (this.isCurrentlySpeaking) {
      console.log("[app] Already speaking, ignoring duplicate request")
      return
    }

    // Stop any current voice activity first
    this.stopAll()

    try {
      this.isCurrentlySpeaking = true
      console.log("[app] Making TTS API request for text:", text.substring(0, 50) + "...")

      const abortController = new AbortController()
      this.abortController = abortController

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, options }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[app] TTS API request successful")

      if (data.error) {
        throw new Error(data.error)
      }

      return await this.playAudio(data.audioContent)
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("[app] TTS request aborted")
        return
      }
      console.error("[app] TTS Error:", error)
      return this.fallbackSpeak(text)
    } finally {
      this.isCurrentlySpeaking = false
      this.abortController = null
    }
  }

  async playAudio(base64Audio) {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`)
        this.currentAudio = audio

        audio.onended = () => {
          console.log("[app] Audio playback ended")
          this.currentAudio = null
          resolve()
        }
        audio.onerror = (error) => {
          console.error("[app] Audio playback error:", error)
          this.currentAudio = null
          reject(error)
        }

        console.log("[app] Starting audio playback")
        audio.play()
      } catch (error) {
        console.error("[app] Audio setup error:", error)
        this.currentAudio = null
        reject(error)
      }
    })
  }

  fallbackSpeak(text) {
    return new Promise((resolve) => {
      if ("speechSynthesis" in window) {
        // Cancel any existing speech
        window.speechSynthesis.cancel()

        console.log("[app] Using fallback speech synthesis")
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => {
          console.log("[app] Fallback speech ended")
          resolve()
        }
        utterance.onerror = (error) => {
          console.error("[app] Fallback speech error:", error)
          resolve()
        }

        window.speechSynthesis.speak(utterance)
      } else {
        console.warn("[app] Speech synthesis not supported")
        resolve()
      }
    })
  }
}

let voiceManagerInstance = null
export const voiceManager = voiceManagerInstance || (voiceManagerInstance = new VoiceManager())
