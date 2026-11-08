import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import type { NextRequest } from "next/server";

const runtime = new CopilotRuntime({
  agents: {
    antigravity_agent: new HttpAgent({
      url: process.env.AGENT_URL ?? "http://localhost:8000",
    }),
    // HARNESS: the useInterrupt page uses agent "gen-ui-interrupt" and never shows registering it. Backed by backend/interrupt_main.py on :8041.
    "gen-ui-interrupt": new HttpAgent({ url: "http://localhost:8041" }),
    // HARNESS: the shared-state page uses agent "shared-state-read-write" and never shows registering it. Backed by backend/shared_state_main.py on :8042.
    "shared-state-read-write": new HttpAgent({ url: "http://localhost:8042" }),
    // HARNESS: the headless page uses agent "interrupt-headless", never registered. Uses the :8041 experimental_interrupt backend.
    "interrupt-headless": new HttpAgent({ url: "http://localhost:8041" }),
    // HARNESS: the tool-rendering page uses agent "tool-rendering", never registered. Backed by backend/tool_rendering_main.py on :8044.
    "tool-rendering": new HttpAgent({ url: "http://localhost:8044" }),
    // HARNESS: the State Rendering page uses agent "shared-state-streaming", never registered (FINDINGS.md #39). Backed by the doc's set_steps agent, backend/state_rendering_main.py on :8045.
    "shared-state-streaming": new HttpAgent({ url: "http://localhost:8045" }),
    // HARNESS: the Sub-Agents page shows no frontend agent id or registration. "subagents" (showcase id) is backed by backend/subagents_main.py on :8043.
    subagents: new HttpAgent({ url: "http://localhost:8043" }),
    // HARNESS: the HITL page uses agent "hitl-in-chat" but never shows registering it. FINDINGS.md
    "hitl-in-chat": new HttpAgent({
      url: process.env.AGENT_URL ?? "http://localhost:8000",
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const POST = (req: NextRequest) => handler(req);
