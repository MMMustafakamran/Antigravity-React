# Dynamic Schema A2UI

> LLM-generated A2UI. A secondary LLM creates both the schema and data from any prompt.


<!-- interactive demo: declarative-gen-ui -->


In the dynamic-schema approach, a secondary LLM generates the entire
UI (schema, data, and layout) based on the conversation context.
It's the most flexible A2UI flavor; the agent can render any UI for
any request without pre-defined schemas.

## How it works

1. The agent calls the A2UI tool to draw a surface, made available
   when `injectA2UITool: true`.
2. The runtime serializes your client-side catalog (component names +
   Zod prop schemas) into the agent's `copilotkit.context` so the LLM
   knows which components it may emit.
3. The tool call streams through LangGraph as `TOOL_CALL_ARGS` events.
4. The A2UI middleware intercepts the stream and renders cards
   progressively as data items arrive.

## The 3-file split

The canonical Bring-Your-Own-Catalog (BYOC) layout keeps three files
side-by-side under `frontend/src/app/a2ui/`:

| File | What lives there |
|---|---|
| `definitions.ts` | Zod props schema + human-readable descriptions for each custom component. Platform-agnostic, so the runtime can serialise it to the LLM. |
| `renderers.tsx` | React implementations keyed by the same names. TypeScript enforces that every definition has a renderer. |
| `catalog.ts` | `createCatalog(definitions, renderers, { includeBasicCatalog: true })`: merges your custom components with CopilotKit's built-in primitives. |

<Steps>
<Step>
### Declare your custom component definitions

Each entry pairs a Zod prop schema with a description. The description
is crucial; the LLM reads it to decide which component to emit. The
example below ships a small dashboard catalog (Card / StatusBadge /
Metric / InfoRow / PrimaryButton):

```typescript
// src/app/demos/declarative-gen-ui/a2ui/definitions.ts
import { z } from "zod";
import type { CatalogDefinitions } from "@copilotkit/a2ui-renderer";

export const myDefinitions = {
  // Override the basic catalog's Row/Column so `gap` is honoured — the
  // built-in versions ignore it, which makes composed dashboards cramped.
  Row: {
    description:
      "Horizontal layout container. Children share the width evenly. Use `gap` (px) to space dashboard tiles.",
    props: z.object({
      gap: z.number().optional(),
      // Enum mirrors the keys the renderer actually maps to CSS. Anything
      // outside this set silently falls back at render time, so we reject
      // it at schema-parse time to surface LLM typos early.
      align: z
        .enum(["start", "center", "end", "stretch", "baseline"])
        .optional(),
      justify: z.enum(["start", "center", "end", "spaceBetween"]).optional(),
      children: z.array(z.string()),
    }),
  },

  Column: {
    description:
      "Vertical layout container. Use `gap` (px) to space stacked sections.",
    props: z.object({
      gap: z.number().optional(),
      align: z
        .enum(["start", "center", "end", "stretch", "baseline"])
        .optional(),
      children: z.array(z.string()),
    }),
  },

  // Override the basic catalog's Text so it aligns flush with sibling
  // components (the built-in version carries an 8px outer margin).
  Text: {
    description: "A plain text line. Use for short explanations inside cards.",
    props: z.object({
      text: z.string(),
    }),
  },

  Card: {
    description:
      "A titled card container with an optional subtitle and a single child slot. Use it to group related content (metrics, rows, buttons).",
    props: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      child: z.string().optional(),
    }),
  },

  StatusBadge: {
    description:
      "A small coloured pill communicating the state of something (healthy/degraded/at-risk, on-track/behind). Choose `variant` to match the intent.",
    props: z.object({
      text: z.string(),
      variant: z.enum(["success", "warning", "error", "info"]).optional(),
    }),
  },

  Metric: {
    description:
      "A key/value KPI tile with an optional trend indicator and trend delta. Ideal for dashboard KPI rows (e.g. 'Revenue • $4.2M • up 12%').",
    props: z.object({
      label: z.string(),
      value: z.string(),
      trend: z.enum(["up", "down", "neutral"]).optional(),
      trendValue: z.string().optional(),
    }),
  },

  InfoRow: {
    description:
      "A compact two-column 'label: value' row. Good for stacks of facts inside a Card (owner, region, ARR, renewal date, etc.).",
    props: z.object({
      label: z.string(),
      value: z.string(),
    }),
  },

  DataTable: {
    description:
      "A data table with column headers and rows. Ideal for rankings and per-person/per-item breakdowns (rep performance vs quota, deal lists). Each row's keys MUST appear in `columns[].key`; unknown row keys render as blank cells and indicate model/schema drift.",
    // NOTE on B12 (row-keys ⊆ columns[].key): we'd normally enforce this
    // with `z.object(...).refine(...)`, but the host catalog package's
    // `CatalogComponentDefinition` type requires `props: ZodObject<…>`
    // (it inspects `.shape` at runtime), and `.refine` returns a
    // `ZodEffects` that breaks both the `satisfies CatalogDefinitions`
    // type assertion and the runtime `.shape` access. Until the host
    // type is broadened, we encode the constraint in the description
    // above so the LLM sees the rule, and leave hard enforcement to
    // the rendering pipeline (which already shows the empty cell —
    // detection is the gap, not behaviour).
    props: z.object({
      columns: z.array(z.object({ key: z.string(), label: z.string() })),
      // Cells may be strings or numbers — the renderer stringifies at
      // render time, but accepting both lets the LLM emit raw numerics
      // (e.g. attainment 124) instead of being forced to stringify.
      rows: z.array(z.record(z.union([z.string(), z.number()]))),
    }),
  },

  PrimaryButton: {
    description:
      "A styled primary call-to-action button. Attach an optional `action` that will be dispatched back to the agent when the user clicks it.",
    props: z.object({
      label: z.string(),
      // The renderer hands `action` opaquely to the A2UI `dispatch` helper,
      // which forwards it back to the agent. We don't constrain the shape
      // (different demos use different action payloads), but `z.unknown()`
      // is strictly better than `z.any()` here because it forces any
      // consumer that touches the value to narrow it explicitly.
      action: z.unknown().optional(),
    }),
  },

  PieChart: {
    description:
      "A pie/donut chart with a brand-coloured legend. Provide `title`, `description`, and `data` as an array of `{ label, value }` objects. Great for part-of-whole breakdowns (revenue by region, pipeline by stage).",
    props: z.object({
      title: z.string(),
      description: z.string(),
      data: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
        }),
      ),
    }),
  },

  BarChart: {
    description:
      "A vertical bar chart built on Recharts. Provide `title`, `description`, and `data` as an array of `{ label, value }` objects. Great for comparing series across categories or time (monthly revenue, signups per month).",
    props: z.object({
      title: z.string(),
      description: z.string(),
      data: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
        }),
      ),
    }),
  },
} satisfies CatalogDefinitions;
```
</Step>

<Step>
### Implement the React renderers

Every key in `myDefinitions` must have a matching renderer. Props are
statically typed against the Zod schema, so refactors stay safe:

```typescript
// src/app/demos/declarative-gen-ui/a2ui/renderers.tsx
export const myRenderers: CatalogRenderers<MyDefinitions> = {
  Row: ({ props, children }) => {
    const justifyMap: Record<string, string> = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      spaceBetween: "space-between",
    };
    const items = Array.isArray(props.children) ? props.children : [];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: `${props.gap ?? 16}px`,
          alignItems: props.align ?? "stretch",
          justifyContent: justifyMap[props.justify ?? "start"] ?? "flex-start",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {items.map((id, i) => (
          <div key={`${id}-${i}`} style={{ flex: "1 1 0", minWidth: 0 }}>
            {children(id)}
          </div>
        ))}
      </div>
    );
  },

  Column: ({ props, children }) => {
    const items = Array.isArray(props.children) ? props.children : [];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${props.gap ?? 12}px`,
          width: "100%",
        }}
      >
        {items.map((id, i) => (
          <React.Fragment key={`${id}-${i}`}>{children(id)}</React.Fragment>
        ))}
      </div>
    );
  },

  Text: ({ props }) => (
    <span style={{ fontSize: "0.85rem", color: c.cardFg, lineHeight: 1.5 }}>
      {props.text}
    </span>
  ),

  Card: ({ props, children }) => (
    // `data-testid="declarative-card"` stays shared so existing e2e selectors
    // still find every card; `data-card-id={props.title}` disambiguates
    // sibling cards (e.g. the at-risk pill's 3 severity cards) so test
    // assertions can target a specific card by title.
    <CardShell
      title={props.title}
      subtitle={props.subtitle}
      testid="declarative-card"
      cardId={props.title}
    >
      {props.child && children(props.child)}
    </CardShell>
  ),

  StatusBadge: ({ props }) => {
    const variant = props.variant ?? "info";
    const Icon = {
      error: TriangleAlert,
      warning: CircleAlert,
      success: CircleCheck,
      info: Info,
    }[variant];
    return (
      // `alignSelf: flex-start` keeps the pill content-sized — flex parents
      // (our Column override) default to stretch, which inflates it into a
      // full-width banner.
      <Badge
        variant={variant}
        style={{ alignSelf: "flex-start" }}
        data-testid="declarative-status-badge"
      >
        <Icon size={12} strokeWidth={2.5} style={{ marginRight: 4 }} />
        {props.text}
      </Badge>
    );
  },

  Metric: ({ props }) => {
    const trendColors: Record<string, string> = {
      up: "#059669",
      down: "#dc2626",
      neutral: c.muted,
    };
    const trendIcons: Record<string, string> = {
      up: "↑",
      down: "↓",
      neutral: "→",
    };
    return (
      <div
        data-testid="declarative-metric"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          minWidth: "120px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: c.muted,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {props.label}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: c.cardFg,
              letterSpacing: "-0.02em",
            }}
          >
            {props.value}
          </span>
          {props.trend && (
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: trendColors[props.trend] ?? c.muted,
              }}
            >
              {trendIcons[props.trend]}
              {props.trendValue ? ` ${props.trendValue}` : ""}
            </span>
          )}
        </div>
      </div>
    );
  },

  InfoRow: ({ props }) => (
    // Divider via `border-b last:border-b-0` so the final row doesn't dangle
    // a trailing line, regardless of whether the agent wraps these in a
    // Column or drops them directly into a Card's child slot.
    <div
      data-testid="declarative-info-row"
      className="flex items-baseline justify-between gap-4 py-2 border-b border-[var(--border)] last:border-b-0 last:pb-0 first:pt-0"
    >
      <span className="text-sm text-[var(--muted-foreground)]">
        {props.label}
      </span>
      <span className="text-sm font-medium text-[var(--foreground)] text-right tabular-nums">
        {props.value}
      </span>
    </div>
  ),

  DataTable: ({ props }) => {
    const cols = Array.isArray(props.columns) ? props.columns : [];
    const rows = Array.isArray(props.rows) ? props.rows : [];
    return (
      <div
        data-testid="declarative-data-table"
        className="w-full overflow-x-auto"
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              // Stable row key: prefer the first column's value (primary-key-ish),
              // suffix with index in case values repeat, fall back to a JSON
              // stringify of the row when columns is empty. Stable keys prevent
              // React from re-mounting every row when the agent re-emits a
              // slightly different table.
              const pk = cols.length > 0 ? row[cols[0].key] : undefined;
              const rowKey =
                pk !== undefined ? `${pk}-${i}` : JSON.stringify(row);
              return (
                <tr
                  key={rowKey}
                  className="border-b border-[var(--border)] last:border-b-0"
                >
                  {cols.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2 tabular-nums text-[var(--foreground)]"
                    >
                      {String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },

  PrimaryButton: ({ props, dispatch }) => (
    <Button
      onClick={() => {
        if (props.action && dispatch) dispatch(props.action);
      }}
    >
      {props.label}
    </Button>
  ),

  PieChart: ({ props }) => {
    // Coerce values to numbers — the LLM sometimes emits them as strings.
    // Use a strict finite check so null/undefined/NaN/non-numeric strings are
    // surfaced via console.warn rather than silently collapsed to 0 (which
    // masks schema/data drift). Recharts requires a numeric value to render,
    // so we fall back to 0 only after logging.
    const data = (Array.isArray(props.data) ? props.data : []).map((d) => {
      const raw = (d as { value?: unknown }).value;
      const n = typeof raw === "number" ? raw : parseFloat(raw as string);
      let value: number;
      if (Number.isFinite(n)) {
        value = n;
      } else {
        console.warn("Invalid chart value", {
          component: "PieChart",
          key: "value",
          raw,
        });
        value = 0;
      }
      return { ...d, value };
    });
    return (
      <CardShell
        title={props.title}
        subtitle={props.description}
        testid="declarative-pie-chart"
      >
        {data.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No data available
          </div>
        ) : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <RechartsPieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardShell>
    );
  },

  BarChart: ({ props }) => {
    // Coerce values to numbers — the LLM sometimes emits them as strings,
    // which recharts treats as categorical (unordered Y-axis ticks). Use a
    // strict finite check so null/undefined/NaN/non-numeric strings are
    // surfaced via console.warn rather than silently collapsed to 0 (which
    // masks schema/data drift). Recharts requires a numeric value to render,
    // so we fall back to 0 only after logging.
    const data = (Array.isArray(props.data) ? props.data : []).map((d) => {
      const raw = (d as { value?: unknown }).value;
      const n = typeof raw === "number" ? raw : parseFloat(raw as string);
      let value: number;
      if (Number.isFinite(n)) {
        value = n;
      } else {
        console.warn("Invalid chart value", {
          component: "BarChart",
          key: "value",
          raw,
        });
        value = 0;
      }
      return { ...d, value };
    });
    return (
      <CardShell
        title={props.title}
        subtitle={props.description}
        testid="declarative-bar-chart"
      >
        {data.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No data available
          </div>
        ) : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <RechartsBarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.muted }} />
                <YAxis tick={{ fontSize: 11, fill: c.muted }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardShell>
    );
  },
};
```
</Step>

<Step>
### Wire definitions × renderers into a catalog

`createCatalog` is what you hand to the provider. Flip
`includeBasicCatalog: true` to merge CopilotKit's built-ins
(Column, Row, Text, Image, Card, Button, List, Tabs, …), so the LLM
can compose custom + basic components interchangeably:

```typescript
// src/app/demos/declarative-gen-ui/a2ui/catalog.ts
import { createCatalog } from "@copilotkit/a2ui-renderer";

import { myDefinitions } from "./definitions";
import { myRenderers } from "./renderers";

export const myCatalog = createCatalog(myDefinitions, myRenderers, {
  catalogId: "declarative-gen-ui-catalog",
  includeBasicCatalog: true,
});
```
</Step>

<Step>
### Pass the catalog to the provider

A single prop (`a2ui={{ catalog }}`) is all the frontend needs; the
provider registers the catalog and wires up the built-in A2UI
activity-message renderer:

```typescript
// src/app/demos/declarative-gen-ui/page.tsx
import React from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";

import { myCatalog } from "./a2ui/catalog";
import { Chat } from "./chat";

export default function DeclarativeGenUIDemo() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-declarative-gen-ui"
      agent="declarative-gen-ui"
      a2ui={{ catalog: myCatalog }}
    >
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
```

That is all the default path needs. The catalog auto-enables A2UI and
injects the `generate_a2ui` tool, so the runtime needs no `a2ui` block.
(No catalog? Turn it on from the runtime instead with
`a2ui: { injectA2UITool: true }`.)
</Step>
</Steps>

## I opted out of auto-inject, now what?

By not passing a catalog, not setting `injectA2UITool`, or by passing
a catalog and setting `injectA2UITool: false`, you have opted out
entirely. That means you hook up two pieces yourself: the
`generate_a2ui` tool which lets your agent generate A2UI surfaces, and
the `A2UIMiddleware` which lets those surfaces render.

<Steps>
<Step>
### The `A2UIMiddleware`

The `A2UIMiddleware` is what turns the agent's `a2ui_operations` into
rendered surfaces. Without it, the agent's output never becomes UI; it
falls through as a plain tool result. It can also inject the
`generate_a2ui` tool for you (`injectA2UITool: true`), letting you skip
the next step. Attach it to the AG-UI agent:

```typescript
import { A2UIMiddleware } from "@ag-ui/a2ui-middleware";

agent.use(new A2UIMiddleware({ injectA2UITool: false }));
```
</Step>

<Step>
### The A2UI agent tool

The `generate_a2ui` tool runs a secondary LLM (a subagent) that designs
the surface, which is why you hand it a model. Build it with the AG-UI
factory and add it to your agent's tools:

```python title="agent.py"
from ag_ui_langgraph import get_a2ui_tools
from langchain_openai import ChatOpenAI

generate_a2ui = get_a2ui_tools({
    "model": ChatOpenAI(model="gpt-6-luna", reasoning_effort="none"),
    "default_catalog_id": "copilotkit://app-dashboard-catalog",
})

tools = [my_other_tool, generate_a2ui]
```
</Step>
</Steps>

## Progressive streaming

The secondary LLM's `render_a2ui` tool call streams through LangGraph
as `TOOL_CALL_ARGS` events. The A2UI middleware:

1. Waits for the full `components` array before emitting anything;
   the schema must be complete before rendering starts.
2. Extracts `surfaceId` + `root` from the partial JSON.
3. Emits `createSurface` + `updateComponents` once the schema is
   complete.
4. Extracts complete `items` objects progressively and emits an
   `updateDataModel` for each, so cards appear one by one as data
   streams in.

A built-in progress indicator shows while the schema is still
generating and hides automatically once data items start arriving.

## When should I use dynamic schemas?

- You don't know the UI shape ahead of time; the agent decides what
  to show based on the user's request.
- You want to prototype A2UI without committing to a schema file yet.
- You're building a conversational dashboard where the layout varies
  per turn.

If the surface is well-known (e.g. a product card, a flight result),
prefer a **[fixed schema](./fixed-schema)**; it's faster, cheaper,
and the UI is deterministic.

<IntegrationGrid path="generative-ui/a2ui" />
