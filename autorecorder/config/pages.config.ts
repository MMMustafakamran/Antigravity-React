/**
 * One entry per tested doc page of https://docs.copilotkit.ai/google-antigravity, in the order
 * the clips are numbered. docUrl, demoUrl and the filename are derived from project.config.ts.
 *
 * Every demo route is served from the root of the app (demoSuffix is ''), because this harness
 * puts each doc page on its own route rather than a `/demo-chat` sub-page.
 *
 * State Rendering and Sub-Agents publish only frontend fragments, so their routes are harness
 * pages around the doc's verbatim snippets (see the HARNESS headers in those page files).
 *
 * Not registered: premium/Intelligence pages and Threads (owner instruction, 2026-11-04).
 */
import { definePages } from '../core/types';

/** Registered but not recorded, with the reason printed on every run. */
export const SKIP_RECORDING: Record<string, string> = {
  'tool-rendering-default':
    'Not a separate doc page: the default catch-all is a section of generative-ui/tool-rendering, whose row links the ToolRendering clip (no assignment.json row for this clip).',
};

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart (use an existing agent)',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: '',
    // Versions first: they're what makes the clip evidence.
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 20,
    extraTabs: [
      { filePath: 'frontend/package.json', startLine: 11, endLine: 19 },
      { filePath: 'backend/main.py', startLine: 1, endLine: 21 },
      { filePath: 'frontend/app/api/copilotkit/route.ts', startLine: 1, endLine: 34 },
      { filePath: 'frontend/app/layout.tsx', startLine: 1, endLine: 15 },
      { filePath: 'frontend/app/page.tsx', startLine: 1, endLine: 11 },
    ],
    prompt: 'Tell me in one sentence what this app can do.',
    waitAfterPromptMs: 3000,
  },
  {
    id: 'frontend-tools',
    name: 'App Control - Frontend Tools',
    videoName: 'FrontendTools',
    docPath: 'frontend-tools',
    route: 'frontend-tools',
    ideFile: 'frontend/app/frontend-tools/page.tsx',
    startLine: 3,
    endLine: 32,
    extraTabs: [{ filePath: 'frontend/app/frontend-tools/page.tsx', startLine: 34, endLine: 46 }],
    prompt: 'Make the background a sunset gradient.',
  },
  {
    id: 'human-in-the-loop',
    name: 'Human in the Loop - useHumanInTheLoop',
    videoName: 'HumanInTheLoop',
    docPath: 'human-in-the-loop',
    route: 'human-in-the-loop',
    ideFile: 'frontend/app/human-in-the-loop/page.tsx',
    startLine: 51,
    endLine: 74,
    extraTabs: [{ filePath: 'frontend/app/api/copilotkit/route.ts', startLine: 21, endLine: 25 }],
    prompt: 'Please book an intro call with the sales team to discuss pricing.',
  },
  {
    id: 'use-interrupt',
    name: 'Human in the Loop - useInterrupt',
    videoName: 'UseInterrupt',
    docPath: 'human-in-the-loop/useInterrupt',
    route: 'human-in-the-loop/use-interrupt',
    ideFile: 'frontend/app/human-in-the-loop/use-interrupt/page.tsx',
    startLine: 35,
    endLine: 69,
    extraTabs: [{ filePath: 'backend/interrupt_main.py', startLine: 7, endLine: 20 }],
    prompt: 'Please book an intro call with the sales team to discuss pricing.',
  },
  {
    id: 'headless-interrupts',
    name: 'Human in the Loop - Headless interrupts',
    videoName: 'HeadlessInterrupts',
    docPath: 'human-in-the-loop/headless',
    route: 'human-in-the-loop/headless',
    ideFile: 'frontend/app/human-in-the-loop/headless/page.tsx',
    startLine: 63,
    endLine: 100,
    extraTabs: [{ filePath: 'frontend/app/human-in-the-loop/headless/page.tsx', startLine: 141, endLine: 155 }],
    prompt: 'Please book an intro call with the sales team to discuss pricing.',
  },
  {
    id: 'shared-state',
    name: 'Shared State - read and write',
    videoName: 'SharedState',
    docPath: 'shared-state',
    route: 'shared-state',
    ideFile: 'frontend/app/shared-state/page.tsx',
    startLine: 13,
    endLine: 38,
    extraTabs: [{ filePath: 'backend/shared_state_main.py', startLine: 12, endLine: 35 }],
    prompt: 'Remember that I love hiking. Also, what is my name?',
  },
  {
    id: 'state-rendering',
    name: 'Generative UI - State Rendering',
    videoName: 'StateRendering',
    docPath: 'generative-ui/state-rendering',
    route: 'generative-ui/state-rendering',
    ideFile: 'backend/state_rendering_main.py',
    startLine: 6,
    endLine: 16,
    extraTabs: [{ filePath: 'frontend/app/generative-ui/state-rendering/page.tsx', startLine: 20, endLine: 28 }],
    prompt: 'Plan a weekend trip to Lisbon in 3 steps and work through each one.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'tool-rendering',
    name: 'Generative UI - Tool Rendering (per-tool)',
    videoName: 'ToolRendering',
    docPath: 'generative-ui/tool-rendering',
    route: 'generative-ui/tool-rendering',
    ideFile: 'frontend/app/generative-ui/tool-rendering/tool-renderers.tsx',
    startLine: 24,
    endLine: 69,
    extraTabs: [
      { filePath: 'frontend/app/generative-ui/tool-rendering/page.tsx', startLine: 1, endLine: 13 },
      { filePath: 'backend/tool_rendering_main.py', startLine: 21, endLine: 31 },
    ],
    prompt: "What's the weather in Paris? Then find flights from SFO to JFK.",
  },
  {
    id: 'tool-rendering-default',
    name: 'Generative UI - Tool Rendering (default catch-all)',
    videoName: 'ToolRenderingDefault',
    docPath: 'generative-ui/tool-rendering',
    route: 'generative-ui/tool-rendering/default-catchall',
    ideFile: 'frontend/app/generative-ui/tool-rendering/default-catchall/page.tsx',
    startLine: 7,
    endLine: 13,
    prompt: "What's the stock price of GOOG? Also roll a d20.",
  },
  {
    id: 'components',
    name: 'Generative UI - Components and surfaces',
    videoName: 'Components',
    docPath: 'generative-ui/components',
    route: 'generative-ui/components',
    ideFile: 'frontend/app/generative-ui/components/providers.tsx',
    startLine: 1,
    endLine: 16,
    prompt: 'Compare the Starter, Team, and Enterprise plans in a table',
    waitAfterPromptMs: 8000,
    timeouts: { replyStartMs: 180000 },
  },
  {
    id: 'mcp-apps',
    name: 'Generative UI - MCP Apps',
    videoName: 'McpApps',
    docPath: 'generative-ui/mcp-apps',
    route: 'generative-ui/mcp-apps',
    ideFile: 'frontend/app/api/copilotkit-mcp-apps/route.ts',
    startLine: 10,
    endLine: 33,
    extraTabs: [{ filePath: 'frontend/app/generative-ui/mcp-apps/page.tsx', startLine: 10, endLine: 23 }],
    prompt: 'Draw a simple flowchart with three boxes: Idea, Build, Ship.',
    waitAfterPromptMs: 8000,
    // The agent calls the Excalidraw tools (read_me, create_view) before any text, which can take
    // longer than the 30 s default (CI 2026-11-09 gave up at 30 s; probes 2026-11-09: 6 runs, 5 drew
    // the diagram in 28-40 s on both google-genai 2.34.0 and 3.0.0, 1 model-output error).
    timeouts: { replyStartMs: 120000, replyStreamMs: 90000 },
  },
  {
    id: 'subagents',
    name: 'Multi-Agent - Sub-Agents',
    videoName: 'SubAgents',
    docPath: 'multi-agent/subagents',
    route: 'multi-agent/subagents',
    ideFile: 'backend/agents/subagents.py',
    startLine: 1,
    endLine: 40,
    extraTabs: [{ filePath: 'frontend/app/multi-agent/subagents/delegation-log.tsx', startLine: 49, endLine: 90 }],
    prompt: 'Write a short blog post about why tide pools matter. Research it, draft it, then critique it.',
    waitAfterPromptMs: 4000,
    timeouts: { replyStartMs: 180000 },
  },
  {
    id: 'webmcp',
    name: 'WebMCP',
    videoName: 'WebMCP',
    docPath: 'webmcp',
    route: 'webmcp',
    ideFile: 'frontend/app/webmcp/OrderSearch.tsx',
    startLine: 1,
    endLine: 35,
    // The recorder's browser has no WebMCP flag, so the clip shows the same handler serving the
    // CopilotKit agent. The document.modelContext path was tested separately (FINDINGS.md #33).
    prompt: 'Search my shipped orders.',
  },
  {
    id: 'inspector',
    name: 'Inspector',
    videoName: 'Inspector',
    docPath: 'inspector',
    route: 'frontend-tools',
    ideFile: 'frontend/app/layout.tsx',
    startLine: 1,
    endLine: 15,
    prompt: 'Make the background a forest gradient.',
  },
]);
