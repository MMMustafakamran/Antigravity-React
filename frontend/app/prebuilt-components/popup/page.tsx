"use client";
// Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/popup -- Code tab, src/app/demos/prebuilt-popup/page.tsx (verbatim)
import React from "react";
import { CopilotKit, CopilotPopup } from "@copilotkit/react-core/v2";
import { MainContent } from "./main-content";
import { Suggestions } from "./suggestions-mount";

export default function PrebuiltPopupDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="prebuilt-popup">
      <MainContent />
      <CopilotPopup
        agentId="prebuilt-popup"
        defaultOpen={true}
        labels={{
          chatInputPlaceholder: "Ask the popup anything...",
        }}
      />
      <Suggestions />
    </CopilotKit>
  );
}
