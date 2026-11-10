"use client"; // HARNESS: the doc snippet has no "use client"; CopilotChat is a client component.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/multimodal-attachments (Quick start, verbatim) ---
import { CopilotChat } from "@copilotkit/react-core/v2";

// HARNESS: the doc shows a bare JSX fragment, no component or export. Wrapped in a default export.
// Rendered under the root layout's <CopilotKit>. Agent "my-agent" is registered in api/copilotkit/route.ts (HARNESS).
export default function MultimodalAttachmentsPage() {
  return (
    <div style={{ height: "100vh" }}>
<CopilotChat
  agentId="my-agent"
  attachments={{ enabled: true }} // [!code highlight]
/>
    </div>
  );
}
