"use client"; // HARNESS: App Router client page; not on the doc.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/sidebar (verbatim) ---
import { CopilotKit, CopilotSidebar } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

// HARNESS: MainContent and Suggestions are used by the doc but never defined. Minimal stubs.
function MainContent() {
  return <main style={{ padding: 24 }}><h1>Main content</h1></main>;
}
function Suggestions() {
  return null;
}

// HARNESS: the doc shows only the JSX fragment below, no component around it.
export default function PrebuiltSidebarPage() {
  return (
    // src/app/demos/prebuilt-sidebar/page.tsx
    <CopilotKit runtimeUrl="/api/copilotkit" agent="prebuilt-sidebar">
      <MainContent />
      <CopilotSidebar agentId="prebuilt-sidebar" defaultOpen={true} />
      <Suggestions />
    </CopilotKit>
  );
}
