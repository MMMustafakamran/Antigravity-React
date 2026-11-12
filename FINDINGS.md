# Findings — Antigravity-react
Open doc defects only, for the reachable pages of the Google Antigravity React docs (`.qa/instructions/QA-RULES.md` §5, §9). Numbers are stable IDs (code cites `FINDINGS.md #N`), so gaps are removed findings. Checked against the rendered pages, including their Code tabs, on 2026-11-11.
Stack: `@copilotkit/react-core`/`runtime` 1.85.0, `@ag-ui/client` 1.0.4, `next` 16.4.5, `react` 19.3.0, `google-antigravity` 0.1.23, `ag-ui-antigravity` 0.2.1, `fastapi` 0.162.0, `uvicorn` 0.54.0, CLI `copilotkit` 4.33.1. Python 3.13.15, Windows 11. Docs: https://docs.copilotkit.ai/google-antigravity (snapshot 2026-11-04, drift-checked 2026-11-11)

## Dev blockers (seen with `npm run dev` and normal use of the page)

### [Components and surfaces](https://docs.copilotkit.ai/google-antigravity/generative-ui/components)
**#42 On Antigravity, "Do step 3 only. Your runtime needs no change" renders no UI.**
- **Doc:** "Already have CopilotKit running? Do step 3 only … when the provider sends a catalog, the runtime gives that run a `render_ui` tool." The page's actual walkthrough is an OpenAI/TanStack `BuiltInAgent`, not Antigravity.
- **Result:** the Antigravity quickstart agent with the doc's `<CopilotKitProvider … generativeUI={{ ui: standardUI }}>` gets the doc's own prompt "Compare the Starter, Team, and Enterprise plans in a table". No `standardUI` component renders; the latest probe ended with an empty assistant reply after 105 s (earlier runs: a plain Markdown table). Re-checked 2026-11-12 (CI 43178874580) on the doc's own step-2 runtime shape (`[[...slug]]`, GET + POST, harness path `/api/copilotkit-gui`): reply "I don't have plan details…" as plain text, no component.

### [Sub-Agents](https://docs.copilotkit.ai/google-antigravity/multi-agent/subagents)
**#49 The sub-agents server crashes on start: `httpx` is imported but never installed.**
- **Doc:** the install step is `pip install ag-ui-antigravity google-antigravity`; the published `subagents.py` starts with `import httpx` and calls `generateContent` through `httpx.AsyncClient`.
- **Error:** `ModuleNotFoundError: No module named 'httpx'` when uvicorn imports the app (CI run of 2026-11-08 on today's versions). `httpx` used to arrive only as a dependency of `google-genai` 2.x; `google-genai` 3.0.0 (pulled in by `google-antigravity` 0.1.23 today) no longer depends on it. Still starts on the 2026-11-04 lockfile (`google-genai` 2.34.0).

### [Reasoning Messages](https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/reasoning-messages)
**#61 No reasoning message renders: the page's backend takes its model from the unpublished `agents._common`.**
- **Doc:** Code tab `src/agents/reasoning.py`: `from agents._common import REASONING_MODEL, build` … `build(system_instructions=SYSTEM_PROMPT, model=REASONING_MODEL)`. `agents._common` is in no tab, so the reasoning model is never named; the intro names only `gpt-6-luna`. The Code tab's `route.ts` does register `reasoning-default`.
- **Result:** on the Antigravity quickstart agent (probe 2026-11-10) "Think step by step: what is 17 times 23?" gets "17 times 23 is 391." and no reasoning card.

### [Voice](https://docs.copilotkit.ai/google-antigravity/voice)
**#63 `page.tsx` imports `./voice-chat`, which no tab shows; Next fails with "Module not found" and the build error blanks every route of the app.**
- **Doc:** `import { VoiceChat } from "./voice-chat";`. The Code tab has `chat.py`, `page.tsx`, `sample-audio-button.tsx`, `transcription-service.ts` and `route.ts`, but no `voice-chat`. No install command for `@copilotkit/voice` / `openai`.
- **Error:** `Module not found: Can't resolve './voice-chat'` (Turbopack build error shown on every route of the dev server, not only /voice). Confirmed by harness: a placeholder `voice-chat.tsx` lets the other routes load again.

### [Reasoning](https://docs.copilotkit.ai/google-antigravity/generative-ui/reasoning)
**#64 No reasoning block renders; `useReasoningCustomSuggestions` is never defined and the backend needs the unpublished `agents._common`.**
- **Doc:** Code tab `page.tsx`: `import { useReasoningCustomSuggestions } from "./suggestions";`. The only `suggestions.ts` on the page (reasoning-default) defines `useReasoningDefaultSuggestions`. `reasoning.py` imports `REASONING_MODEL, build` from `agents._common`, which no tab shows.
- **Result:** on the Antigravity quickstart agent the chat answers the train problem in plain step-by-step text; no reasoning block renders.

### [A2UI](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui)
**#71 The page only shows fragments; `myCatalog` is never defined and no agent is named, and with the guessed setup the chat never replies.**
- **Doc:** `<CopilotKit ... a2ui={{ catalog: myCatalog }}>` with `myCatalog` never defined and no agent named (no Code tab).
- **Result:** the chat never replies (2 runs, 240 s; probe reply empty).

### [Dynamic Schema](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/dynamic-schema)
**#72 No dashboard renders; the chat shows "A2UI render error: Cannot read properties of undefined (reading 'map')".**
- **Doc:** Code tab `a2ui_dynamic.py`, `catalog.ts`, `definitions.ts`, `page.tsx`, `renderers.tsx`, `route.ts` (harness frontend files identical to the tabs).
- **Error:** `A2UI render error: Cannot read properties of undefined (reading 'map')` (same as LangGraph React).

### [Fixed Schema](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/fixed-schema)
**#73 The flight card renders but stays empty: no airline, airports or price, only "Flight Details" and the Book button.**
- **Doc:** Code tab `a2ui_fixed.py`, `flight_schema.json`, `catalog.ts`, `definitions.ts`, `renderers.tsx`, `route.ts` (harness frontend files identical to the tabs).
- **Result:** the agent says "Here is the United flight from SFO to JFK for $289." and the card renders empty. Re-checked 2026-11-12: card shows only "Flight Details", "1-stop · economy", blank TOTAL and "Book flight".

### [Surfaces](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/surfaces)
**#87 The agent calls `render_ui` but nothing renders, neither in the page target nor in the chat.**
- **Doc:** `<GenerativeUISurface id="featured" ui={shopUI} ... fallback={<ProductRow products={products} />} />`.
- **Result:** console `[CopilotKit] The agent called the tool "render_ui", and no renderer is registered for it`; the featured row keeps its fallback, the chat shows an empty assistant message. Same on the doc's own runtime shape (re-checked 2026-11-12, see #42).

### [Catalogs](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/catalogs)
**#89 The agent calls `render_ui`, but no catalog component renders; the reply stays empty.**
- **Doc:** `createGenerativeUI({ id: "acme/shop@1", components: { ProductGrid, ProductCard } })` + `<CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: shopUI }}>`.
- **Result:** "no renderer is registered" for `render_ui`; no ProductGrid/ProductCard, empty assistant bubble. Same on the doc's own runtime shape (re-checked 2026-11-12).

### [Standard catalog](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/standard-catalog)
**#90 No standard component renders; the agent answers with a plain Markdown table.**
- **Doc:** `<CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: standardUI }}>`.
- **Result:** "Compare the Starter, Team, and Enterprise plans in a table" gets a Markdown table, no standard Table/Card. Same on the doc's own runtime shape (re-checked 2026-11-12).

### [State and actions](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/state-and-actions)
**#91 No product card renders.**
- **Doc:** `shopUI` with `state: { cart: cartSchema }`, `bind: { inCart }`, `functions: { addToCart }` + `useGenerativeUIState` / `useGenerativeUIFunction`.
- **Result:** latest probe: empty reply, no ProductCard. Earlier runs: the tab crashed after `render_ui`, or `AntigravityExecutionError: Model produced invalid output`. Same on the doc's own runtime shape (re-checked 2026-11-12).

### [Theming](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/theming)
**#94 Nothing renders, so the theme can't be seen.**
- **Doc:** `generativeUI={{ ui: standardUI, theme: { "--a2ui-color-accent": "#d97706", ... } }}`.
- **Result:** empty reply, no component. Same on the doc's own runtime shape (re-checked 2026-11-12).

### [Transports](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/transports)
**#95 No Antigravity agent setup on the page (only LangGraph `CopilotKitMiddleware`); with the Antigravity agent no UI renders.**
- **Doc:** "Your agent must use the tools and the context entries of the run. The built-in agent does this. For a LangGraph Python agent, add CopilotKitMiddleware."
- **Result:** tool transport with the Antigravity agent gives a plain Markdown table, no generated UI. Same on the doc's own runtime shape (re-checked 2026-11-12).

### [Markdown mode](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/markdown-mode)
**#97 No a2ui block or UI; the page doesn't say how to pass the context to an Antigravity agent.**
- **Doc:** `generativeUI={{ ui: standardUI, transport: "markdown" }}`; "Any other agent needs one thing: put the run's context entries into its system prompt."
- **Result:** the Antigravity agent writes `index.html`/`style.css`/`script.js` and links them as `[blocked]`; no a2ui block, no surface. Same on the doc's own runtime shape (re-checked 2026-11-12).

### [Adopt from A2UI](https://docs.copilotkit.ai/google-antigravity/generative-ui/components/from-a2ui)
**#99 No Airport/Arrow UI renders.**
- **Doc:** `createGenerativeUI({ id: "acme/flights@1", extends: [standardUI], components: { Airport, Arrow } })` + `generativeUI={{ ui: appUI }}`.
- **Result:** latest probe: empty reply. Earlier run: the agent called `generate_image` and the run ended with `AntigravityExecutionError ... Multimodal function responses are not supported for this model`. Same on the doc's own runtime shape (re-checked 2026-11-12).

## Minor notes
- #1 Quickstart: `main.py` reads `os.environ["GEMINI_API_KEY"]` but nothing loads the `.env` the page creates (no `load_dotenv`, start command has no `--env-file`): `KeyError: 'GEMINI_API_KEY'` on start. Harness starts it with `uv run --env-file .env`.
- #2 Quickstart: `npx copilotkit@latest init --framework antigravity` fails on CLI 4.33.1 with `Unsupported framework "antigravity"`. The page's callout anticipates this.
- #3 `/google-antigravity` serves the same content as `/google-antigravity/quickstart` (byte-identical `.md`).
- #4 Quickstart: `workspaces=["/srv/agents/w1"]` is a Unix path. On Windows it silently creates `C:\srv\agents\w1` at the drive root, and the page says nothing about Windows.
- #5 Quickstart: the `route.ts` snippet exports only `POST`, so the browser's `GET /api/copilotkit/info` 404s on every load, while the page's own file list names `src/app/api/copilotkit/[[...slug]]/route.ts`.
- #6 Quickstart: a fresh `create-next-app@latest` (16.4.5) enables `cacheComponents`; `<CopilotKit>` in `layout.tsx` then raises "encountered the unstable value `require('node:crypto').randomUUID()` in a Client Component" on every route. Chat still works.
- #7 Frontend Tools: the "Tell the model when to call it" snippet is `gen_ui_tool_based.py`, a chart prompt (`render_bar_chart`/`render_pie_chart`), not anything about `change_background`.
- #8 Frontend Tools: that snippet starts with `from agents._common import build`; `_common.py` is in no tab (`ModuleNotFoundError: No module named 'agents'`).
- #9 Frontend Tools: the Code tab `page.tsx` imports `./background` and `./suggestions`, which no tab shows.
- #10 Frontend Tools: step 1 says the tool is "registered with `useComponent`", but the code uses `useFrontendTool`.
- #11 Frontend Tools: `zod` is in no install command (present only transitively).
- #12 HITL: the Code tab `route.ts` maps `hitl-in-chat` (and every demo agent) to `${AGENT_URL}/<name>` on a Python `agent_server` whose mounting/registry the page never shows; `hitl.py` itself builds on `agents._common` (#14).
- #13 HITL: LangGraph text on an Antigravity page: "A server-side `interrupt()` call in your LangGraph agent" and "`langgraph.interrupt()` as the server-side contract", against the page's own `experimental_interrupt()` step.
- #14 HITL: `hitl.py` imports `build` from the unpublished `agents._common` (as #8).
- #15 HITL: the second snippet ("fed a static list of candidate slots") repeats the whole import block when only `DEFAULT_SLOTS` is new.
- #16 HITL: the install step is `pip install ag-ui-antigravity google-antigravity`, while the quickstart uses `uv add`.
- #17 HITL: the `ask_question` callout says a parked turn "would wait forever" and that the tool is off "in this showcase". `AntigravityAgent` defaults to `enable_ask_question=True` and the quickstart `main.py` doesn't disable it.
- #18 HITL: `experimental_interrupt()` is shown inside `schedule_meeting`, but registering that tool on the agent (`AntigravityAgent(tools=[...])`) isn't.
- #24 Shared State: `shared_state.py` calls `build(...)` (from `agents._common`, see #8), and the `set_notes` snippet uses `experimental_get_state`/`experimental_set_state` without importing them (they come from `ag_ui_antigravity`). With the harness supplying both, read and write work.
- #25 Shared State: the frontend is only fragments of `shared-state-read-write/page.tsx` (no Code tab). `Preferences`, `RWAgentState`, `notes`, the imports and the component body are never shown; `NotesCard` uses `Card`/`Button`/`CardHeader` from an unshown UI kit; agent `shared-state-read-write` is registered nowhere on the page.
- #27 [Sub-Agents](https://docs.copilotkit.ai/google-antigravity/multi-agent/subagents): `subagents.py` imports `MODEL, aimock_headers, api_key, gemini_base_url` and `build` from the unpublished `agents._common` (`ModuleNotFoundError: No module named 'agents'` as published). `aimock_headers` is CopilotKit's test-mock plumbing shown as user code. With the showcase's `_common.py` (harness), the supervisor delegates research → writing → critique.
- #29 [Generative UI](https://docs.copilotkit.ai/google-antigravity/generative-ui) hub: "Your Components" links to `/google-antigravity/generative-ui/your-components` (404). "Display Only" and "Interactive" link to `/generative-ui/display` and `/generative-ui/interactive`, which redirect (301) out of the Antigravity docs.
- #33 [WebMCP](https://docs.copilotkit.ai/google-antigravity/webmcp): `searchOrders(status)` is called but defined in neither `OrderSearch.tsx` nor the `webmcp.ts` tab. The second snippet imports `@copilotkit/core`, which no install step adds. With a harness `searchOrders` stub, both snippets work on Chromium 156.
- #35 Inspector: the "disable Inspector" snippet `<CopilotKit runtimeUrl="/api/copilotkit" enableInspector={false}>` has no `agent`, so against the Antigravity runtime it throws `useAgent: Agent 'default' not found after runtime sync`.
- #36 [Tool Rendering](https://docs.copilotkit.ai/google-antigravity/generative-ui/tool-rendering): the prose says the catch-all handles "`get_stock_price` and `roll_dice`", but the tool in the Code tab's `tool_rendering.py` is `roll_d20`; `tool_rendering.py` builds on the unpublished `agents._common`.
- #39 [State Rendering](https://docs.copilotkit.ai/google-antigravity/generative-ui/state-rendering): `gen_ui_agent.py`'s `set_steps` uses `experimental_get_state`/`experimental_set_state` without imports, and the frontend `useAgent({ agentId: "shared-state-streaming" })` is a fragment naming an agent the page never registers. With imports added, `set_steps` streams one `STATE_SNAPSHOT` per call mid-run.
- #40 Quickstart / every page: the quickstart's `AntigravityAgent(...)` leaves all built-in tools on (web search, file and shell work, artifacts); only the HITL callout mentions `CapabilitiesConfig(enabled_tools=[BuiltinTools.FINISH])`. Seen on Windows: a run called `search_web`, wrote an artifact outside the allowed directory and died with `RUN_ERROR AntigravityExecutionError: … is not a valid artifact path`.
- #41 Components and surfaces: `import { standardUI } from "@copilotkit/react-core/v2/generative-ui"` fails with `Module not found: Can't resolve 'maplibre-gl'` (optional peer dependency); the React install line doesn't add it (it's named only in the Angular optional-libraries note). Harness installs `maplibre-gl`.
- #44 MCP Apps "with Intelligence" example uses `BuiltInAgent({ model: "openai/gpt-6-luna" })`, not an Antigravity agent.
- #45 [A2UI](https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui): `from copilotkit import a2ui` needs the Python `copilotkit` package, which no Antigravity install step adds; `myCatalog` and the runtime example's `myAgent` are undefined.
- #47 HITL overview vs. useInterrupt/Headless: the overview tells Antigravity users to pause a server tool with `experimental_interrupt()`, while the useInterrupt and Headless Interrupts pages say "Google Antigravity doesn't support Human in the Loop: Interrupts".
- #50 [Inspector](https://docs.copilotkit.ai/google-antigravity/inspector): the "Whether the Runtime answers" row links "Proving it works" to `/google-antigravity/react-native#proving-it-works`, a 404.
- #52 CopilotChat: Code tab `page.tsx` imports `useAgenticChatSuggestions` from `./suggestions`, which the page never shows.
- #53 CopilotSidebar: Code tab `page.tsx` imports `MainContent` from `./main-content` and `Suggestions` from `./suggestions-mount`; neither file is shown.
- #54 CopilotPopup: same as #53 (`./main-content`, `./suggestions-mount` never shown).
- #55 Open, close, and feedback: `analytics.track("feedback", …)` in the feedback snippet, never defined or imported.
- #56 CSS Customization: the CSS Variables snippet imports `CopilotKitCSSProperties` from `@copilotkit/react-ui` (v1), which the quickstart never installs; the rest of the page is v2.
- #57 CSS Customization: the Custom Icons snippet uses undefined `YourOpenIconComponent` / `YourCloseIconComponent`.
- #59 Slots (Subcomponents): the "Two levels" snippet uses `CustomToolbar` and `CustomCopyButton`, defined nowhere (the Code tab's `slot-wrappers.tsx` defines the other custom slots).
- #60 Headless UI: snippets are fragments: `useAgent({ agentId: "headless-simple" })` is registered in no route (the Code tab is the headless-complete demo), no `Avatar` import, `AttachmentChip` never defined; the `console.error` label says `langgraph-python:headless-simple`.
- #62 Multimodal Attachments: Quick start uses the `agentId="my-agent"` placeholder with no note to swap in your own agent id; the snippet is a bare JSX fragment.
- #67 Threads Drawer: the page shows no runtime code for the Intelligence connection it needs (only a signup link).
- #68 Headless Threads: `App` passes `onSelectThread` to `ThreadSidebar`, which takes no props and never calls it, so no row can be selected; with a one-line `onClick` (harness) switching works.
- #69 Headless Threads: `server.ts` calls `verifyAppSession`, never defined or imported.
- #70 Headless Threads: `useThreads({ agentId: "my-agent" })` placeholder.
- #74 JSON Render: no install command; `@json-render/react` and `@json-render/core` 0.18.0 (with Zod 4) are named only in prose.
- #75 Hashbrown: `@hashbrownai/core` / `@hashbrownai/react` are beta (0.5.0-beta.4).
- #78 Components as Tools: `gen_ui_tool_based.py` imports `build` from the unpublished `agents._common`.
- #79 Render agent state in your app: the page relies on an agent named "default"; the Antigravity quickstart registers `antigravity_agent`.
- #80 Render agent state in your app: no backend shown; with the quickstart agent the model can't see `agent.state` (no `get_shared_state`), so asking about the canvas makes it run shell commands.
- #81 Agent Read-Only Context: `app_context.py` imports `build` from the unpublished `agents._common`.
- #82 Agent Read-Only Context: Code tab `page.tsx` imports `./demo-layout` and `./suggestions`, which no tab shows.
- #83 Agent Read-Only Context: the text says entries are surfaced by `CopilotKitMiddleware` into message history, contradicting the Antigravity `get_app_context()` step above.
- #84 Governed Action Approval UI: the useInterrupt path needs a backend that raises an interrupt with `metadata.action`; no Antigravity backend code is shown.
- #85 Governed Action Approval UI: `handleApproval` calls `executeSideEffect`, never defined.
- #86 Governed Action Approval UI: generic page with no Antigravity-specific code (no Code tab).
- #88 Surfaces: `Product`, `ProductRow` and `./catalog` are used but never shown.
- #92 State and actions: the page shows two different `app/catalog.tsx` and never the combined file; `Cart` is never defined.
- #96 Transports: only built-in / LangGraph Python agent guidance on an Antigravity page (see #95).
- #98 Markdown mode: only built-in / LangGraph Python agent guidance (see #97).
- #100 Adopt from A2UI: `Airport` and `Arrow` React components are never shown (only the A2UI "Before" definitions).
- #101 Components as Tools: Code tab `page.tsx` imports `PieChart`/`pieChartPropsSchema` from `./pie-chart` and `useSuggestions` from `./suggestions`; no tab shows either file (the tabs are `gen_ui_tool_based.py`, `page.tsx`, `bar-chart.tsx`, `route.ts`).
- #102 [Components and surfaces](https://docs.copilotkit.ai/google-antigravity/generative-ui/components) (also Surfaces, Standard catalog, State and actions, Theming): the new React Native links go to `/google-antigravity/react-native`, a 404 (added 2026-11-12).

## Build-only (`tsc` / `next build`; `npm run dev` runs fine)
