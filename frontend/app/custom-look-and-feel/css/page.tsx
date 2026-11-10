"use client"; // HARNESS: CopilotChat with props needs a client component in the App Router.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/css ---
// src/app/demos/chat-customization-css/page.tsx
import "./theme.css";
// --- doc import ends ---

// HARNESS: the page never shows the component that applies `.chat-css-demo-scope`; minimal wrapper
// around <CopilotChat>, as the prose describes ("applies it only to the wrapper div holding <CopilotChat>").
import { CopilotChat } from "@copilotkit/react-core/v2";

export default function ChatCustomizationCssPage() {
  return (
    <div className="chat-css-demo-scope" style={{ height: "100vh" }}>
      {/* Doc: "Custom Labels" snippet, verbatim */}
      <CopilotChat
        labels={{
          welcomeMessageText: "Hello! How can I help you today?",
          modalHeaderTitle: "My Copilot",
          chatInputPlaceholder: "Ask me anything!",
        }}
      />
    </div>
  );
}
