/**
 * Generate all suspect voice lines with ElevenLabs into public/audio.
 *
 *   ELEVENLABS_API_KEY=sk_xxx pnpm gen:audio
 *
 * Optional per-suspect voice overrides (ElevenLabs voice IDs):
 *   VOICE_CTO, VOICE_INTERN, VOICE_SENIOR_DEV
 *
 * Produces 24 files named  <suspect>-<question>-<innocent|guilty>.mp3
 * exactly matching what the app requests at runtime.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { audioManifest, type SuspectId } from '../src/content/case'

const API_KEY = process.env.ELEVENLABS_API_KEY
if (!API_KEY) {
  console.error('Set ELEVENLABS_API_KEY in your environment first.')
  process.exit(1)
}

// Defaults use ElevenLabs' stock voices; override via env for better casting.
const VOICES: Record<SuspectId, string> = {
  cto: process.env.VOICE_CTO ?? 'pNInz6obpgDQGcFmaJgB', // Adam — calm, composed
  intern: process.env.VOICE_INTERN ?? 'bIHbv24MWmeRgasZH58o', // Will — young, nervy
  senior_dev: process.env.VOICE_SENIOR_DEV ?? 'VR6AewLTigWG4xSOukaG', // Arnold — gruff, bitter
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio')

async function tts(voiceId: string, text: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY!, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.75 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

const lines = audioManifest()
await mkdir(outDir, { recursive: true })
console.log(`Generating ${lines.length} voice lines -> public/audio`)

for (const l of lines) {
  process.stdout.write(`  ${l.file} ... `)
  try {
    const audio = await tts(VOICES[l.suspect], l.text)
    await writeFile(join(outDir, l.file), audio)
    console.log('ok')
  } catch (e) {
    console.log('FAILED —', (e as Error).message)
  }
}
console.log('Done.')
