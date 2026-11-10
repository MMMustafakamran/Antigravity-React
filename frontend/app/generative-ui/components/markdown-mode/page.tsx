"use client";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import { standardUI } from "@copilotkit/react-core/v2/generative-ui";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    // --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/markdown-mode "Turn it on" app/providers.tsx (verbatim) ---
    // HARNESS: agentId="antigravity_agent" on CopilotChat added (never named on the page); {children} is a CopilotChat.
    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: standardUI, transport: "markdown" }}>
      <CopilotChat agentId="antigravity_agent" />
    </CopilotKitProvider>
  );
}
