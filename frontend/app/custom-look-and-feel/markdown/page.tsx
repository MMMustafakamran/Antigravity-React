"use client"; // HARNESS: function props need a client component (App Router).

// --- Doc: https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/markdown ("Restyle individual HTML tags", verbatim) ---
import { CopilotChat } from "@copilotkit/react-core/v2";

export function Chat() {
  return (
    <CopilotChat
      messageView={{
        assistantMessage: {
          markdownRenderer: {
            components: {
              a: ({ node, children, ...props }) => (
                <a {...props} className="my-link">
                  {children}
                </a>
              ),
              h2: ({ node, children, ...props }) => (
                <h2 {...props} className="my-heading">
                  {children}
                </h2>
              ),
            },
          },
        },
      }}
    />
  );
}
// --- doc ends ---

// HARNESS: the page has no default export and no styles for .my-link / .my-heading; visible marker styles so the override shows.
export default function MarkdownPage() {
  return (
    <div style={{ height: "100vh" }}>
      <style>{".my-link{color:#c2410c;font-weight:700}.my-heading{color:#7c3aed;font-size:1.4rem;font-weight:700}"}</style>
      <Chat />
    </div>
  );
}
