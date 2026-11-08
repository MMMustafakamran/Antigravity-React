"use client";
// HARNESS: the State Rendering page publishes only the useAgent call from
// src/app/demos/shared-state-streaming/page.tsx. The imports, the component, the
// `steps` render and the chat are never shown; everything outside the "Doc" block is
// harness. Agent "shared-state-streaming" is never registered (FINDINGS.md #39); the
// harness registers it in app/api/copilotkit/route.ts against the doc's set_steps agent
// (backend/state_rendering_main.py on :8045).
import { CopilotChat, useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";

type Step = { id: string; title: string; status: "pending" | "in_progress" | "completed" };
type StepsState = { steps?: Step[] };

const STATUS_ICON: Record<Step["status"], string> = {
  pending: "○",
  in_progress: "◐",
  completed: "●",
};

export default function StateRenderingPage() {
  // --- Doc (verbatim) ---
  // Subscribe to BOTH state changes and run-status changes. The former
  // drives the per-token document rerender; the latter toggles the
  // "LIVE" badge when the agent starts / stops.
  const { agent } = useAgent({
    agentId: "shared-state-streaming",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  // --- end doc ---

  const steps = (agent.state as StepsState | undefined)?.steps ?? [];
  const done = steps.filter((s) => s.status === "completed").length;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <section data-testid="steps-panel" style={{ width: 380, padding: 20, borderRight: "1px solid #ddd" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}>
          Agent plan
          {agent.isRunning && (
            <span data-testid="live-badge" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 8, background: "#e33", color: "#fff" }}>
              LIVE
            </span>
          )}
        </h2>
        <p data-testid="steps-progress" style={{ color: "#666", fontSize: 13, margin: "6px 0 14px" }}>
          {steps.length ? `${done}/${steps.length} complete` : "No steps yet. Ask the agent to plan something."}
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {steps.map((s) => (
            <li
              key={s.id}
              data-testid="step-item"
              data-status={s.status}
              style={{ padding: "8px 10px", marginBottom: 6, border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 14 }}
            >
              {STATUS_ICON[s.status] ?? "○"} {s.title} <span style={{ color: "#888", fontSize: 12 }}>({s.status})</span>
            </li>
          ))}
        </ul>
      </section>
      <div style={{ flex: 1 }}>
        <CopilotChat agentId="shared-state-streaming" />
      </div>
    </div>
  );
}
