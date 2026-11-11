"use client";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import { standardUI } from "@copilotkit/react-core/v2/generative-ui";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    // --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/transports "Tool transport" (verbatim) ---
    // HARNESS: agentId="antigravity_agent" on CopilotChat added. The page's only agent guidance is "For a LangGraph Python agent, add CopilotKitMiddleware".
    <CopilotKitProvider runtimeUrl="/api/copilotkit-gui" /* HARNESS: doc says "/api/copilotkit"; the doc's own [[...slug]] runtime (GET+POST) is served at /api/copilotkit-gui, see app/api/copilotkit-gui */ generativeUI={{ ui: standardUI }}>
      <CopilotChat agentId="antigravity_agent" />
    </CopilotKitProvider>
  );
}
