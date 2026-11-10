// Dedicated runtime for the Open Generative UI cells (open-gen-ui and
// open-gen-ui-advanced). `openGenerativeUI` makes the provider register the
// `generateSandboxedUi` frontend tool and applies the
// OpenGenerativeUIMiddleware, which turns that tool call's arguments into
// `open-generative-ui` activity events rendered in a sandboxed iframe.
//
// Isolated here because the `openGenerativeUI` runtime flag sets
// `openGenerativeUIEnabled: true` globally on the probe response, which
// causes the CopilotKit provider's setTools effect to wipe per-demo
// `useFrontendTool`/`useComponent` registrations in the default runtime.
//
// Reference:
// - showcase/integrations/langgraph-python/src/app/api/copilotkit-ogui/route.ts
// - src/agents/open_gen_ui.py, src/agents/open_gen_ui_advanced.py

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { extractForwardedHeaders } from "@/lib/header-forwarding";

// HARNESS: port 8060 (R5 backend, backend/r5_main.py); doc default is localhost:8000 and AGENT_URL is shared by the other harness routes.
const AGENT_URL = "http://localhost:8060";

export const POST = async (req: NextRequest) => {
  try {
    const headers = extractForwardedHeaders(req);

    const agents = {
      "open-gen-ui": new HttpAgent({
        url: `${AGENT_URL}/open_gen_ui`,
        headers,
      }),
      "open-gen-ui-advanced": new HttpAgent({
        url: `${AGENT_URL}/open_gen_ui_advanced`,
        headers,
      }),
    };

    const copilotHandler = createCopilotRuntimeHandler({
      // Server-side config is identical for the minimal and advanced cells —
      // the advanced behaviour (sandbox -> host function calls) is wired
      // entirely on the frontend via `openGenerativeUI.sandboxFunctions` on
      // the provider. The single `openGenerativeUI` flag below turns on
      // Open Generative UI for the listed agent(s); the runtime middleware
      // converts each agent's `generateSandboxedUi` tool call into
      // `open-generative-ui` activity events.
      runtime: new CopilotRuntime({
        agents,
        openGenerativeUI: {
          agents: ["open-gen-ui", "open-gen-ui-advanced"],
        },
      }),
      basePath: "/api/copilotkit-ogui",
      mode: "single-route",
    });

    return await copilotHandler(req);
  } catch (error: unknown) {
    const e = error as { message?: string; stack?: string };
    return NextResponse.json(
      { error: e.message, stack: e.stack },
      { status: 500 },
    );
  }
};