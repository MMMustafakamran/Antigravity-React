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
    // HARNESS: kept for the old useInterrupt route; the rendered useInterrupt page is "Not supported on Google Antigravity" (not recorded). Backed by backend/interrupt_main.py on :8041.
    "gen-ui-interrupt": new HttpAgent({ url: "http://localhost:8041" }),
    // HARNESS: the shared-state page uses agent "shared-state-read-write" and never shows registering it. Backed by backend/shared_state_main.py on :8042.
    "shared-state-read-write": new HttpAgent({ url: "http://localhost:8042" }),
    // HARNESS: kept for the old headless route; the rendered Headless page is "Not supported on Google Antigravity" (not recorded). Uses the :8041 experimental_interrupt backend.
    "interrupt-headless": new HttpAgent({ url: "http://localhost:8041" }),
    // HARNESS: agent "tool-rendering": the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Here backed by backend/tool_rendering_main.py on :8044.
    "tool-rendering": new HttpAgent({ url: "http://localhost:8044" }),
    // HARNESS: the State Rendering page uses agent "shared-state-streaming", never registered (FINDINGS.md #39). Backed by the doc's set_steps agent, backend/state_rendering_main.py on :8045.
    "shared-state-streaming": new HttpAgent({ url: "http://localhost:8045" }),
    // HARNESS: the Sub-Agents page shows no frontend agent id or registration. "subagents" (showcase id) is backed by backend/subagents_main.py on :8043.
    subagents: new HttpAgent({ url: "http://localhost:8043" }),
    // HARNESS (R2): "headless-simple" (Headless UI) is in no route on its page. "reasoning-default" (Reasoning Messages): the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Its reasoning.py needs the unpublished REASONING_MODEL, so both use the quickstart agent.
    "headless-simple": new HttpAgent({ url: process.env.AGENT_URL ?? "http://localhost:8000" }),
    "reasoning-default": new HttpAgent({ url: process.env.AGENT_URL ?? "http://localhost:8000" }),
    // HARNESS (R1): "agentic_chat", "prebuilt-sidebar", "prebuilt-popup": the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Here backed by the quickstart agent on :8040.
    agentic_chat: new HttpAgent({ url: "http://localhost:8040" }),
    "prebuilt-sidebar": new HttpAgent({ url: "http://localhost:8040" }),
    "prebuilt-popup": new HttpAgent({ url: "http://localhost:8040" }),
    // HARNESS (R6): "gen-ui-tool-based": the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Here backed by backend/r6_main.py :8061/tool-based.
    "gen-ui-tool-based": new HttpAgent({ url: "http://localhost:8061/tool-based" }),
    // HARNESS (R6): "readonly-state-agent-context": the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Here backed by backend/r6_main.py :8061/app-context.
    "readonly-state-agent-context": new HttpAgent({ url: "http://localhost:8061/app-context" }),
    // HARNESS: "hitl-in-chat": the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Here backed by the quickstart agent.
    "hitl-in-chat": new HttpAgent({
      url: process.env.AGENT_URL ?? "http://localhost:8000",
    }),
    // HARNESS (R3): multimodal-attachments and headless-threads use the placeholder agentId "my-agent"; "reasoning-custom" and "default" are in the Code tab route.ts (showcase agent_server). Backed by the quickstart agent on :8040.
    "my-agent": new HttpAgent({ url: "http://localhost:8040" }),
    "reasoning-custom": new HttpAgent({ url: "http://localhost:8040" }),
    default: new HttpAgent({ url: "http://localhost:8040" }),
    // HARNESS: "frontend_tools" and "chat-customization-css" (Code-tab pages of Frontend Tools and CSS Customization): the page's Code tab route.ts registers it as HttpAgent(`${AGENT_URL}/<name>`) on the showcase agent_server (built on the unpublished agents._common). Here backed by the quickstart agent on :8040.
    frontend_tools: new HttpAgent({ url: "http://localhost:8040" }),
    "chat-customization-css": new HttpAgent({ url: "http://localhost:8040" }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const POST = (req: NextRequest) => handler(req);
