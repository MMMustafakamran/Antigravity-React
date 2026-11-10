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
    // HARNESS: doc runtimeUrl is "/api/copilotkit"; the harness main route runs without Intelligence, so this points at
    // the Intelligence runtime (app/api/copilotkit-threads, the headless-threads page's server.ts). The page shows no runtime code.
    <CopilotKitProvider runtimeUrl="/api/copilotkit-threads">
      <CopilotChatConfigurationProvider>
        <div style={{ display: "flex", height: "100dvh" }}>
          <CopilotThreadsDrawer />
          <CopilotChat />
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}
