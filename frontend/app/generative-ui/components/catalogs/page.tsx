"use client";
// HARNESS: route wrapper. Doc's provider line ("Then give it to the provider") + agentId="antigravity_agent" on CopilotChat (the page never names the Antigravity agent) + a CopilotChat to talk to it.
import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { shopUI } from "./catalog";

export default function Page() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit-gui" /* HARNESS: doc says "/api/copilotkit"; the doc's own [[...slug]] runtime (GET+POST) is served at /api/copilotkit-gui, see app/api/copilotkit-gui */ generativeUI={{ ui: shopUI }}>
      <CopilotChat agentId="antigravity_agent" />
    </CopilotKitProvider>
  );
}
