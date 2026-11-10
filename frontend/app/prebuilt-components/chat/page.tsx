"use client"; // HARNESS: App Router client page; not on the doc.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/chat (verbatim) ---
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

// HARNESS: useAgenticChatSuggestions is called by the doc but never defined or imported. No-op stub.
function useAgenticChatSuggestions() {}

// src/app/demos/agentic-chat/page.tsx
function Chat() {
  useAgenticChatSuggestions();
  return <CopilotChat agentId="agentic_chat" />;
}

// HARNESS: the doc shows only the JSX fragment below, no component around it.
export default function AgenticChatPage() {
  return (
    <div style={{ height: "100vh" }}>{/* HARNESS: give the inline chat a height */}
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agentic_chat">
      <Chat />
    </CopilotKit>
    </div>
  );
}
