"use client"; // HARNESS: hooks need a client component.

// HARNESS: the minimal example starts mid-function with no imports, component or render; all of this wrapper is guessed.
import { useState } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { AssistantBubble, UserBubble } from "./message-assistant";

function Chat() {
  // --- Doc: https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/headless-ui (verbatim) ---
  // src/app/demos/headless-simple/chat.tsx
  const { agent } = useAgent({ agentId: "headless-simple" });
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || agent.isRunning) return;
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    });
    setInput("");
    void copilotkit.runAgent({ agent }).catch((err) => {
      // The Headless Simple demo is the canonical "two hooks, your
      // design system" example users copy-paste as a starting point.
      // Silently swallowing errors here would model broken practice;
      // log so a network failure / runtime error / transport disconnect
      // surfaces in the console for the developer.
      console.error("[langgraph-python:headless-simple] runAgent failed", err);
    });
  };
  // --- doc snippet ends ---

  // HARNESS: `visible` is used by the doc's list snippet but never defined on the page.
  const visible = agent.messages.flatMap((m) =>
    (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content
      ? [{ id: m.id, role: m.role, content: m.content as string }]
      : [],
  );

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col gap-4 p-6">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Doc (verbatim): message list */}
                {visible.map((m) =>
                  m.role === "user" ? (
                    <UserBubble key={m.id} content={m.content} />
                  ) : (
                    <AssistantBubble key={m.id} content={m.content} />
                  ),
                )}
        {agent.isRunning && <div className="text-sm text-gray-500">…</div>}
      </div>
      {/* HARNESS: the page shows no composer markup. */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          className="flex-1 rounded border p-2"
          rows={1}
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button type="submit" className="rounded bg-black px-4 text-white">Send</button>
      </form>
    </div>
  );
}

export default function HeadlessUiPage() {
  return <Chat />;
}
