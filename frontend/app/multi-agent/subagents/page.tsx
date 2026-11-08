"use client";
// HARNESS: the Sub-Agents page never shows the page that hosts DelegationLog. It says only
// "Subscribe with useAgent({ updates: [UseAgentUpdate.OnStateChanged,
// UseAgentUpdate.OnRunStatusChanged] }), read agent.state.delegations, and render one card
// per entry." This page does exactly that; the agent id "subagents" (from the showcase) is
// harness, registered in app/api/copilotkit/route.ts against backend/subagents_main.py on :8043.
import { CopilotChat, useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";

import { type Delegation, DelegationLog } from "./delegation-log";

type SubagentsAgentState = { delegations?: Delegation[] };

export default function SubagentsPage() {
  const { agent } = useAgent({
    agentId: "subagents",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const delegations = (agent.state as SubagentsAgentState | undefined)?.delegations ?? [];

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <section className="flex-1 min-h-0 p-4">
        <DelegationLog delegations={delegations} isRunning={agent.isRunning} />
      </section>
      <aside className="w-[420px] shrink-0 flex flex-col min-h-0 border-l border-[#DBDBE5] bg-white">
        <CopilotChat agentId="subagents" className="flex-1 min-h-0" />
      </aside>
    </div>
  );
}
