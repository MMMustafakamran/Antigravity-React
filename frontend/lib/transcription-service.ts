// --- Doc: https://docs.copilotkit.ai/google-antigravity/voice (Custom transcription backends, verbatim) ---
// src/lib/transcription-service.ts
import { TranscriptionServiceOpenAI } from "@copilotkit/voice";
import { OpenAI } from "openai";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1";

export function createTranscriptionService(
  env: NodeJS.ProcessEnv = process.env,
): TranscriptionServiceOpenAI | undefined {
  const apiKey = env.OPENAI_TRANSCRIPTION_API_KEY;
  if (!apiKey) return undefined;

  return new TranscriptionServiceOpenAI({
    openai: new OpenAI({
      apiKey,
      baseURL: env.OPENAI_TRANSCRIPTION_BASE_URL ?? OPENAI_TRANSCRIPTION_URL,
    }),
  });
}
