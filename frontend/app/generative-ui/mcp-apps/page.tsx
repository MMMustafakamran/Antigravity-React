"use client";
// HARNESS: the doc shows only the return block of src/app/demos/mcp-apps/page.tsx. Imports, Chat and the export are harness.
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";

function Chat() {
  return <CopilotChat agentId="mcp-apps" />;
}

export default function McpAppsPage() {
  // --- Doc (verbatim) ---
  // No `renderActivityMessages`, no `useRenderActivityMessage` — the
  // CopilotKitProvider auto-registers the built-in `MCPAppsActivityRenderer`
  // for the "mcp-apps" activity type. A plain <CopilotChat /> is enough.
  return (
    <CopilotKit runtimeUrl="/api/copilotkit-mcp-apps" agent="mcp-apps">
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
  // --- end doc ---
}
