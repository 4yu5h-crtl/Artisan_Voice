import { voiceManager } from "./voiceManager.js"

class GoogleTTSService {
  constructor() {}

  async speak(text, options = {}) {
    console.log("[app] TTS speak called:", text.substring(0, 50) + "...")
    return voiceManager.queueSpeak(text, options)
  }
}

export const ttsService = new GoogleTTSService()
export const speak = (text, options = {}) => ttsService.speak(text, options)
