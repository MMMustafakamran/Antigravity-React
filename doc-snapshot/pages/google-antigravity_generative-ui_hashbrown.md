# Hashbrown

> Stream a structured sales dashboard through Hashbrown's UI kit and progressive JSON parser.


<!-- interactive demo: declarative-hashbrown -->

```typescript
// src/app/demos/declarative-hashbrown/page.tsx
"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { HashBrownDashboard } from "./hashbrown-renderer";
import { Chat } from "./chat";

export default function ByocHashbrownDemoPage() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-declarative-hashbrown"
      agent="declarative-hashbrown-demo"
    >
      <HashBrownDashboard>
        <div className="flex h-screen flex-col gap-3 p-6">
          <header>
            <h1 className="text-lg font-semibold">Declarative UI: Hashbrown</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Streaming structured output via <code>@hashbrownai/react</code>.
              The agent emits a catalog-constrained UI envelope that renders
              progressively as data streams.
            </p>
          </header>
          <div className="flex-1 overflow-hidden rounded-md border border-[var(--border)]">
            <Chat />
          </div>
        </div>
      </HashBrownDashboard>
    </CopilotKit>
  );
}
```

```typescript
// src/app/demos/declarative-hashbrown/chat.tsx
"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import type { CopilotChatAssistantMessage } from "@copilotkit/react-core/v2";
import { HashBrownRenderMessage } from "./hashbrown-renderer";
import { useByocHashbrownSuggestions } from "./suggestions";

export function Chat() {
  useByocHashbrownSuggestions();

  return (
    <CopilotChat
      className="h-full"
      messageView={{
        // The renderer reads only `message` from the slot props; cast to the
        // wider CopilotChatAssistantMessage signature to satisfy the slot type.
        assistantMessage:
          HashBrownRenderMessage as unknown as typeof CopilotChatAssistantMessage,
      }}
    />
  );
}
```

```typescript
// src/app/demos/declarative-hashbrown/hashbrown-renderer.tsx
"use client";

/**
 * HashBrown message renderer for the declarative-hashbrown demo.
 *
 * Registers MetricCard + PieChart + BarChart + DealCard + Markdown against the
 * hashbrown schema via `@hashbrownai/react`'s `useUiKit`. Renders assistant
 * messages through `useJsonParser` for progressive JSON->UI streaming.
 *
 * The agent (`src/agents/byoc_hashbrown_agent.py`) emits JSON of the shape:
 *   { "ui": [ { "metric": { "props": {...} } }, ... ] }
 */
import React, { createContext, memo, useContext } from "react";
import { s, prompt } from "@hashbrownai/core";
import {
  exposeComponent,
  exposeMarkdown,
  useUiKit,
  useJsonParser,
} from "@hashbrownai/react";
import { PieChart } from "./charts/pie-chart";
import { BarChart } from "./charts/bar-chart";
import { MetricCard } from "./metric-card";
import type { SalesStage } from "./types";

// Charts take `data` as a real array, but hashbrown's schema validator rejects
// example prompts whose JSX attribute values don't match the schema type. The
// LLM streams JSON as text anyway, so we model `data` as a string and parse
// inside the wrapper. Render nothing if parse fails mid-stream.
type ChartSlice = { label: string; value: number };

function parseChartData(data: string): ChartSlice[] | null {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as ChartSlice[]) : null;
  } catch {
    return null;
  }
}

function PieChartWithStringData({
  title,
  data,
}: {
  title: string;
  data: string;
}) {
  const parsed = parseChartData(data);
  return parsed ? (
    <PieChart title={title} description="" data={parsed} />
  ) : null;
}

function BarChartWithStringData({
  title,
  data,
}: {
  title: string;
  data: string;
}) {
  const parsed = parseChartData(data);
  return parsed ? (
    <BarChart title={title} description="" data={parsed} />
  ) : null;
}

const STAGE_COLORS: Record<SalesStage, string> = {
  prospect: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  qualified:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  proposal: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  negotiation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "closed-won":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "closed-lost": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function DealCard({
  title,
  stage,
  value,
  assignee,
  dueDate,
}: {
  title: string;
  stage: SalesStage;
  value: number;
  assignee?: string;
  dueDate?: string;
}) {
  const badgeClass =
    STAGE_COLORS[stage] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  return (
    <div
      data-testid="hashbrown-deal-card"
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <h3 className="text-sm font-semibold leading-snug text-[var(--foreground)]">
        {title}
      </h3>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {stage}
        </span>
        <span className="text-sm font-semibold text-[var(--foreground)]">
          ${(value ?? 0).toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
        {assignee && <span>{assignee}</span>}
        {dueDate && <span>Due {dueDate}</span>}
      </div>
    </div>
  );
}

function useSalesDashboardKit() {
  return useUiKit({
    examples: prompt`
      # Mixing components and Markdown:
      <ui>
        <Markdown children="## Q4 Sales Summary" />
        <metric label="Total Revenue" value="$1.2M" />
        <Markdown children="Revenue breakdown by segment:" />
        <pieChart title="Revenue by Segment" data='[{"label":"Enterprise","value":600000},{"label":"SMB","value":400000},{"label":"Startup","value":200000}]' />
        <barChart title="Monthly Trend" data='[{"label":"Oct","value":350000},{"label":"Nov","value":400000},{"label":"Dec","value":450000}]' />
        <dealCard title="Acme Corp Renewal" stage="negotiation" value="250000" />
      </ui>

      Hint: use Markdown for explanatory text between visual components.
      Hint: always include title and data for charts. Data is a JSON-encoded
      array of {label, value} objects as a string.
    `,
    components: [
      exposeMarkdown(),
      exposeComponent(MetricCard, {
        name: "metric",
        description: "A KPI metric card with label, value, and optional trend",
        props: {
          label: s.string("The metric label/name"),
          value: s.string("The metric value (formatted)"),
        },
      }),
      exposeComponent(PieChartWithStringData, {
        name: "pieChart",
        description:
          'A donut/pie chart. `data` is a JSON-encoded string of an array of {label, value} segments, e.g. \'[{"label":"A","value":1}]\'.',
        props: {
          title: s.string("Chart title"),
          data: s.string("JSON array of {label, value} segments"),
        },
      }),
      exposeComponent(BarChartWithStringData, {
        name: "barChart",
        description:
          'A vertical bar chart. `data` is a JSON-encoded string of an array of {label, value} bars, e.g. \'[{"label":"A","value":1}]\'.',
        props: {
          title: s.string("Chart title"),
          data: s.string("JSON array of {label, value} bars"),
        },
      }),
      exposeComponent(DealCard, {
        name: "dealCard",
        description: "A sales deal card showing pipeline stage and value",
        props: {
          title: s.string("Deal title"),
          stage: s.enumeration("Pipeline stage", [
            "prospect",
            "qualified",
            "proposal",
            "negotiation",
            "closed-won",
            "closed-lost",
          ]),
          value: s.number("Deal value in dollars"),
        },
      }),
    ],
  });
}

type Kit = ReturnType<typeof useSalesDashboardKit>;
const HashBrownKitContext = createContext<Kit | null>(null);

export function HashBrownDashboard({
  children,
}: {
  children?: React.ReactNode;
}) {
  const kit = useSalesDashboardKit();
  return (
    <HashBrownKitContext.Provider value={kit}>
      {children}
    </HashBrownKitContext.Provider>
  );
}

const AssistantMessage = memo(function AssistantMessage({
  content,
  kit,
}: {
  content: string;
  kit: Kit;
}) {
  const { value } = useJsonParser(content, kit.schema);
  if (!value) return null;

  // Re-attach `data-testid="copilot-assistant-message"` so the e2e harness'
  // assistant-message-landed detection still works when this slot overrides
  // the default CopilotChatAssistantMessage.
  return (
    <div
      data-testid="copilot-assistant-message"
      data-message-role="assistant"
      className="mt-2 flex w-full justify-start"
    >
      <div className="w-full px-1 py-1">{kit.render(value)}</div>
    </div>
  );
});

export function HashBrownRenderMessage({
  message,
}: {
  message: { role: string; content?: string };
}) {
  const kit = useContext(HashBrownKitContext);
  if (!kit)
    throw new Error(
      "HashBrownRenderMessage must be used within HashBrownDashboard",
    );
  if (message.role !== "assistant") return null;
  return <AssistantMessage content={message.content ?? ""} kit={kit} />;
}
```


Hashbrown renders a dashboard while the assistant streams JSON. For frameworks with this demo, the **Code** tab shows its runnable source, and the Markdown page includes the key frontend files. The bundled demos pin `@hashbrownai/core` and `@hashbrownai/react` to `0.5.0-beta.4`; the chart components also need `recharts` and `zod`. Use the versions in your integration's `package.json` when copying the files.

## When to use this

- **Streaming dashboards** that should appear before the full response arrives.
- **Agent-authored UI** constrained to components you expose in a UI kit.
- **Apps already using Hashbrown** for progressive JSON rendering.

For a validated `{ root, elements }` spec that renders as one tree, see [JSON Render](/google-antigravity/generative-ui/json-render). Its agent output and React API are different from Hashbrown's.

## Frontend

The page wraps the chat in `HashBrownDashboard`. That provider creates the UI kit once and shares it with the assistant-message renderer. The chat registers `HashBrownRenderMessage` in the `assistantMessage` slot.

The renderer exposes `metric`, `pieChart`, `barChart`, `dealCard`, and Markdown with their prop schemas. It passes `kit.schema` to `useJsonParser`, reads the parser's `value`, and calls `kit.render(value)`. Chart `data` is a JSON-encoded **string**; the chart wrappers parse it before passing an array to the chart components.

Where available, the Code tab also includes the imported `metric-card.tsx`, chart components, `types.ts`, suggestion setup, runtime route, and agent source.

## Backend

The agent sends **one JSON object** as the assistant message, without a Markdown fence or prose before it. Its top-level `ui` array contains component names from the kit. Each component has a `props` object matching its schema. For example:

```json title="example assistant message"
{
  "ui": [
    { "metric": { "props": { "label": "Total Revenue", "value": "$1.2M" } } },
    {
      "pieChart": {
        "props": {
          "title": "Revenue by Segment",
          "data": "[{\"label\":\"Enterprise\",\"value\":600000},{\"label\":\"SMB\",\"value\":400000},{\"label\":\"Startup\",\"value\":200000}]"
        }
      }
    }
  ]
}
```

The bundled agents use this envelope and the same component names. The parser can render finished parts of `ui` while the rest of the JSON is still streaming.

<IntegrationGrid path="declarative-hashbrown" />
