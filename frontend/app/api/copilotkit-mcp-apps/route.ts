// HARNESS: the MCP Apps page shows only the `new CopilotRuntime({...})` block of
// src/app/api/copilotkit-mcp-apps/route.ts. Imports, mcpAppsAgent and the handler are harness.
// headlessCompleteAgent (also referenced) is never defined, so it's left out.
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import type { NextRequest } from "next/server";

const mcpAppsAgent = new HttpAgent({ url: process.env.AGENT_URL ?? "http://localhost:8040" });

    // --- Doc (verbatim, minus the "headless-complete" entry) ---
    // The `mcpApps.servers` config is all you need server-side. The runtime
    // auto-applies the MCP Apps middleware to every registered agent: on each
    // MCP tool call it fetches the associated UI resource and emits an
    // `activity` event that the built-in `MCPAppsActivityRenderer` renders
    // inline in the chat.
    const runtime = new CopilotRuntime({
      agents: {
        "mcp-apps": mcpAppsAgent,
      },
      mcpApps: {
        servers: [
          {
            type: "http",
            url: process.env.MCP_SERVER_URL || "https://mcp.excalidraw.com/mcp",
            // Always pin a stable `serverId`. Without it CopilotKit hashes the
            // URL, and a URL change silently breaks restoration of persisted
            // MCP Apps in prior conversation threads.
            serverId: "excalidraw",
          },
        ],
      },
    });
    // --- end doc ---

const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit-mcp-apps", mode: "single-route" });
export const POST = (req: NextRequest) => handler(req);
