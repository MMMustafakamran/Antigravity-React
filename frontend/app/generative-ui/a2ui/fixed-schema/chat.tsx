"use client";
// HARNESS: chat.tsx is imported by the page's Code tab but never shown; copied from showcase/integrations/google-antigravity (a2ui-fixed-schema).

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useA2UIFixedSchemaSuggestions } from "./suggestions";

export function Chat() {
  useA2UIFixedSchemaSuggestions();
  return (
    <CopilotChat agentId="a2ui-fixed-schema" className="h-full rounded-2xl" />
  );
}
