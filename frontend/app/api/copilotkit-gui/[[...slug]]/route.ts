// Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components
// step 2 "Add the runtime and an agent": app/api/copilotkit/[[...slug]]/route.ts (structure verbatim).
//
// HARNESS: served at /api/copilotkit-gui because the quickstart's app/api/copilotkit/route.ts already
// owns /api/copilotkit (Next can't hold a route.ts and an optional catch-all at the same path).
// HARNESS: the doc's agent is a TanStack/OpenAI BuiltInAgent; the page says "Already have CopilotKit
// running? Do step 3 only", so the agent here is the existing Antigravity quickstart agent (:8040).
// The rest is the doc's multi-route handler (GET + POST, no single-route mode), so GET /info answers.
import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";

const agent = new HttpAgent({ url: process.env.AGENT_URL ?? "http://localhost:8040" });

const runtime = new CopilotRuntime({
  agents: { default: agent, antigravity_agent: agent },
  runner: new InMemoryAgentRunner(),
});
const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit-gui" });
export const GET = handler;
export const POST = handler;
