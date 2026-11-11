# JSON Render

> Bring your own component library. Have the agent emit a JSON spec and render allowed component types through a typed React registry.


<!-- interactive demo: declarative-json-render -->

```typescript
// src/app/demos/declarative-json-render/chat.tsx
"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import type { CopilotChatAssistantMessage } from "@copilotkit/react-core/v2";
import { JsonRenderAssistantMessage } from "./json-render-renderer";
import { useByocJsonRenderSuggestions } from "./suggestions";

export const AGENT_ID = "byoc_json_render";

export function Chat() {
  useByocJsonRenderSuggestions();

  return (
    <CopilotChat
      agentId={AGENT_ID}
      className="h-full rounded-2xl"
      messageView={{
        assistantMessage:
          JsonRenderAssistantMessage as unknown as typeof CopilotChatAssistantMessage,
      }}
    />
  );
}
```

````typescript
// src/app/demos/declarative-json-render/json-render-renderer.tsx
"use client";

import { useMemo } from "react";
import { CopilotChatAssistantMessage } from "@copilotkit/react-core/v2";
import type { CopilotChatAssistantMessageProps } from "@copilotkit/react-core/v2";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "./registry";
import type { JsonRenderSpec } from "./types";

const ALLOWED_TYPES = new Set(["MetricCard", "BarChart", "PieChart"]);

export function JsonRenderAssistantMessage(
  props: CopilotChatAssistantMessageProps,
) {
  const content =
    typeof props.message.content === "string" ? props.message.content : "";
  const spec = useMemo(() => parseSpec(content), [content]);

  // Stream not yet a valid spec (or plain prose) — render the default bubble.
  if (!spec) return <CopilotChatAssistantMessage {...props} />;

  return (
    <div
      data-testid="copilot-assistant-message"
      data-message-role="assistant"
      className="w-full"
    >
      <div data-testid="json-render-root" className="w-full">
        <JSONUIProvider registry={registry}>
          <Renderer
            spec={spec as unknown as Parameters<typeof Renderer>[0]["spec"]}
            registry={registry}
          />
        </JSONUIProvider>
      </div>
    </div>
  );
}

/** Parse a json-render spec out of the assistant content, tolerating code fences and prose. */
function parseSpec(raw: string): JsonRenderSpec | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  const { root, elements } = parsed as { root?: unknown; elements?: unknown };
  if (typeof root !== "string" || !isRecord(elements) || !(root in elements)) {
    return null;
  }

  for (const el of Object.values(elements)) {
    if (!isRecord(el)) return null;
    if (typeof el.type !== "string" || !ALLOWED_TYPES.has(el.type)) return null;
    if (el.props !== undefined && !isRecord(el.props)) return null;
  }

  return parsed as unknown as JsonRenderSpec;
}

/** Strip code fences, then return the first balanced {...} object as a string. */
function extractJsonObject(raw: string): string | null {
  if (!raw?.trim()) return null;
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  const candidate = (fence ? fence[1] : raw).trim();
  const start = candidate.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return candidate.slice(start, i + 1);
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
````

```typescript
// src/app/demos/declarative-json-render/catalog.ts
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod4";

const dataPoint = z.object({ label: z.string(), value: z.number() });

export const catalog = defineCatalog(schema, {
  components: {
    MetricCard: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        trend: z.string().nullable(),
      }),
      description:
        "A labelled metric (single number) with an optional trend subtitle",
    },
    BarChart: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
        data: z.array(dataPoint),
      }),
      description:
        "A vertical bar chart for comparing discrete values side by side",
    },
    PieChart: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
        data: z.array(dataPoint),
      }),
      description:
        "A donut-style pie chart for breaking a total down into category slices",
    },
  },
  actions: {},
});
```

```typescript
// src/app/demos/declarative-json-render/registry.tsx
import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { MetricCard } from "./metric-card";
import type { MetricCardComponentProps } from "./metric-card";
import { BarChart } from "./charts/bar-chart";
import type { BarChartComponentProps } from "./charts/bar-chart";
import { PieChart } from "./charts/pie-chart";
import type { PieChartComponentProps } from "./charts/pie-chart";

export const { registry } = defineRegistry(catalog, {
  components: {
    // The agent may nest charts inside a MetricCard root — forward children.
    MetricCard: ({ props, children }) => (
      <div className="flex w-full flex-col items-stretch gap-3">
        <MetricCard {...(props as MetricCardComponentProps)} />
        {children}
      </div>
    ),
    BarChart: ({ props }) => (
      <BarChart {...(props as BarChartComponentProps)} />
    ),
    PieChart: ({ props }) => (
      <PieChart {...(props as PieChartComponentProps)} />
    ),
  },
});
```


You have a chat surface and you want the agent to draw a dashboard from a typed JSON spec. By the end of this guide, the agent will emit a `{ root, elements }` object, and [`@json-render/react`](https://www.npmjs.com/package/@json-render/react) will render it through your React component registry.

## When to use this

- **Structured UI with a typed contract** where the renderer accepts known component types.
- **Tolerance for prose preamble + code fences** in the agent's output (the demo's parser handles them).
- **Cases where you already use json-render** elsewhere or prefer a Zod-described catalog.

If you'd rather have a streaming progressive render than a one-shot JSON render, see the sibling page [Hashbrown](/google-antigravity/generative-ui/hashbrown) for the same scenario with `@hashbrownai/react`.

## Frontend

The integration point is `<CopilotChat>`'s `messageView.assistantMessage` slot. The demo's **Code** tab has the complete framework-specific files, and the Markdown version of this page includes the key frontend source files. These demos use `@json-render/react` and `@json-render/core` version `0.18.0` with Zod 4 for the catalog. Check the selected demo's `package.json` in the repository for later version changes. Demos that also use Zod 3 import Zod 4 through the `zod4` package alias. `page.tsx` provides `<CopilotKit>`, `chat.tsx` installs `JsonRenderAssistantMessage` in the chat slot, and `json-render-renderer.tsx` parses the assistant content. The Code tab also shows the runtime route for the selected framework.

The renderer imports `registry` from `registry.tsx`, wraps `<Renderer spec={spec} registry={registry} />` in `<JSONUIProvider registry={registry}>`, and falls back to the normal assistant message until it can parse a spec. `catalog.ts` defines component names and Zod prop schemas with `defineCatalog`; `registry.tsx` uses `defineRegistry(catalog, …)` to bind those names to React components. Copy both files with the renderer. The demo's `parseSpec` allowlists component types and checks the basic object shape, but does **not** validate emitted props against the Zod schemas at runtime. Validate props before rendering if you rely on that guarantee.

## Backend

The agent emits a `{ root, elements }` JSON object as the assistant message content. `root` references a top-level element id; `elements` maps each id to a `{ type, props, children }` triple matching the catalog.

```json title="example agent output"
{
  "root": "revenue-card",
  "elements": {
    "revenue-card": {
      "type": "MetricCard",
      "props": { "label": "Total revenue", "value": "$184,302", "trend": "+12%" },
      "children": ["by-region"]
    },
    "by-region": {
      "type": "BarChart",
      "props": {
        "title": "Revenue by region",
        "description": null,
        "data": [
          { "label": "North America", "value": 112000 },
          { "label": "EMEA", "value": 72302 }
        ]
      }
    }
  }
}
```

The example uses a `MetricCard` root and its registered `BarChart` child. The renderer tolerates a prose preamble or code fence around the JSON, but the agent prompts ask for plain JSON.

## Comparing the two patterns

Both `byoc-json-render` and [`byoc-hashbrown`](/google-antigravity/generative-ui/hashbrown) solve the same problem with two different rendering libraries. The agent contract is similar; the React glue, validation strategy, and rendering behaviour differ.

<IntegrationGrid path="declarative-json-render" />
