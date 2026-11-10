"use client"; // HARNESS: App Router client page; not on the doc.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/prebuilt-components/chat-controls (verbatim) ---
import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useCopilotChatConfiguration } from "@copilotkit/react-core/v2";

// HARNESS: `analytics` is used by the feedback snippet but never defined or imported. Console stub.
const analytics = { track: (...args: unknown[]) => console.log("analytics.track", ...args) };

function Layout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <nav>
        <button onClick={() => setChatOpen(true)}>Ask the assistant</button>
      </nav>

      {/* HARNESS: the doc's feedback messageView is passed here (doc: "The same messageView slot works on <CopilotSidebar>"). */}
      <CopilotSidebar
        open={chatOpen}
        onOpenChange={setChatOpen}
        messageView={{
          assistantMessage: {
            onThumbsUp: (message) => {
              analytics.track("feedback", { messageId: message.id, value: "up" });
            },
            onThumbsDown: (message) => {
              analytics.track("feedback", { messageId: message.id, value: "down" });
            },
          },
        }}
      />
      <OpenChatButton />
    </>
  );
}

function OpenChatButton() {
  const config = useCopilotChatConfiguration();

  // setModalOpen is only present when a provider in the tree owns modal state
  // (the prebuilt CopilotPopup / CopilotSidebar create it for you).
  if (!config?.setModalOpen) return null;

  return (
    <button onClick={() => config.setModalOpen(true)}>
      Ask the assistant
    </button>
  );
}

// HARNESS: no page export on the doc. Rendered under the root layout's <CopilotKit agent="antigravity_agent">.
export default function ChatControlsPage() {
  return <Layout />;
}
