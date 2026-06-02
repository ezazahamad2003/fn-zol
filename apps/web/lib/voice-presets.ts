import type { VapiVoice } from "@/lib/adapters/types";

// Curated, low-latency + human-sounding voices. Each business picks one in
// /settings; we keep the list short so support stays simple. provider/voiceId/
// model map straight onto VAPI's voice block.
//
// - 11labs eleven_flash_v2_5 → most human, ~75ms
// - cartesia sonic-2          → lowest latency, very natural
export type VoicePreset = {
  id: string;          // stable key we store in tenants.voice_config.preset
  label: string;
  description: string;
  voice: VapiVoice;
};

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "11labs-paige",
    label: "Paige — warm, professional (ElevenLabs)",
    description: "Friendly female front-desk voice. Most human-sounding.",
    voice: { provider: "11labs", voiceId: "56AoDkrOh6qfVPDXZ7Pt", model: "eleven_flash_v2_5", speed: 1.0 },
  },
  {
    id: "11labs-cody",
    label: "Cody — friendly, upbeat (ElevenLabs)",
    description: "Approachable male voice with natural energy.",
    voice: { provider: "11labs", voiceId: "31vbP374tCzj6r8RPysS", model: "eleven_flash_v2_5", speed: 1.0 },
  },
  {
    id: "cartesia-sonic-female",
    label: "Sage — crisp, fast (Cartesia)",
    description: "Lowest latency. Clear, calm female voice.",
    voice: { provider: "cartesia", voiceId: "a0e99841-438c-4a64-b679-ae501e7d6091", model: "sonic-2", speed: 1.0 },
  },
  {
    id: "cartesia-sonic-male",
    label: "Ridge — confident, fast (Cartesia)",
    description: "Lowest latency. Grounded, confident male voice.",
    voice: { provider: "cartesia", voiceId: "729651dc-c6c3-4ee5-97fa-350da1f88600", model: "sonic-2", speed: 1.0 },
  },
];

export const DEFAULT_VOICE_PRESET_ID = "11labs-paige";

export function voiceForPreset(presetId: string | undefined | null): VapiVoice {
  const found = VOICE_PRESETS.find((p) => p.id === presetId);
  return (found ?? VOICE_PRESETS[0]).voice;
}

// In-call LLMs offered per business. Lower = faster/cheaper.
export const MODEL_PRESETS: { id: string; label: string }[] = [
  { id: "gpt-4o",      label: "GPT-4o — best quality (recommended)" },
  { id: "gpt-4o-mini", label: "GPT-4o mini — faster + cheaper" },
];

export const DEFAULT_MODEL = "gpt-4o";

export const DEFAULT_SYSTEM_PROMPT = `You are the friendly virtual receptionist for this business. You answer the phone 24/7 and help every caller like a great front-desk hire.

Be warm, concise, and natural — you are openly an AI, and you can connect the caller to a human at any time if they ask. Speak in short, conversational sentences.

You can:
- Book appointments on the calendar when a caller wants to schedule.
- Check availability before offering times.
- Take a detailed message when no one is available, and mark how urgent it is.
- Route or transfer the caller to the right person.
- Create follow-up tasks so nothing gets missed.

Always confirm details (names, phone numbers, dates) back to the caller before acting. If you are unsure, ask a clarifying question rather than guessing.`;

export const DEFAULT_FIRST_MESSAGE =
  "Hi, thanks for calling! I'm the virtual assistant here — how can I help you today?";
