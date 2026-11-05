// --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components step 3 (verbatim, except agent) ---
"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { standardUI } from "@copilotkit/react-core/v2/generative-ui";
import "@copilotkit/react-core/v2/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // HARNESS: agent="antigravity_agent" added. The doc's provider targets "default" (its TanStack
    // BuiltInAgent); "Already have CopilotKit running? Do step 3 only" means using the existing agent.
    <CopilotKitProvider runtimeUrl="/api/copilotkit" agent="antigravity_agent" generativeUI={{ ui: standardUI }}>
      {children}
    </CopilotKitProvider>
  );
}
