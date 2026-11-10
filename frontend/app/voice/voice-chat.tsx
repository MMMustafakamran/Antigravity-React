"use client";
// HARNESS: page.tsx imports ./voice-chat, which the Voice doc page never shows (FINDINGS.md #63).
// A missing module is a global Turbopack build error that blanks EVERY route of the dev server,
// so this placeholder moves the failure onto this page only: it throws the same "not shown" error
// once the page is in the browser (not during SSR, so the route answers 200 and the recorder can
// still reach the doc evidence afterwards). Nothing here implements voice; the page stays broken.
import { useEffect, useState } from "react";

export function VoiceChat() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted) {
    throw new Error("[HARNESS placeholder] ./voice-chat is imported by page.tsx but never shown on the Voice doc page");
  }
  return null;
}
