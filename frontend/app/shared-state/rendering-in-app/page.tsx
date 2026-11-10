"use client"; // HARNESS: needed in the App Router; the doc file omits it.
// --- Doc (verbatim): app/page.tsx ---
import { CopilotKit, CopilotSidebar } from "@copilotkit/react-core/v2";
import { Canvas } from "./components/Canvas"; // HARNESS: path; doc uses "../components/Canvas" from app/page.tsx

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="app-shell">
        {/* Your app UI, driven by agent.state */}
        <Canvas />
        {/* Chat is just another consumer of the same agent */}
        <CopilotSidebar />
      </div>
    </CopilotKit>
  );
}
