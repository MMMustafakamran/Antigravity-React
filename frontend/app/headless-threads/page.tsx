"use client"; // HARNESS: the doc snippets have no "use client"; useState/useThreads need it.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/headless-threads (ThreadSidebar.tsx, verbatim) ---
import { useThreads } from "@copilotkit/react-core/v2"; // [!code highlight]

function ThreadSidebar({ onSelectThread }: { onSelectThread?: (id: string) => void }) { // HARNESS (FINDINGS.md #68): doc's ThreadSidebar takes no props, but App passes onSelectThread
  const { // [!code highlight:6]
    threads,
    isLoading,
    renameThread,
    archiveThread,
    deleteThread,
  } = useThreads({ agentId: "antigravity_agent" }); // HARNESS (FINDINGS.md #70): doc has the placeholder "my-agent"; the chat runs as the quickstart's antigravity_agent (root layout)

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {threads.map((thread) => (
        <div key={thread.id}>
          <span onClick={() => onSelectThread?.(thread.id)}>{thread.name ?? "New conversation"}</span> {/* HARNESS (FINDINGS.md #68): doc never calls onSelectThread, so no row can be selected */}
          <button onClick={() => renameThread(thread.id, "Renamed")}>
            Rename
          </button>
          <button onClick={() => archiveThread(thread.id)}>
            Archive
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Doc: same page (App.tsx, verbatim) ---
import { CopilotChat } from "@copilotkit/react-core/v2"; // [!code highlight]
import { useState } from "react";

function App() {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  return (
    <div className="flex">
      <ThreadSidebar onSelectThread={setActiveThreadId} />
      <CopilotChat threadId={activeThreadId} /> {/* [!code highlight] */}
    </div>
  );
}

// HARNESS: the page shows no export or provider. Mounted under CopilotKitProvider pointing at the doc's server.ts
// runtime with CopilotKitIntelligence (app/api/copilotkit-threads; verifyAppSession stubbed there, FINDINGS.md #69).
import { CopilotKitProvider } from "@copilotkit/react-core/v2";

export default function HeadlessThreadsPage() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit-threads">
      <App />
    </CopilotKitProvider>
  );
}
