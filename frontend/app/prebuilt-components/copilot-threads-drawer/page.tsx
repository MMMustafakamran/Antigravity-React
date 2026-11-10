"use client"; // HARNESS: the doc snippet has no "use client"; the providers are client components.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/copilot-threads-drawer (Set up the Threads Drawer, verbatim) ---
// app/page.tsx
import {
  CopilotKitProvider,
  CopilotChatConfigurationProvider,
  CopilotChat,
  CopilotThreadsDrawer,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <CopilotChatConfigurationProvider>
        <div style={{ display: "flex", height: "100dvh" }}>
          <CopilotThreadsDrawer />
          <CopilotChat />
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}
