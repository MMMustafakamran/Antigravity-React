"use client"; // HARNESS: the snippet omits it.

// HARNESS: the snippet shows no imports.
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";

// HARNESS: useReasoningDefaultSuggestions is never shown on the page; no-op stand-in.
function useReasoningDefaultSuggestions() {}

// --- Doc: https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/reasoning-messages (verbatim) ---
// src/app/demos/reasoning-default/page.tsx
const AGENT_ID = "reasoning-default";

export default function ReasoningDefaultDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID}>
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useReasoningDefaultSuggestions();
  return <CopilotChat agentId={AGENT_ID} className="h-full rounded-2xl" />;
}
