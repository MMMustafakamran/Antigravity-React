"use client";
// HARNESS: page.tsx imports ./voice-chat, which the Voice doc page never shows (FINDINGS.md).
// A missing module is a global Turbopack build error that blanks EVERY route of the dev server,
// so this placeholder moves the failure onto this page only: it throws the same "not shown" error
// when the page renders. Nothing here implements voice; the page stays broken as published.
export function VoiceChat(): never {
  throw new Error("[HARNESS placeholder] ./voice-chat is imported by page.tsx but never shown on the Voice doc page");
}
