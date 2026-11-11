"use client";
// Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/chat -- Code tab, src/app/demos/agentic-chat/page.tsx (verbatim)
import React from "react";
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import { useAgenticChatSuggestions } from "./suggestions";

export default function AgenticChatDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agentic_chat">
      <Chat />
    </CopilotKit>
  );
}

function Chat() {
  useAgenticChatSuggestions();
  return <CopilotChat agentId="agentic_chat" />;
}
