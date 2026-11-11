"use client";
// Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/sidebar -- Code tab, src/app/demos/prebuilt-sidebar/page.tsx (verbatim)
import React from "react";
import { CopilotKit, CopilotSidebar } from "@copilotkit/react-core/v2";
import { MainContent } from "./main-content";
import { Suggestions } from "./suggestions-mount";

export default function PrebuiltSidebarDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="prebuilt-sidebar">
      <MainContent />
      <CopilotSidebar agentId="prebuilt-sidebar" defaultOpen={true} />
      <Suggestions />
    </CopilotKit>
  );
}
