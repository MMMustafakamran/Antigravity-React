"use client"; // HARNESS: needed in the App Router; the doc file omits it.
// --- Doc (verbatim): components/Canvas.tsx ---
import { useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

type CanvasState = {
  title: string;
  items: { id: string; label: string; done: boolean }[];
};

const INITIAL_CANVAS_STATE: CanvasState = {
  title: "Project launch",
  items: [
    { id: "research", label: "Research user needs", done: true },
    { id: "prototype", label: "Build a prototype", done: false },
  ],
};

export function Canvas() {
  // No agentId means the "default" agent. Pass { agentId } to target another.
  const { agent, isReady } = useAgent();
  const state = (agent.state ?? {}) as Partial<CanvasState>;

  useEffect(() => {
    if (!isReady) return;

    const current = (agent.state ?? {}) as Partial<CanvasState>;
    const updates: Partial<CanvasState> = {};

    if (current.title === undefined) {
      updates.title = INITIAL_CANVAS_STATE.title;
    }
    if (current.items === undefined) {
      updates.items = INITIAL_CANVAS_STATE.items;
    }

    if (Object.keys(updates).length > 0) {
      agent.setState({ ...(agent.state ?? {}), ...updates });
    }
  }, [agent, isReady, state.title, state.items]);

  return (
    <main className="canvas">
      <h1>{state.title ?? "Untitled"}</h1>
      <ul>
        {(state.items ?? []).map((item) => (
          <li key={item.id} data-done={item.done}>
            {item.label}
          </li>
        ))}
      </ul>
    </main>
  );
}
