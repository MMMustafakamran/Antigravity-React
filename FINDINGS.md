# Findings — Antigravity-react
Open doc defects only. A finding is proposed first and added only after the owner approves it (Claude Code proposes after the daily review and the owner approves locally: `.qa/instructions/QA-RULES.md` section 6). The entries from the 2026-11-04 Antigravity assignment were logged directly and reviewed by the owner at the end, a one-off exception that does not apply to new findings. Numbers are stable IDs (code cites `FINDINGS.md #N`), so gaps are removed findings.
Stack: `@copilotkit/react-core`/`runtime` 1.85.0, `@ag-ui/client` 1.0.4, `next` 16.4.5, `react` 19.3.0, `google-antigravity` 0.1.23, `ag-ui-antigravity` 0.2.1, `fastapi` 0.162.0, `uvicorn` 0.54.0, CLI `copilotkit` 4.33.1. Python 3.13.15, Windows 11. Docs: https://docs.copilotkit.ai/google-antigravity (snapshot 2026-11-04)

## Dev blockers (seen with `npm run dev` and normal use of the page)

### [Quickstart](https://docs.copilotkit.ai/google-antigravity/quickstart) — "Use an existing agent"
**#1 Backend crashes on start: the `.env` it tells you to create is never loaded.**
- **Doc:** "Create a `.env` file … `GEMINI_API_KEY=your_gemini_api_key`". `main.py` reads `api_key=os.environ["GEMINI_API_KEY"]` with no `load_dotenv`, and the start command is `uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`.
- **Error:** `KeyError: 'GEMINI_API_KEY'` at `main.py:7`, raised during uvicorn's app import. The harness starts it with `uv run --env-file .env uvicorn …`.

### [Human-in-the-Loop](https://docs.copilotkit.ai/google-antigravity/human-in-the-loop)
**#12 The page crashes: agent `hitl-in-chat` is never registered.**
- **Doc:** `<CopilotKit runtimeUrl="/api/copilotkit" agent="hitl-in-chat">` and `useHumanInTheLoop({ agentId: "hitl-in-chat", … })`. The quickstart runtime registers only `antigravity_agent`, and no step adds `hitl-in-chat`.
- **Error:** `useAgent: Agent 'hitl-in-chat' not found after runtime sync (runtimeUrl=/api/copilotkit). Known agents: [antigravity_agent]`. No chat renders. With the agent added to `route.ts` (harness), the picker works end to end.

### [Components and surfaces](https://docs.copilotkit.ai/google-antigravity/generative-ui/components)
**#41 Importing `standardUI` breaks the build: `maplibre-gl` isn't installed.**
- **Doc:** `npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai @tanstack/ai-openai`, then `import { standardUI } from "@copilotkit/react-core/v2/generative-ui";`.
- **Error:** `Module not found: Can't resolve 'maplibre-gl'` at `dist/v2/generative-ui.mjs:4261` (`await import("maplibre-gl")`). It's an *optional* peer dependency (`^5.0.0`) of `@copilotkit/react-core` 1.84.1, but Next 16.4.5 / Turbopack still fails to resolve it. The harness installs `maplibre-gl` 5.24.0.

**#42 On Antigravity, "Do step 3 only. Your runtime needs no change" renders no UI.**
- **Doc:** "Already have CopilotKit running? Do step 3 only … when the provider sends a catalog, the runtime gives that run a `render_ui` tool." The page's actual walkthrough is an OpenAI/TanStack `BuiltInAgent`, not Antigravity.
- **Result:** the quickstart runtime and Antigravity agent, with the doc's `<CopilotKitProvider … generativeUI={{ ui: standardUI }}>` (plus `agent="antigravity_agent"`), get the doc's own prompt "Compare the Starter, Team, and Enterprise plans in a table". No `standardUI` component renders. Across runs the agent answered with a garbled Markdown table as text (probe), or a Markdown table drawn by the chat's own Markdown renderer, with header cells shifted one column and prefaced "I've gathered general information … from various sources" (recording `ANTIGRAVITY-react-10-Components`). Not verified whether `render_ui` reached the agent. The TanStack path couldn't be run (the OpenAI key has no credit).

### All pages: what a browser shows vs. the `.md` export
**#47 Six pages tell browser readers "Not supported on Google Antigravity", but their `.md` export (what "Copy Prompt" gives a coding agent) ships the unsupported code with no warning.**
- **Browser:** useInterrupt, Headless Interrupts, State Streaming and State Rendering show "Not available for Google Antigravity yet" / "Not supported on Google Antigravity" in place of the code. The HITL overview and Shared State each show it once, for their interrupt and streaming sections. (Checked 2026-11-04 in Chromium on every tested page; the other pages have no banner.)
- **`.md`:** the same URLs + `.md` carry the LangGraph agent, the `event.value` frontend, `<AppSurface>` and the `StateStreamingMiddleware` example with no banner. #19–#23, #26, #30–#32 and #39 were found by building from the `.md` and reproduce exactly as described. A browser reader is warned, but a coding agent following "Copy Prompt" is not.
- **Contradiction:** the HITL overview tells Antigravity users to pause a server tool with `experimental_interrupt()` (it works: the run resumes, #20), while useInterrupt and Headless say Antigravity doesn't support interrupts at all.

### [Headless interrupts](https://docs.copilotkit.ai/google-antigravity/human-in-the-loop/headless)
**#30 The page crashes: `AppSurface` is not defined.**
- **Doc:** `src/app/demos/interrupt-headless/page.tsx` renders `<AppSurface pending={pending} resolve={resolve} />`. `AppSurface` is defined nowhere on the page or in the Antigravity showcase.
- **Error:** `ReferenceError: AppSurface is not defined` (Next.js 500, then a client error).

**#31 The headless hook never sees an Antigravity interrupt, so the conversation is stuck.**
- **Doc:** `useHeadlessInterrupt` subscribes for the legacy custom event `INTERRUPT_EVENT_NAME = "on_interrupt"` and reads `event.value`.
- **Result:** with a minimal harness `AppSurface` and the page's own `experimental_interrupt` backend, the agent calls `schedule_meeting` and the run ends on the interrupt, but `pending` stays `null`. Nothing renders and the run can't be resumed. Antigravity sends the standard `RUN_FINISHED` interrupt outcome, which this hook doesn't handle. Agent `interrupt-headless` is also never registered (as #12).

### [useInterrupt](https://docs.copilotkit.ai/google-antigravity/human-in-the-loop/useInterrupt)
**#19 The example backend agent is LangGraph, not Antigravity.**
- **Doc:** `# src/agents/interrupt_agent.py` imports `from langchain.agents import create_agent`, `from langchain_openai import ChatOpenAI`, `from langgraph.types import interrupt` and `from copilotkit import CopilotKitMiddleware`. None of these are in the page's install step (`pip install ag-ui-antigravity google-antigravity`), and none use Antigravity.
- **Error:** run as published, it fails with `ModuleNotFoundError: No module named 'langchain'`. The Antigravity showcase has no `gen-ui-interrupt` demo, so the whole page comes from another framework.

**#20 The frontend reads the payload from `event.value`, which is empty for Antigravity interrupts.**
- **Doc:** `const raw = event.value ?? {};` then `payload.topic ?? "a call"` and `payload.slots … : generateFallbackSlots()`.
- **Result:** with the page's own `experimental_interrupt("schedule_meeting", metadata={"topic", "attendee"})` backend, the interrupt arrives as a standard AG-UI interrupt (payload on `interrupt.metadata`). The card renders "a call" with fallback slots, and the topic and attendee are dropped. Resolve and resume do work: the agent confirms "scheduled for Tomorrow 2:00 PM". The page's own prose says standard interrupts carry the payload on `interrupt`, but the code reads `event.value`.

### [Sub-Agents](https://docs.copilotkit.ai/google-antigravity/multi-agent/subagents)
**#49 The sub-agents server crashes on start: `httpx` is imported but never installed.**
- **Doc:** the install step is `pip install ag-ui-antigravity google-antigravity`; the published `subagents.py` starts with `import httpx` and calls `generateContent` through `httpx.AsyncClient`.
- **Error:** `ModuleNotFoundError: No module named 'httpx'` when uvicorn imports the app (CI run of 2026-11-08 on today's versions). `httpx` used to arrive only as a dependency of `google-genai` 2.x; `google-genai` 3.0.0 (pulled in by `google-antigravity` 0.1.23 today) no longer depends on it, so a reader installing the page's packages now gets the crash. Still starts on the 2026-11-04 lockfile (`google-genai` 2.34.0).

### [Reasoning Messages](https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/reasoning-messages)
**#61 the chat answers but no reasoning message renders; the page shows no Antigravity backend or reasoning model, and agent "reasoning-default" is never registered.**
- Doc: frontend only, agent "reasoning-default" with no backend/model shown (intro names model `gpt-6-luna`) / Result: NOT YET PROBED; expected no reasoning card from the quickstart Gemini agent. Confirm by probe.

### [Voice](https://docs.copilotkit.ai/google-antigravity/voice)
**#63 page.tsx imports ./voice-chat, which the page never shows; Next fails with "Module not found: Can't resolve './voice-chat'" and the build error blanks every route of the app.**
- Doc: `import { VoiceChat } from "./voice-chat";` (file never shown; no install step for the voice package, no `/voice` backend) / Error: `Module not found: Can't resolve './voice-chat'` (Turbopack build error shown on every route of the dev server, not only /voice). Confirmed by harness: a placeholder voice-chat.tsx lets the other routes load again.

### [Reasoning](https://docs.copilotkit.ai/google-antigravity/generative-ui/reasoning)
**#64 no reasoning block ever renders; the page shows no backend or model that emits reasoning, and useReasoningCustomSuggestions / agent "reasoning-custom" are never defined.**
- Doc: const AGENT_ID = "reasoning-custom"; ... useReasoningCustomSuggestions(); — page shows no imports, no suggestions hook, no agent registration and no Antigravity backend/model that emits REASONING_MESSAGE events. Result: unverified (probe blocked); expected no reasoning card on the gemini-2.5-flash quickstart agent. PROBE BEFORE FINALIZING: if the card shows on :8040, downgrade to level 3.

### [A2UI](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui)
**#71 the page only shows fragments; myCatalog is never defined and no agent is named, and with the guessed setup the chat never replies.**
- Doc: <CopilotKit ... a2ui={{ catalog: myCatalog }}> with myCatalog never defined and no agent named / Result: chat never replies (2 runs, 240 s)

### [Dynamic Schema](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/dynamic-schema)
**#72 no dashboard renders; the chat shows "A2UI render error: Cannot read properties of undefined (reading 'map')".**
- Result: no dashboard renders; chat shows "A2UI render error: Cannot read properties of undefined (reading 'map')" (same as LangGraph React)

### [Fixed Schema](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/fixed-schema)
**#73 the flight card renders but stays empty: no airline, airports or price, only "Flight Details" and the Book button.**
- Result: the flight card renders empty (no airline, airports or price; TOTAL blank), only 'Flight Details' and 'Book flight'

### [Surfaces](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/surfaces)
**#87 the agent calls render_ui but nothing renders, neither in the page target nor in the chat. Same problem as the Components and surfaces page.**
- Doc: <GenerativeUISurface id="featured" ui={shopUI} ... components={["ProductGrid", "ProductCard"]} fallback={<ProductRow products={products} />} /> / Result: the Antigravity agent calls render_ui; console: [CopilotKit] The agent called the tool "render_ui", and no renderer is registered for it, so that message rendered nothing. The featured row keeps its fallback, the chat shows an empty assistant message.

### [Catalogs](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/catalogs)
**#89 the agent calls render_ui, but no catalog component renders, the reply stays empty.**
- Doc: createGenerativeUI({ id: "acme/shop@1", components: { ProductGrid, ProductCard } }) + <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: shopUI }}> / Result: the agent calls render_ui; [CopilotKit] The agent called the tool "render_ui", and no renderer is registered for it, so that message rendered nothing. No ProductGrid/ProductCard appears (empty assistant bubble, final.png).

### [Standard catalog](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/standard-catalog)
**#90 no standard component renders, the agent answers with a plain markdown table. Same as the Components and surfaces page.**
- Doc: <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: standardUI }}> (with the overrides: { Card: { component: MyCard } } example) / Result: "Compare the Starter, Team, and Enterprise plans in a table" gets a plain Markdown table from the chat's Markdown renderer; no standard Table/Card component renders.

### [State and actions](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/state-and-actions)
**#91 no product card renders; the run errors (AntigravityExecutionError: Model produced invalid output) or the tab crashes.**
- Doc: shopUI with state: { cart: cartSchema }, bind: { inCart }, functions: { addToCart }, events: { onAddToCart: {} } + useGenerativeUIState / useGenerativeUIFunction / Result: no ProductCard renders. Run 1: the browser tab crashed after render_ui; run 2: AntigravityExecutionError: Model produced invalid output.

### [Theming](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/theming)
**#94 nothing renders (render_ui has no renderer), so the theme can't be seen.**
- Doc: generativeUI={{ ui: standardUI, theme: { "--a2ui-color-accent": "#d97706", ... } }} / Result: the agent calls render_ui; no renderer is registered, nothing renders, so no themed component can be seen.

### [Transports](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/transports)
**#95 no Antigravity agent setup on the page (only LangGraph CopilotKitMiddleware); with the Antigravity agent no UI renders.**
- Doc: "Your agent must use the tools and the context entries of the run. The built-in agent does this. For a LangGraph Python agent, add CopilotKitMiddleware." / Result: tool transport with the Antigravity agent gives a plain markdown table, no generated UI. The Antigravity page gives no Antigravity guidance.

### [Markdown mode](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/markdown-mode)
**#97 no a2ui block or UI; the Antigravity agent writes html files instead. The page doesn't say how to pass the context to an Antigravity agent.**
- Doc: generativeUI={{ ui: standardUI, transport: "markdown" }}; "Any other agent needs one thing: put the run's context entries into its system prompt." / Result: the Antigravity agent writes index.html/style.css/script.js with edit_file and links them as [blocked]; no a2ui block, no surface. The page never shows how to do that for Antigravity.

### [Adopt from A2UI](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/from-a2ui)
**#99 no Airport/Arrow UI renders; the run ends in an AntigravityExecutionError.**
- Doc: createGenerativeUI({ id: "acme/flights@1", extends: [standardUI], components: { Airport, Arrow } }) + generativeUI={{ ui: appUI }} / Result: no Airport/Arrow renders; the agent called generate_image and the run ended with AntigravityExecutionError ... Multimodal function responses are not supported for this model.

## Minor notes
- #2 Quickstart: `npx copilotkit@latest init --framework antigravity` fails on CLI 4.33.1 with `Unsupported framework "antigravity"` (`copilotkit framework list` has no entry). The page's callout anticipates this.
- #3 `/google-antigravity` serves the same content as `/google-antigravity/quickstart` (byte-identical `.md`).
- #4 Quickstart: `workspaces=["/srv/agents/w1"]` is a Unix path. On Windows the harness silently creates `C:\srv\agents\w1` at the drive root, and the page says nothing about Windows.
- #5 Quickstart: the documented `app/api/copilotkit/route.ts` exports only `POST`, so the browser's `GET /api/copilotkit/info` 404s on every load. The starter uses `[[...slug]]/route.ts`.
- #6 Quickstart: a fresh `create-next-app@latest` (16.4.5) enables `cacheComponents`. The documented `<CopilotKit>` in `layout.tsx` then raises the dev error "encountered the unstable value `require('node:crypto').randomUUID()` in a Client Component" on every route. Chat still works.
- #7 Frontend Tools: the "Tell the model when to call it" snippet is `gen_ui_tool_based.py`, a chart prompt (`render_bar_chart`/`render_pie_chart`), not anything about `change_background`. The `@region[frontend-tools-agent]` tag sits in the gen-UI agent file.
- #8 Frontend Tools: that snippet starts with `from agents._common import build`, which gives `ModuleNotFoundError: No module named 'agents'`. The module exists only in CopilotKit's internal showcase.
- #9 Frontend Tools: the TSX can't be used as published. It has no `"use client"`, imports `./background` and `./suggestions` that are never shown, and stops mid-`Chat()` with no export. The harness copies the two files from the showcase and completes the rest (marked `HARNESS`).
- #10 Frontend Tools: step 1 says the tool is "registered with `useComponent`", but the code uses `useFrontendTool`.
- #11 Frontend Tools: `zod` is in no install command. It works only because it's pulled in transitively (4.6.7), while the showcase pins zod 3.
- #13 HITL: LangGraph text copied onto an Antigravity page: "A server-side `interrupt()` call in your LangGraph agent" and "`langgraph.interrupt()` as the server-side contract". That contradicts the page's own `experimental_interrupt()` step.
- #14 HITL: `hitl.py` imports `agents._common` (as in #8), and `./time-picker-card` is never shown. The TSX has no `"use client"` and stops mid-`Chat()`.
- #15 HITL: the second snippet ("fed a static list of candidate slots") repeats the whole import block when only `DEFAULT_SLOTS` is new.
- #16 HITL: the install step is `pip install ag-ui-antigravity google-antigravity`, while the quickstart uses `uv add`.
- #17 HITL: the `ask_question` callout says a parked turn "would wait forever" and that the tool is off "in this showcase". `AntigravityAgent` defaults to `enable_ask_question=True` and the quickstart `main.py` doesn't disable it, so readers' agents keep the risk without being told.
- #18 HITL: `experimental_interrupt()` is shown inside `schedule_meeting`, but registering that tool on the agent (`AntigravityAgent(tools=[...])`) isn't.
- #21 useInterrupt: the intro says "This framework ships a first-class interrupt primitive" and links LangGraph and AWS Strands docs. The code comments say "handling LangGraph `interrupt(...)` events" and "resumes the LangGraph run".
- #22 useInterrupt: agent `gen-ui-interrupt` is never registered (same as #12). `./_components/time-picker-card`, `../_shared/interrupt-fallback-slots` and `./suggestions` aren't shown, and the last two don't exist in the Antigravity showcase. The harness stubs `suggestions` and makes the card's `status` optional.
- #23 useInterrupt: the backend steps are a copy of the HITL overview's (including `hitl.py`/`book_call`), so the page describes `book_call` and `schedule_meeting` as two different flows.
- #24 Shared State: `shared_state.py` calls `build(...)` (from `agents._common`, see #8), and the `set_notes` snippet uses `experimental_get_state`/`experimental_set_state` without importing them (they come from `ag_ui_antigravity`). With the harness supplying both, read and write work: the UI's `setState` name reached the model ("Hello Zara!"), and `set_notes` re-rendered the UI.
- #25 Shared State: the frontend is only fragments of `shared-state-read-write/page.tsx`. `Preferences`, `RWAgentState`, `notes`, the imports and the component body are never shown. `NotesCard` uses `Card`/`Button`/`CardHeader`… from an unshown UI kit. Agent `shared-state-read-write` is never registered (as #12).
- #26 Shared State "Streaming partial state updates" and the whole [State streaming](https://docs.copilotkit.ai/google-antigravity/shared-state/streaming) subpage are LangGraph code (`langchain.agents.create_agent`, `ChatOpenAI(reasoning_effort="none", model="gpt-6-luna")`, `langgraph.types.Command`, `copilotkit.StateStreamingMiddleware`), with no Antigravity equivalent.
- #27 [Sub-Agents](https://docs.copilotkit.ai/google-antigravity/multi-agent/subagents): `subagents.py` imports `MODEL, aimock_headers, api_key, gemini_base_url` and `build` from the unpublished `agents._common`. As published it fails with `ModuleNotFoundError: No module named 'agents'`. With the showcase's `_common.py` copied in (harness), a supervisor turn delegates research → writing → critique and streams the `delegations` state. `aimock_headers` is CopilotKit's test-mock plumbing, shown as user code. The page hand-rolls sub-agents as raw `httpx` calls to `generateContent` and never mentions `AntigravityAgent(subagents=...)`.
- #28 Sub-Agents: the same `subagents.py` block is published twice, the second time with a `# src/agents/subagents.py` header.
- #29 [Generative UI](https://docs.copilotkit.ai/google-antigravity/generative-ui) hub: "Your Components" links to `/google-antigravity/generative-ui/your-components`, which returns 404. "Display Only" and "Interactive" link to `/generative-ui/display` and `/generative-ui/interactive`, which have no framework prefix and redirect (301) out of the Antigravity docs. The hub has a duplicated `# Generative UI` heading, and none of its sub-pages appear in the sidebar.
- #32 Headless interrupts: the page publishes the showcase's internal server wiring (a `PNI-576` ticket reference, `/data` container defaults, "takes every `import agent_server` — including the package's pytest").
- #33 [WebMCP](https://docs.copilotkit.ai/google-antigravity/webmcp): `searchOrders(status)` is called but never defined. The second snippet imports `@copilotkit/core`, which no install step adds (it's present only transitively, 1.84.1). The `webmcp` option itself exists in the 1.84.1 types. With a harness `searchOrders` stub, both snippets work on Chromium 156: `document.modelContext.getTools()` lists `searchOrders` with its JSON Schema and `readOnlyHint: true`, `executeTool` returns the handler's result, and unmounting the React component unregisters it. Not tested: Chrome's Model Context Tool Inspector extension and a natural-language agent call (step 5).
- #46 WebMCP "Test the complete path": "enable the WebMCP origin trial or local testing flag" doesn't name the flag. `document.modelContext` appeared with `--enable-experimental-web-platform-features`, not by default.
- #34 [Inspector](https://docs.copilotkit.ai/google-antigravity/inspector) (and the Quickstart's last step): "Open **Agent**. Your connected agent should be listed." With the agent connected and a run completed, the Agent pane shows "No agent selected. Select an agent from the dropdown above", and the agent dropdown starts empty. AG-UI Events, Frontend Tools (`change_background`) and the locked Rich Threads all match the page. The locked Rich Threads view's overview video rendered black.
- #35 Inspector: the "disable Inspector" snippet `<CopilotKit runtimeUrl="/api/copilotkit" enableInspector={false}>` does remove the Inspector, but it has no `agent`, so against the Antigravity runtime (`antigravity_agent`) it throws `useAgent: Agent 'default' not found after runtime sync`.
- #36 [Tool Rendering](https://docs.copilotkit.ai/google-antigravity/generative-ui/tool-rendering): the backend `TOOLS = [get_weather, search_flights, get_stock_price, roll_d20]` and `build(system_instructions=SYSTEM_PROMPT, tools=TOOLS)` use three tools, `SYSTEM_PROMPT` and `build` that are never shown (`build` is from `agents._common`, see #8). The prose says the catch-all handles "`get_stock_price` and `roll_dice`", but the tool is `roll_d20`. With the showcase's definitions copied in (harness), per-tool cards (weather, flights), the default card and "Used 2 tools" grouping all work.
- #37 Tool Rendering: `CustomCatchallRenderer` and `CatchallToolStatus` (custom catch-all and per-tool sections) are never shown. `app/page.tsx` uses agent `tool-rendering`, which is never registered (as #12). The renderers, cards and `parseJsonResult` are complete as published.
- #38 Tool Rendering: a tool that raises (seen: `get_stock_price` → `There was an error executing get_stock_price: …`) still shows the built-in card's **Done** pill. The page describes only "Running → Done" and doesn't say how errors appear.
- #39 [State Rendering](https://docs.copilotkit.ai/google-antigravity/generative-ui/state-rendering): the page says "Token-by-token state streaming is not available with Antigravity", then publishes `src/agents/shared_state_streaming.py`, a LangGraph agent (`langchain`, `ChatOpenAI(reasoning_effort="none", model="gpt-6-luna")`, `StateStreamingMiddleware`) doing exactly that. `gen_ui_agent.py`'s `set_steps` uses `experimental_get_state`/`experimental_set_state` without imports, and the frontend `useAgent({ agentId: "shared-state-streaming" })` names an unregistered agent and is a fragment. With imports added, `set_steps` does stream one `STATE_SNAPSHOT` per call mid-run.
- #43 [MCP Apps](https://docs.copilotkit.ai/google-antigravity/generative-ui/mcp-apps): the runtime snippet registers `"mcp-apps": mcpAppsAgent` and `"headless-complete": headlessCompleteAgent`, and neither is defined. It's a fragment of `src/app/api/copilotkit-mcp-apps/route.ts` with no imports or handler, and the page snippet is only a `return` block. With `mcpAppsAgent` = an `HttpAgent` to the Antigravity agent (harness), the flow works: "Draw a simple flowchart…" renders the Excalidraw MCP App in a sandboxed iframe in the chat.
- #44 MCP Apps "with Intelligence" example uses `BuiltInAgent({ model: "openai/gpt-6-luna" })`, not an Antigravity agent.
- #45 [A2UI](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui): `from copilotkit import a2ui` needs the Python `copilotkit` package (0.1.96 on PyPI has `create_surface`/`update_components`/`update_data_model`/`render`), which no Antigravity install step adds. `a2ui={{ catalog: myCatalog }}` uses an undefined `myCatalog`, and the runtime example uses an undefined `myAgent`. The page shows no Antigravity code. (The dynamic and fixed schema sub-pages exist but weren't tested.)
- #48 [useInterrupt](https://docs.copilotkit.ai/google-antigravity/human-in-the-loop/useInterrupt): the docs page itself throws `Minified React error #418` (hydration text mismatch) in Chromium on every load.
- #40 Quickstart / every page: the quickstart's `AntigravityAgent(...)` leaves all of Antigravity's built-in tools on (web search, file and shell work, artifacts). The showcase turns them off with `CapabilitiesConfig(enabled_tools=[BuiltinTools.FINISH])`, but readers are only told that in the HITL callout. Seen on Windows: during a state-rendering run, the model called `search_web`, then wrote `C:\srv\agents\w1\picnic_checklist.md` as an artifact, and the run died with `RUN_ERROR AntigravityExecutionError: … is not a valid artifact path; artifacts must be in C:\Users\QS\.gemini\antigravity\brain\<id>/`.
- #50 [Inspector](https://docs.copilotkit.ai/google-antigravity/inspector): the "Whether the Runtime answers" row links "Proving it works" to `/google-antigravity/react-native#proving-it-works`, which is a 404.
- #51 CopilotChat: agent id agentic_chat never registered on the page
- #52 CopilotChat: useAgenticChatSuggestions used, never defined or imported
- #53 CopilotSidebar: MainContent, Suggestions never defined; agent prebuilt-sidebar never registered
- #54 CopilotPopup: MainContent, Suggestions never defined; agent prebuilt-popup never registered
- #55 Open, close, and feedback: analytics used in the feedback snippet, never defined or imported
- #56 CSS Customization: CSS Variables snippet imports CopilotKitCSSProperties from @copilotkit/react-ui (v1), which the quickstart never installs; the rest of the page is v2
- #57 CSS Customization: Custom Icons snippet uses undefined YourOpenIconComponent / YourCloseIconComponent
- #58 CSS Customization: the component applying .chat-css-demo-scope is never shown
- #59 Slots (Subcomponents): the three 'What it looks like in code' snippets are cut off mid-function and only declare CustomWelcomeScreen/CustomAssistantMessage/CustomDisclaimer; Two-levels snippet uses undefined CustomToolbar/CustomCopyButton/CustomUserMessage
- #60 Headless UI: snippets are fragments: no component, `visible` undefined, bubbles need shadcn Avatar, cn, AttachmentChip, MultimodalPart never shown; agent "headless-simple" never registered; console.error label says langgraph-python
- #62 Multimodal Attachments: Quick start uses agentId="my-agent" placeholder with no note to swap in your own agent id; snippet is a bare JSX fragment
- #65 Reasoning: page.tsx tab has no import lines
- #66 Reasoning: CopilotChatReasoningMessage used in a cast but never imported
- #67 Threads Drawer: page shows no runtime code for the Intelligence connection it needs (only a signup link); works with CPK_INTELLIGENCE_API_KEY on the headless page's server.ts runtime (lists, switches, New Conversation)
- #68 Headless Threads: App passes onSelectThread to ThreadSidebar, which takes no props and never calls it, so no row can be selected; with a one-line onClick (harness) switching works
- #69 Headless Threads: server.ts calls verifyAppSession, never defined
- #70 Headless Threads: useThreads({ agentId: "my-agent" }) placeholder; the chat runs as the app's agent (antigravity_agent), so the list would show another agent's threads
- #74 JSON Render: install step: @json-render/core, @json-render/react
- #75 Hashbrown: @hashbrownai/* are beta (0.5.0-beta.4)
- #76 Components as Tools: useComponent snippet uses barChartPropsSchema and BarChart but the page never shows them
- #77 Components as Tools: system prompt tells the model to call render_pie_chart, which the page never registers
- #78 Components as Tools: gen_ui_tool_based.py imports agents._common.build, which is not published
- #79 Render agent state in your app: page relies on an agent named "default"; the Antigravity quickstart registers antigravity_agent
- #80 Render agent state in your app: with the quickstart agent the model can't see agent.state (no get_shared_state), so asking about the canvas makes it run shell commands; page defers to the shared-state setup
- #81 Agent Read-Only Context: app_context.py calls build() with no import; agents._common is not published
- #82 Agent Read-Only Context: page imports ./demo-layout and ./suggestions without showing them, and DemoContent is cut off before its return
- #83 Agent Read-Only Context: text says entries are surfaced by CopilotKitMiddleware into message history, contradicting the Antigravity get_app_context step above
- #84 Governed Action Approval UI: useInterrupt path needs a backend that raises an interrupt with metadata.action; no Antigravity backend code shown, so only the useHumanInTheLoop path is testable
- #85 Governed Action Approval UI: handleApproval calls executeSideEffect, never defined
- #86 Governed Action Approval UI: generic page with no Antigravity-specific code
- #88 Surfaces: Product, ProductRow and ./catalog are used but never shown on the page
- #92 State and actions: the page shows two different app/catalog.tsx and never the combined file; Cart never defined
- #93 State and actions: bind selector params are implicitly any (tsc TS7006), build-only
- #96 Transports: only built-in / LangGraph Python agent guidance on an Antigravity page
- #98 Markdown mode: only built-in / LangGraph Python agent guidance
- #100 Adopt from A2UI: Airport and Arrow components never shown

## Build-only (`tsc` / `next build`; `npm run dev` runs fine)
