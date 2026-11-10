"use client";
// HARNESS: chat.tsx is imported by the page's Code tab but never shown; copied from showcase/integrations/google-antigravity (declarative-gen-ui).

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useDeclarativeGenUISuggestions } from "./suggestions";
import { useSalesAnalystContext } from "./sales-context";

export function Chat() {
  useDeclarativeGenUISuggestions();
  useSalesAnalystContext();
  return (
    <CopilotChat agentId="declarative-gen-ui" className="h-full rounded-2xl" />
  );
}
