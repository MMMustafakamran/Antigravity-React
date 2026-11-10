"use client";
// HARNESS: page.tsx imports ./voice-chat, which the Voice doc page never shows (FINDINGS.md #63).
// Without this file Next fails with "Module not found: Can't resolve './voice-chat'", a global
// Turbopack build error that blanks EVERY route of the dev server, so the other pages could not be
// recorded. This placeholder keeps that failure on this page only: it implements nothing and just
// prints the error a reader gets, so the clip shows the page is unusable as published.
// (The class name lets the recorder see the page has loaded and go on to the doc evidence.)
export function VoiceChat() {
  return (
    <div className="copilotKit-harness-missing-voice-chat" style={{ padding: 32, fontFamily: "monospace", color: "#b91c1c" }}>
      <p>Module not found: Can&apos;t resolve &apos;./voice-chat&apos;</p>
      <p>(./voice-chat is imported by page.tsx but never shown on the Voice doc page. Harness placeholder, no voice UI.)</p>
    </div>
  );
}
