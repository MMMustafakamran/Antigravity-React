# Tool Call Rendering

> Render your agent's tool calls with custom UI components.



<!-- interactive demo: tool-rendering -->


## What is this?

Tools are how an LLM invokes predefined, typically-deterministic functions.
Tool rendering lets you decide how each of those tool calls appears in the
chat. Instead of showing raw JSON, you register a React component that draws
a branded card for the call (arguments, live status, and the eventual
result). This is the **Generative UI** variant CopilotKit calls **tool
rendering**.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive
  Agents with Generative
  UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/)
  — a free DeepLearning.AI short course taught by CopilotKit's CEO covering the
  full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

## When should I use this?

Render tool calls when you want to:

- Show users exactly what tools the agent is invoking and with what arguments
- Display live progress indicators while a tool executes
- Render rich, polished results once a tool completes
- Give tool-heavy agents a transparent, on-brand chat experience

## Default tool rendering (zero-config)

The simplest entry point: call `useDefaultRenderTool()` with no arguments.
CopilotKit registers its built-in `DefaultToolCallRenderer` as the `*`
wildcard: every tool call renders as a tidy status card (tool name, live
**Running → Done** pill, collapsible arguments/result) without you writing
any UI. Calls the agent makes in a row are grouped into one card; see
[Grouping tool calls](#grouping-tool-calls).

Without this hook the runtime has no `*` renderer and tool calls are
invisible; the user only sees the assistant's final text summary.

```typescript
// src/app/demos/tool-rendering-default-catchall/page.tsx
  // Opt in to CopilotKit's built-in default tool-call card. Called with
  // no config so the package-provided `DefaultToolCallRenderer` is used
  // as the wildcard renderer — this is the "out-of-the-box" UI the cell
  // is meant to showcase.
  useDefaultRenderTool();
```

Here's what the built-in status card looks like for each tool call:


<!-- interactive demo: tool-rendering-default-catchall -->


## Custom catch-all

Once you want on-brand chrome, pass a `render` function to
`useDefaultRenderTool`. It's a convenience wrapper around
`useRenderTool({ name: "*", ... })`: one wildcard renderer handles every
tool call, named or not:

```typescript
// src/app/demos/tool-rendering-custom-catchall/page.tsx
  // `useDefaultRenderTool` is a convenience wrapper around
  // `useRenderTool({ name: "*", ... })` — a single wildcard renderer
  // that handles every tool call not claimed by a named renderer.
  useDefaultRenderTool(
    {
      render: ({ name, parameters, status, result }) => (
        <CustomCatchallRenderer
          name={name}
          parameters={parameters}
          status={status as CatchallToolStatus}
          result={result}
        />
      ),
    },
    [],
  );
```

Here's the branded catch-all in action, where every tool call gets the same on-brand card:


<!-- interactive demo: tool-rendering-custom-catchall -->


## Grouping tool calls

Agents often call several tools in a row. By default, CopilotKit collapses
each run of calls drawn by the built-in card from `useDefaultRenderTool()` into
one card that reads "Used 3 tools". While a call runs, the card names it
("Running read_file src/app.ts"), and opening it shows a row per call. Calls
drawn by your own renderers always show on their own and split the group
around them, unless the renderer opts in with `group: true`:

```tsx title="page.tsx"
useDefaultRenderTool({ render: MyToolRow, group: true });
```

Pick how calls show with `toolCallDisplay` on the message view:

```tsx title="page.tsx"
// "grouped" (default) | "line" | "stacked" | "turn" | "separate"
<CopilotChat messageView={{ toolCallDisplay: "line" }} />
```

| Display      | What the user sees                                                                        |
| ------------ | ----------------------------------------------------------------------------------------- |
| `"grouped"`  | One card per run of calls, collapsed to "Used 3 tools". Opens to a row per call.          |
| `"line"`     | The same grouping as a quiet line of text, like "Thought for 4 seconds".                  |
| `"stacked"`  | The latest call on top of a stack of the earlier ones. Opens into a card per call.        |
| `"turn"`     | The agent works in the open, then everything before the reply folds into "Worked for 9s". |
| `"separate"` | Every call gets its own card.                                                             |

To compare the displays side by side, run the
[Tool call display stories](https://github.com/CopilotKit/CopilotKit/blob/main/examples/v2/react/storybook/stories/ToolCallDisplay.stories.tsx)
in the React Storybook. They play a scripted run through the real message view,
with a control to switch `toolCallDisplay`.

To restyle or replace the group, use the `group` slot of the tool-calls view
(it applies to the grouped, line and stacked displays):

```tsx title="page.tsx"
// ToolTimeline: your component, given the group's `calls` and a `renderCall` function
<CopilotChat
  messageView={{
    assistantMessage: { toolCallsView: { group: ToolTimeline } },
  }}
/>
```

See [`CopilotChatToolCallGroup`](/reference/components/CopilotChatToolCallGroup)
for its props and an example replacement.

## Per-tool renderers

The most expressive path is one renderer per tool name. The primary
`tool-rendering` cell wires two: `get_weather` draws a branded
`WeatherCard`, `search_flights` draws a `FlightListCard`. Each renderer
receives the tool's parsed arguments, a live `status`, and (once the agent
returns) the `result`:

### Tool inputs and results are separate

In `useRenderTool`, `parameters` contains the **inputs** the agent sent to the
tool. It does not change into the tool's return value when `status` becomes
`"complete"`. The completed output arrives separately as `result`, a string.
For a tool that returns JSON, parse that string before reading its fields.

For example, `get_weather` might receive `{ "location": "Paris" }` and return
`{ "temperature": 22 }`. Read `parameters.location` for the requested city and
the parsed `result.temperature` for the temperature. Adding `temperature` to
the renderer's `parameters` schema does not copy it from the result.

If a card says **complete** but still shows placeholder details, check whether
those details come from `parameters` instead of the parsed `result`. Completion
reports that the tool returned; it does not fill the card's props for you.

The frontend pattern is the same for every backend. This shared, docs-only
example includes every component, type, and helper that its renderers use:

```tsx title="components/weather-card.tsx"
export interface WeatherCardProps {
  loading: boolean;
  location: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  conditions?: string;
}

export function WeatherCard({
  loading,
  location,
  temperature,
  humidity,
  windSpeed,
  conditions,
}: WeatherCardProps) {
  return (
    <article className="rounded-xl border p-4">
      <h3 className="font-semibold">{location || "Weather"}</h3>
      {loading ? (
        <p>Fetching weather...</p>
      ) : (
        <dl>
          <div>
            <dt>Conditions</dt>
            <dd>{conditions ?? "--"}</dd>
          </div>
          <div>
            <dt>Temperature</dt>
            <dd>{temperature ?? "--"}&deg;F</dd>
          </div>
          <div>
            <dt>Humidity</dt>
            <dd>{humidity ?? "--"}%</dd>
          </div>
          <div>
            <dt>Wind</dt>
            <dd>{windSpeed ?? "--"} mph</dd>
          </div>
        </dl>
      )}
    </article>
  );
}
```

```tsx title="components/flight-list-card.tsx"
export interface Flight {
  airline?: string;
  flight?: string;
  depart?: string;
  arrive?: string;
  price_usd?: number;
}

export interface FlightListCardProps {
  loading: boolean;
  origin: string;
  destination: string;
  flights: Flight[];
}

export function FlightListCard({
  loading,
  origin,
  destination,
  flights,
}: FlightListCardProps) {
  return (
    <article className="rounded-xl border p-4">
      <h3 className="font-semibold">
        {origin || "?"} → {destination || "?"}
      </h3>
      {loading ? (
        <p>Searching...</p>
      ) : (
        <ul>
          {flights.map((flight, index) => (
            <li key={`${flight.flight ?? "flight"}-${index}`}>
              {flight.airline ?? "--"} {flight.flight ?? ""}:{" "}
              {flight.depart ?? "?"} → {flight.arrive ?? "?"}
              {flight.price_usd !== undefined ? ` ($${flight.price_usd})` : ""}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
```

```ts title="lib/parse-json-result.ts"
export function parseJsonResult<T>(result: unknown): T {
  if (!result) return {} as T;

  try {
    return (typeof result === "string" ? JSON.parse(result) : result) as T;
  } catch {
    return {} as T;
  }
}
```

```tsx title="app/tool-renderers.tsx"
"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { WeatherCard } from "../components/weather-card";
import { FlightListCard, type Flight } from "../components/flight-list-card";
import { parseJsonResult } from "../lib/parse-json-result";

interface WeatherResult {
  city?: string;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  conditions?: string;
}

interface FlightSearchResult {
  origin?: string;
  destination?: string;
  flights?: Flight[];
}

export function ToolRenderers() {
  useRenderTool(
    {
      name: "get_weather",
      parameters: z.object({ location: z.string() }),
      render: ({ parameters, result, status }) => {
        const parsed = parseJsonResult<WeatherResult>(result);
        return (
          <WeatherCard
            loading={status !== "complete"}
            location={parameters?.location ?? parsed.city ?? ""}
            temperature={parsed.temperature}
            humidity={parsed.humidity}
            windSpeed={parsed.wind_speed}
            conditions={parsed.conditions}
          />
        );
      },
    },
    [],
  );

  useRenderTool(
    {
      name: "search_flights",
      parameters: z.object({
        origin: z.string(),
        destination: z.string(),
      }),
      render: ({ parameters, result, status }) => {
        const parsed = parseJsonResult<FlightSearchResult>(result);
        return (
          <FlightListCard
            loading={status !== "complete"}
            origin={parameters?.origin ?? parsed.origin ?? ""}
            destination={parameters?.destination ?? parsed.destination ?? ""}
            flights={parsed.flights ?? []}
          />
        );
      },
    },
    [],
  );

  return null;
}
```

Mount the renderers anywhere beneath the same `CopilotKit` provider as your
chat. The renderer component returns no layout of its own; it registers the
two named renderers for tool calls in the chat:

```tsx title="app/page.tsx"
"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { ToolRenderers } from "./tool-renderers";

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="tool-rendering">
      <ToolRenderers />
      <CopilotChat agentId="tool-rendering" />
    </CopilotKit>
  );
}
```


<Callout type="info">
  The `name` you pass to `useRenderTool` must match the tool name the agent
  exposes; that's how the runtime routes the call to your component.
</Callout>

Per-tool renderers compose with a catch-all: named renderers claim the
"interesting" tools and a wildcard handles everything else. In the primary
cell, the same `CustomCatchallRenderer` from above catches `get_stock_price`
and `roll_dice`:

```typescript
// src/app/demos/tool-rendering/page.tsx
  // Wildcard catch-all for anything that doesn't match a per-tool
  // renderer above.
  useDefaultRenderTool(
    {
      render: ({ name, parameters, status, result }) => (
        <CustomCatchallRenderer
          name={name}
          parameters={parameters}
          status={status as CatchallToolStatus}
          result={result}
        />
      ),
    },
    [],
  );
```

## The backend tool definition

The frontend renderer only sees what the agent sends down. Here's the
matching backend definition for `get_weather`: expose a tool named
`get_weather`, return structured data, and let the frontend renderer with
the same name paint the card.

```python
# src/agents/tool_rendering.py
def get_weather(location: str) -> dict:
    """Get the current weather for a given location."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }


```

<Steps>
  <Step>
    ### Pass the backend tools to the agent

    Backend tools are plain Python functions. Pass them as `tools=[...]` and the
    adapter derives each schema from the signature and docstring, registers it
    with Antigravity, and runs the call in this process when the model asks for
    it. Every call streams to the browser as `TOOL_CALL_START`, `TOOL_CALL_ARGS`
    and `TOOL_CALL_END`, then `TOOL_CALL_RESULT` with the returned value, so a
    frontend renderer registered under the same name paints the card.

    
~~~~python title="tool_rendering.py"
TOOLS = [get_weather, search_flights, get_stock_price, roll_d20]


def tool_rendering_agent():
    return build(system_instructions=SYSTEM_PROMPT, tools=TOOLS)


~~~~


  </Step>
</Steps>

<Callout type="info" title="Arguments arrive in one piece">
  The Antigravity harness hands the adapter each tool call with its arguments
  complete, so `TOOL_CALL_ARGS` carries them in a single event rather than
  token by token. A renderer still sees the `inProgress` → `executing` →
  `complete` statuses, but the arguments are whole from the first render.
</Callout>

<IntegrationGrid path="generative-ui/tool-rendering" />
