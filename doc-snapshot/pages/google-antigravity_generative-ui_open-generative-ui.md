# Open Generative UI

> Let agents generate fully interactive HTML/CSS/JS UIs that stream live into the chat.


<!-- interactive demo: open-gen-ui -->


## What is this?

Open Generative UI lets the agent generate complete, sandboxed UI on the fly
(HTML, CSS, and JavaScript) and stream it live into the chat. The user sees
the interface build in real time: styles apply first, then HTML streams in
progressively, and finally JavaScript expressions execute one by one.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive Agents with Generative UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/) — a free DeepLearning.AI short course taught by CopilotKit's CEO covering the full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

Key benefits:

- **No predefined components** — the agent creates any UI it needs, on demand
- **Live streaming** — HTML streams into a preview as it's generated
- **CDN libraries** — the generated UI can load Chart.js, D3, Three.js, etc. via `<script>` tags
- **Secure sandboxing** — content runs in an isolated iframe without same-origin access
- **Sandbox functions** — optionally expose host functions to the generated UI for two-way communication

## Minimal setup

Turning on Open Generative UI takes one flag in the runtime plus a plain
`<CopilotChat />` on the frontend; the built-in activity renderer is
auto-registered by `CopilotKit`, so no extra frontend wiring is needed. Your
agent must still give the run's frontend tools to its model (see the warning
below).

### Enable it in the runtime

Add `OpenGenerativeUIMiddleware` to your runtime configuration:

```typescript
// src/app/api/copilotkit-ogui/route.ts
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
```

The `OpenGenerativeUIMiddleware` then converts the agent's streamed
`generateSandboxedUi` tool call into `open-generative-ui` activity events,
which the built-in `OpenGenerativeUIActivityRenderer` mounts inside a
sandboxed iframe.

<Callout type="warn" title="Your agent must pass frontend tools to its model">
  `generateSandboxedUi` reaches the agent as a frontend tool in the run input.
  The agent calls it only if it gives the run's frontend tools to its model.
  If it binds only its own tools, the model never sees `generateSandboxedUi`,
  so nothing renders and no error appears.

  - The built-in agent passes frontend tools already.
  - A LangGraph agent built with `create_agent` (Python) or `createAgent`
    (TypeScript) adds `CopilotKitMiddleware()` (Python, from `copilotkit`) or
    `copilotkitMiddleware` (TypeScript, from `@copilotkit/sdk-js/langgraph`)
    to its `middleware`. A hand-built graph binds the frontend tools with its
    own tools: in Python, use `CopilotKitState` and bind
    `state["copilotkit"]["actions"]`; in TypeScript, spread
    `CopilotKitStateAnnotation.spec` into the state and bind
    `state.copilotkit.actions` (convert them with
    `convertActionsToDynamicStructuredTools` from `@copilotkit/sdk-js/langgraph`).
  - Other agents forward the frontend tools from the run input. See
    [Frontend Tools](/google-antigravity/frontend-tools).
</Callout>

### Drop `<CopilotChat />` into the page

Wrap your app in `CopilotKit` and render `<CopilotChat>` — no extra props needed:

```typescript
// src/app/demos/open-gen-ui/page.tsx
  // Minimal Open Generative UI frontend: the built-in activity renderer is
  // registered by CopilotKitProvider, so a plain <CopilotChat /> is enough —
  // no custom tool renderers, no activity-renderer registration.
  // We DO pass `openGenerativeUI.designSkill` to swap in visualisation-tuned
  // guidance in place of the default shadcn design skill.
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-ogui"
      agent="open-gen-ui"
      openGenerativeUI={{ designSkill: VISUALIZATION_DESIGN_SKILL }}
    >
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl flex flex-col p-3">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
```

That's it. Ask the agent "build me a simple greeting card" to see HTML
stream into a sandboxed preview live.

## Advanced: With app tool calling

Sandbox functions let the generated UI call back into your host application
— a generated settings panel can toggle your app's theme, a product card can
push items into your cart, or a data view can ask the host to fetch data the
iframe can't reach directly.


<!-- interactive demo: open-gen-ui-advanced -->


### Runtime is unchanged

The server-side flag is identical to the minimal cell; the advanced
behaviour is a pure frontend addition.

```typescript
// src/app/api/copilotkit-ogui/route.ts
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
```

### Register sandbox functions on the provider

Each sandbox function is a Zod-validated, host-side bridge the agent can
invoke from inside the generated iframe via
`Websandbox.connection.remote.<name>(args)`. The handler runs in the host
page and its description is appended to the agent's context, so the agent
knows which bridges are available when generating HTML/JS.

```typescript
// src/app/demos/open-gen-ui-advanced/page.tsx
import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { openGenUiSandboxFunctions } from "./sandbox-functions";
import { openGenUiSuggestions } from "./suggestions";

export default function OpenGenUiAdvancedDemo() {
  return (
    // Pass the sandbox-function array on the `openGenerativeUI` provider prop.
    // The built-in `OpenGenerativeUIActivityRenderer` wires these as callable
    // remotes inside the agent-authored iframe.
    <CopilotKit
      runtimeUrl="/api/copilotkit-ogui"
      agent="open-gen-ui-advanced"
      openGenerativeUI={{ sandboxFunctions: openGenUiSandboxFunctions }}
    >
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>

import { z } from "zod";

/**
 * Host-side functions that agent-authored, sandboxed UIs can invoke from
 * inside the iframe via `Websandbox.connection.remote.<name>(args)`.
 *
 * The names, descriptions, and Zod-derived JSON schemas below are injected
 * into the agent's context so the LLM knows which bridges exist when it
 * generates HTML/JS. Each handler runs on the HOST page and its return
 * value is awaited by the in-iframe caller.
 *
 * Keep the surface small and obvious — these are the demo's "app-side
 * tools" that the sandbox-generated UI can call.
 */
export const openGenUiSandboxFunctions = [
  {
    name: "evaluateExpression",
    description:
      "Safely evaluate a basic arithmetic expression on the host page and return the numeric result. " +
      "Supports +, -, *, /, parentheses, and decimal numbers. " +
      "Use this from inside a calculator or spreadsheet UI.",
    parameters: z.object({
      expression: z
        .string()
        .describe("An arithmetic expression, e.g. '12 * (3 + 4.5)'"),
    }),
    handler: async ({ expression }: { expression: string }) => {
      // Evaluate only arithmetic-safe expressions. Reject anything with
      // identifiers or suspicious characters so we never exec arbitrary JS.
      if (!/^[\d+\-*/().\s]+$/.test(expression)) {
        return { ok: false, error: "Unsupported characters in expression." };
      }
      try {
        // eslint-disable-next-line no-new-func
        const value = Function(`"use strict"; return (${expression});`)();
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return { ok: false, error: "Not a finite number." };
        }
        // eslint-disable-next-line no-console
        console.log(
          "[open-gen-ui/advanced] evaluateExpression",
          expression,
          "=",
          value,
        );
        return { ok: true, value };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  },
  {
    name: "notifyHost",
    description:
      "Send a short notification message from the sandboxed UI to the host page. " +
      "The host logs the message and returns a confirmation object.",
    parameters: z.object({
      message: z.string().describe("A short status message."),
    }),
    handler: async ({ message }: { message: string }) => {
      // eslint-disable-next-line no-console
      console.log("[open-gen-ui/advanced] notifyHost:", message);
      return { ok: true, receivedAt: new Date().toISOString(), message };
    },
  },
];
```

<Callout type="info" title="How the sandbox calls you back">
  Inside the generated UI, the agent writes JS that calls
  `await Websandbox.connection.remote.notifyHost({ message: "hi" })`.
  The call is proxied back to the host page, where your `handler` runs
  with the validated args.
</Callout>

### Common use cases

- **Theme toggling** — generated UI controls your app's appearance
- **Cart / state management** — product cards push items into host state
- **Navigation** — generated UI triggers route changes in the host app
- **Data fetching** — sandbox asks the host to fetch data the iframe can't reach directly

## How streaming works

The agent generates the tool call's parameters in an order optimized for the
user experience:

1. **`placeholderMessages`** — shown immediately while generating
2. **`css`** — all styles first; the preview starts once CSS is complete
3. **`html`** — streams live into the preview as it's generated
4. **`jsFunctions`** — reusable helpers injected before expressions
5. **`jsExpressions`** — executed one by one; the user sees each take effect

The middleware parses the tool-call arguments incrementally and emits
activity events as each parameter completes, so the preview updates
progressively.

## Using CDN libraries

The sandboxed iframe can load external libraries from CDNs; just include
`<script>` or `<link>` tags in the generated HTML `<head>`. Chart.js, D3,
Three.js, and any other CDN-hosted library work out of the box.

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <canvas id="myChart"></canvas>
</body>
```

<IntegrationGrid path="generative-ui/open-generative-ui" />
