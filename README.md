# Voice-First Mobile Web App

A React-based voice-first mobile web app that integrates with Google TTS, Google STT, and Gemini API for image enhancement, caption generation, and hashtag creation.

## Features

- **Voice-First Interface**: Complete voice navigation and interaction
- **Image Processing**: Upload from gallery or capture with camera
- **AI Enhancement**: Optimize images for Amazon, Instagram, or general use
- **Caption Generation**: Create engaging captions with AI
- **Hashtag & SEO**: Generate trending hashtags and SEO keywords

## Setup Instructions

### 1. Environment Variables

You need to set up the following environment variables in your Vercel project settings or `.env.local` file:

- `GOOGLE_TTS_KEY` - Google Cloud Text-to-Speech API key
- `GOOGLE_STT_KEY` - Google Cloud Speech-to-Text API key  
- `GEMINI_KEY` - Google Gemini API key

**Important**: These are server-side environment variables and should NOT have the `NEXT_PUBLIC_` prefix for security.

### 2. API Key Setup

1. **Google Cloud APIs**:
   - Enable Text-to-Speech API and Speech-to-Text API in Google Cloud Console
   - Create API keys for both services
   
2. **Gemini API**:
   - Get your Gemini API key from Google AI Studio

### 3. Deployment

1. Deploy to Vercel or your preferred platform
2. Add environment variables in your deployment platform's settings
3. Grant microphone and camera permissions when prompted

## Voice Commands

- **Home**: "Upload image" or "Capture image"
- **Enhancement**: "Amazon", "Instagram", "General"
- **Captions**: "Add facts", "Generate captions"
- **Hashtags**: "Generate", "Copy hashtags", "Copy all"
- **Navigation**: "Back" or "Home" on any page

## Security

All API keys are handled server-side through secure API routes. No sensitive credentials are exposed to the client.

## Fallbacks

- Web Speech API fallback for TTS/STT when Google APIs are unavailable
- Graceful error handling for all AI services
- Works without API keys (limited functionality)
