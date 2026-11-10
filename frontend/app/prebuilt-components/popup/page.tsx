"use client"; // HARNESS: App Router client page; not on the doc.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/popup (verbatim) ---
import { CopilotKit, CopilotPopup } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

// HARNESS: MainContent and Suggestions are used by the doc but never defined. Minimal stubs.
function MainContent() {
  return <main style={{ padding: 24 }}><h1>Main content</h1></main>;
}
function Suggestions() {
  return null;
}

// HARNESS: the doc shows only the JSX fragment below, no component around it.
export default function PrebuiltPopupPage() {
  return (
    // src/app/demos/prebuilt-popup/page.tsx
    <CopilotKit runtimeUrl="/api/copilotkit" agent="prebuilt-popup">
      <MainContent />
      <CopilotPopup
        agentId="prebuilt-popup"
        defaultOpen={true}
        labels={{
          chatInputPlaceholder: "Ask the popup anything...",
        }}
      />
      <Suggestions />
    </CopilotKit>
  );
}
