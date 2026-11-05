"use client";
// HARNESS: the doc shows only the hook call from src/app/demos/tool-rendering-default-catchall/page.tsx.
// Imports, provider and chat are harness; same agent as the per-tool page.
import { CopilotChat, CopilotKit, useDefaultRenderTool } from "@copilotkit/react-core/v2";

function Chat() {
  // --- Doc (verbatim) ---
  // Opt in to CopilotKit's built-in default tool-call card. Called with
  // no config so the package-provided `DefaultToolCallRenderer` is used
  // as the wildcard renderer — this is the "out-of-the-box" UI the cell
  // is meant to showcase.
  useDefaultRenderTool();
  // --- end doc ---
  return <CopilotChat agentId="tool-rendering" />;
}

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="tool-rendering">
      <Chat />
    </CopilotKit>
  );
}
