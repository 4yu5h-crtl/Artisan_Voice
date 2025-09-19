import { voiceManager } from "./voiceManager.js"

class GoogleSTTService {
  constructor() {
    this.isListening = false
    this.recognition = null
  }

  async startListening(options = {}) {
    // Stop any current voice activity before starting to listen
    voiceManager.stopAll()

    // Try Google STT API first, fallback to Web Speech API
    try {
      return await this.googleSTTListen(options)
    } catch (error) {
      console.log("[app] Google STT failed, falling back to Web Speech API:", error.message)
      return this.fallbackListen(options)
    }
  }

  // Use Google STT API with audio recording for better reliability
  async googleSTTListen(options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        voiceManager.setListening(true)
        this.isListening = true

        // Create MediaRecorder to capture audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        })

        const audioChunks = []
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
            const base64Audio = await this.blobToBase64(audioBlob)
            
            // Send to Google STT API
            const response = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioContent: base64Audio })
            })
            
            if (response.ok) {
              const data = await response.json()
              resolve(data.transcript || "")
            } else {
              const errorData = await response.json()
              reject(new Error(errorData.error || "STT API error"))
            }
          } catch (error) {
            reject(new Error("Failed to process audio: " + error.message))
          } finally {
            // Clean up
            stream.getTracks().forEach(track => track.stop())
            voiceManager.setListening(false)
            this.isListening = false
          }
        }

        // Start recording
        mediaRecorder.start()

        // Set timeout
        const timeout = options.timeout || 5000
        this.timeoutId = setTimeout(() => {
          if (this.isListening) {
            mediaRecorder.stop()
            stream.getTracks().forEach(track => track.stop())
            voiceManager.setListening(false)
            this.isListening = false
            resolve("") // Return empty string on timeout
          }
        }, timeout)

        // Store mediaRecorder for stopping
        this.mediaRecorder = mediaRecorder

      } catch (error) {
        voiceManager.setListening(false)
        this.isListening = false
        
        if (error.name === 'NotAllowedError') {
          reject(new Error("Microphone access denied. Please allow microphone permissions and refresh the page"))
        } else if (error.name === 'NotFoundError') {
          reject(new Error("Microphone not found. Please check your microphone connection"))
        } else {
          reject(new Error("Failed to access microphone: " + error.message))
        }
      }
    })
  }

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Use Web Speech API for real-time listening
  fallbackListen(options = {}) {
    return new Promise((resolve, reject) => {
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        reject(new Error("Speech recognition not supported in this browser"))
        return
      }

      // Check if we're on HTTPS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        reject(new Error("Speech recognition requires HTTPS"))
        return
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()

      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = options.language || "en-US"
      this.recognition.maxAlternatives = 1

      voiceManager.setListening(true)
      this.isListening = true

      this.recognition.onresult = (event) => {
        clearTimeout(this.timeoutId)
        const transcript = event.results[0][0].transcript
        voiceManager.setListening(false)
        this.isListening = false
        resolve(transcript)
      }

      this.recognition.onerror = (event) => {
        clearTimeout(this.timeoutId)
        voiceManager.setListening(false)
        this.isListening = false
        
        // Handle specific error types
        let errorMessage = `Speech recognition error: ${event.error}`
        if (event.error === 'network') {
          errorMessage = "Network error: Please check your internet connection and try again"
        } else if (event.error === 'not-allowed') {
          errorMessage = "Microphone access denied. Please allow microphone permissions and refresh the page"
        } else if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please try speaking again"
        } else if (event.error === 'audio-capture') {
          errorMessage = "Microphone not found. Please check your microphone connection"
        }
        
        reject(new Error(errorMessage))
      }

      this.recognition.onend = () => {
        clearTimeout(this.timeoutId)
        voiceManager.setListening(false)
        this.isListening = false
      }

      const timeout = options.timeout || 5000
      this.timeoutId = setTimeout(() => {
        if (this.isListening) {
          this.stopListening()
          resolve("") // Return empty string on timeout
        }
      }, timeout)

      try {
        this.recognition.start()
      } catch (error) {
        voiceManager.setListening(false)
        this.isListening = false
        reject(new Error("Failed to start speech recognition. Please try again"))
      }
    })
  }

  stopListening() {
    if (this.isListening) {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop()
      }
      if (this.recognition) {
        this.recognition.stop()
      }
      voiceManager.setListening(false)
      this.isListening = false
    }
  }
}

export const sttService = new GoogleSTTService()
