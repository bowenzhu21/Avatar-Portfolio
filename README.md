# Bowen Voice Portfolio

A production-oriented Next.js App Router portfolio scaffold designed for a voice-first experience:

- HeyGen live avatar stage in the background
- Right-side evidence card overlay
- Bottom transcript/subtitle bar
- Click-to-toggle microphone control
- Deterministic `/api/voice-router` for navigation-aware orchestration
- Stubbed integration points for Gemini, HeyGen, and ElevenLabs

## Stack

- Next.js 15 App Router with TypeScript
- Tailwind CSS
- Zustand
- Framer Motion

## Routes

- `/`
- `/projects/matrix`
- `/projects/adapt-ui`
- `/projects/aura-dev`
- `/projects/elbow-exo`
- `/projects/gymbro`
- `/experience/heygen`
- `/experience/hippos-exoskeleton`
- `/experience/momenta`
- `/experience/jma-consulting`
- `/school`
- `/resume`
- `/contact`
- `/hobbies`

## Architecture

- `src/data/portfolio.ts`
  Central typed portfolio entity data for projects, experience, and other pages.
- `src/types`
  Shared domain and orchestration types.
- `src/components`
  Reusable overlay UI components with minimal business logic.
- `src/store/usePortfolioStore.ts`
  Global client state for active route/card/entity plus conversation status.
- `src/utils/portfolio.ts`
  Deterministic matching, confidence scoring, section inference, and comparison helpers.
- `app/api/voice-router/route.ts`
  Deterministic orchestration route that matches aliases and routes before any model fallback.
- `app/api/orchestrate/route.ts`
  Gemini placeholder endpoint for future server-side orchestration.
- `src/lib/heygen.ts`
  Stubbed HeyGen session lifecycle and speak interface.
- `src/lib/elevenlabs.ts`
  Stubbed ElevenLabs realtime transcription lifecycle.
- `src/lib/orchestrator.ts`
  Client integration layer for calling orchestration endpoints.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`:

```bash
NEXT_PUBLIC_HEYGEN_AVATAR_ID=your_avatar_id
NEXT_PUBLIC_HEYGEN_CONTEXT_ID=your_context_id
```

3. Run the app:

```bash
npm run dev
```

4. Build for verification:

```bash
npm run build
```

## Voice Routing

`/api/voice-router` accepts transcript plus current UI/session state and returns strict JSON:

- `intent`
- `entity`
- `route`
- `card`
- `section`
- `spokenResponse`
- `confidence`
- `followUpSuggestions`

Supported intents:

- `navigate`
- `answer`
- `navigate_and_answer`
- `compare`
- `clarify`
- `fallback`

## External Service TODOs

- Replace the placeholder HeyGen lifecycle with actual Streaming Avatar / LiveAvatar session management.
- Replace the placeholder ElevenLabs lifecycle with realtime microphone transcription.
- Add Gemini fallback orchestration inside `/api/orchestrate`.
