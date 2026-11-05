"use client";
// HARNESS: the shared-state page publishes only fragments of
// src/app/demos/shared-state-read-write/page.tsx (useAgent, handlePreferencesChange)
// and never shows Preferences, RWAgentState, `notes`, the imports or the component.
// Everything outside the two "Doc" blocks is harness.
import { useState } from "react";
import { CopilotChat, useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";

type Preferences = { name?: string; tone?: string };
type RWAgentState = { preferences?: Preferences; notes?: string[] };

export default function SharedStatePage() {
  // --- Doc (verbatim) ---
  // Subscribe the component to agent state changes. Any time the agent
  // mutates its state (e.g. via its `set_notes` tool) this hook fires,
  // we re-render, and the sidebar panels reflect the new values.
  const { agent } = useAgent({
    agentId: "shared-state-read-write",
    updates: [UseAgentUpdate.OnStateChanged],
  });
  // --- end doc ---

  const state = (agent.state ?? {}) as RWAgentState;
  const notes = state.notes ?? [];
  const [name, setName] = useState("");

  // --- Doc (verbatim) ---
  // WRITE: every edit in the sidebar goes straight into agent state.
  // On the agent's next turn, the model reads this back out of state
  // through the adapter's built-in `get_shared_state` tool — so the UI's
  // writes visibly steer the model.
  const handlePreferencesChange = (next: Preferences) => {
    agent.setState({
      preferences: next,
      notes, // preserve what the agent has written
    } as RWAgentState);
  };
  // --- end doc ---

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside style={{ width: 320, padding: 16, borderRight: "1px solid #ddd" }}>
        <label>
          Name{" "}
          <input
            data-testid="pref-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handlePreferencesChange({ ...state.preferences, name })}
          />
        </label>
        <h3>Notes</h3>
        <ul data-testid="notes-list">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
        <pre data-testid="state-json" style={{ fontSize: 11 }}>{JSON.stringify(agent.state, null, 2)}</pre>
      </aside>
      <div style={{ flex: 1 }}>
        <CopilotChat agentId="shared-state-read-write" />
      </div>
    </div>
  );
}
