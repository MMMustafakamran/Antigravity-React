"use client";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import { standardUI } from "@copilotkit/react-core/v2/generative-ui";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    // --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/theming first snippet (verbatim) ---
    // HARNESS: agentId="antigravity_agent" on CopilotChat added (the page never names the Antigravity agent).
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      generativeUI={{
        ui: standardUI,
        theme: {
          "--a2ui-color-accent": "#d97706",
          "--a2ui-font-family": "Inter, sans-serif",
          "--a2ui-radius-md": "10px",
        },
      }}
    >
      <CopilotChat agentId="antigravity_agent" />
    </CopilotKitProvider>
  );
}
