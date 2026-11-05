"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { ToolRenderers } from "./tool-renderers";

export default function Page() {
return (
  <CopilotKit runtimeUrl="/api/copilotkit" agent="tool-rendering">
    <ToolRenderers />
    <CopilotChat agentId="tool-rendering" />
  </CopilotKit>
);
}
