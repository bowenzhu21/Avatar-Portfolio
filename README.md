# Bowen Voice Portfolio

A production-oriented Next.js App Router portfolio scaffold designed for a voice-first experience:

- HeyGen live avatar stage in the background
- Right-side evidence card overlay
- Bottom transcript/subtitle bar
- Click-to-toggle microphone control
- Deterministic `/api/voice-router` for navigation-aware orchestration
- Stubbed integration points for Gemini, HeyGen, and ElevenLabs

## Environment Variables

Place secrets in `.env.local` at the project root.

```bash
GEMINI_API_KEY=your_gemini_key
HEYGEN_API_KEY=your_heygen_key
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Rules:

- `GEMINI_API_KEY`, `HEYGEN_API_KEY`, and `ELEVENLABS_API_KEY` are server-only.
- `NEXT_PUBLIC_APP_URL` is the only value intentionally exposed to the client.
- `.env.local` is gitignored and should not be committed.

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
- `src/config/env.server.ts`
  Server-only environment loader that validates required keys before protected integrations run.
- `src/config/env.client.ts`
  Minimal client-safe config surface for public values only.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_key
HEYGEN_API_KEY=your_heygen_key
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

## Config Loading

- Avatar identity is static in `src/config/avatar.ts`.
- Public app metadata reads `NEXT_PUBLIC_APP_URL` through `src/config/env.client.ts`.
- Secret keys are loaded only through `src/config/env.server.ts`, which uses `server-only` and throws if required values are missing when a server integration is invoked.
- Client components should not import the server env loader.
