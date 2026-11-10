"use client"; // HARNESS: the doc snippets have no "use client"; useState/useThreads need it.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/headless-threads (ThreadSidebar.tsx, verbatim) ---
import { useThreads } from "@copilotkit/react-core/v2"; // [!code highlight]

function ThreadSidebar() {
  const { // [!code highlight:6]
    threads,
    isLoading,
    renameThread,
    archiveThread,
    deleteThread,
  } = useThreads({ agentId: "my-agent" });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {threads.map((thread) => (
        <div key={thread.id}>
          <span>{thread.name ?? "New conversation"}</span>
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

// HARNESS: the page shows no export. Rendered under the root layout's <CopilotKit runtimeUrl="/api/copilotkit">;
// the server.ts runtime step (CopilotKitIntelligence + verifyAppSession) is not applied: the harness has no Intelligence key wired in.
export default App;
