"use client"; // HARNESS: the doc snippet has no "use client"; CopilotKit/CopilotChat need it in an App Router page.

// HARNESS: the page.tsx tab shows no imports at all. Added the minimum so the snippet compiles.
import { CopilotKit, CopilotChat, CopilotChatReasoningMessage } from "@copilotkit/react-core/v2";
import { ReasoningBlock } from "./reasoning-block";
import { useReasoningCustomSuggestions } from "./suggestions";

// --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/reasoning (Custom reasoning rendering, page.tsx tab, verbatim) ---
// src/app/demos/reasoning-custom/page.tsx
const AGENT_ID = "reasoning-custom";

export default function ReasoningCustomDemo() {
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
  useReasoningCustomSuggestions();
  return (
    <CopilotChat
      agentId={AGENT_ID}
      className="h-full rounded-2xl"
      messageView={{
        reasoningMessage:
          ReasoningBlock as unknown as typeof CopilotChatReasoningMessage,
      }}
    />
  );
}
