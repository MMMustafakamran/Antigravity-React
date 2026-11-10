"use client"; // HARNESS: function props need a client component (App Router).

// --- Doc: https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/slots ---
// "Tailwind Classes" snippet (verbatim)
import { CopilotChat } from "@copilotkit/react-core/v2";

export function Chat() {
  return (
    <CopilotChat
      messageView="bg-gray-50 dark:bg-gray-900 p-4"
      input="border-2 border-blue-400 rounded-xl"
    />
  );
}

// "Three levels deep" + "Labels" snippets (verbatim props; HARNESS: combined on one CopilotChat)
export function NestedChat() {
  return (
    <CopilotChat
      messageView={{
        assistantMessage: {
          copyButton: ({ onClick }) => (
            <button onClick={onClick}>Copy</button>
          ),
        },
      }}
      labels={{
        chatInputPlaceholder: "Ask your agent anything...",
        welcomeMessageText: "How can I help you today?",
        chatDisclaimerText: "AI responses may be inaccurate.",
      }}
    />
  );
}
// --- doc ends ---

// HARNESS: the page shows no full page component; render the nested-slot + labels chat.
export default function SlotsPage() {
  return (
    <div style={{ height: "100vh" }}>
      <NestedChat />
    </div>
  );
}
