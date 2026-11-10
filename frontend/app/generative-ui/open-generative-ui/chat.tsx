"use client";
// HARNESS: chat.tsx is imported by the page's Code tab but never shown; copied from showcase/integrations/google-antigravity (open-gen-ui).

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useOpenGenUISuggestions } from "./suggestions";

export function Chat() {
  useOpenGenUISuggestions();
  return <CopilotChat agentId="open-gen-ui" className="flex-1 rounded-2xl" />;
}
