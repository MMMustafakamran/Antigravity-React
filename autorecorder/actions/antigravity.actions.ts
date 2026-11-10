import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig, type ActionContext } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { glideClick, glideTo } from './glide-click';
import { runStandardAction } from '../core/actions';
import { type DocEvidence, showFinding } from './doc-evidence';
import { mark } from '../core/timeline';

/**
 * Finding clips: back to the doc, drag-select each cited text like a person, then the finding
 * typed into Notepad in casual words (REPOS.md Rule 6). No boxes or labels drawn on the page.
 */
export const FINDING_NOTES: Record<string, string> = {
  'headless-interrupts': [
    'headless interrupts - findings #30 #31 #47',
    '',
    'the page in the browser says not supported on antigravity',
    'but the .md export (what copy prompt gives an agent) still has the code',
    'as written it crashes, AppSurface is never defined',
    'with a stand-in AppSurface the hook still never gets the interrupt',
    'it listens for the old on_interrupt event',
    'so the chat just hangs and you can never answer',
  ].join('\n'),
  'use-interrupt': [
    'useInterrupt - findings #19 #20 #47',
    '',
    'browser page says antigravity does not support interrupts',
    'but the hitl overview documents experimental_interrupt() and it works',
    'the .md export ships a langgraph agent and reads event.value',
    'which is empty for an antigravity interrupt',
    'so the card says "a call" instead of the topic, run still resumes',
  ].join('\n'),
  components: [
    'components and surfaces - findings #41 #42',
    '',
    'importing standardUI breaks the build, maplibre-gl is not in the install step',
    '(harness installs it so the demo can run)',
    'page says do step 3 only, your runtime needs no change',
    'on antigravity no component renders at all',
    'the agent just answers with a markdown table as plain text',
  ].join('\n'),
  subagents: [
    'sub-agents - finding #49',
    '',
    'install step is only pip install ag-ui-antigravity google-antigravity',
    'but subagents.py starts with import httpx',
    'httpx used to come in with google-genai 2.x, google-genai 3.0.0 dropped it',
    'so on todays versions the server crashes on start',
    'ModuleNotFoundError: No module named httpx',
    'the page never tells you to install httpx',
  ].join('\n'),
  'clf-reasoning-messages': [
    'page says models like gpt-6-luna emit reasoning tokens and copilotkit shows a reasoning card',
    'but it only shows frontend code, agent reasoning-default is never registered anywhere',
    'no antigravity backend or reasoning model on the page at all',
    'pointed it at the quickstart agent, chat answers fine',
    'but no reasoning message ever shows up,just the plain reply',
  ].join('\n'),
  voice: [
    'page.tsx imports VoiceChat from ./voice-chat',
    'that file is never shown anywhere on the page',
    'next dev fails with module not found cant resolve ./voice-chat',
    'and that build error blanks every route of the app not just voice',
    'also no install step for @copilotkit/voice and no backend serving /voice',
    'harness has a stub voice-chat so the other pages load,voice page still dead',
  ].join('\n'),
  reasoning: [
    'reasoning page only shows the frontend',
    'useReasoningCustomSuggestions is called but never defined',
    'agent reasoning-custom never registered, no imports in page.tsx either',
    'no backend or model that sends reasoning events for antigravity',
    'with the quickstart agent the chat replies but no reasoning block renders',
  ].join('\n'),
  a2ui: [
    'a2ui page passes catalog myCatalog to CopilotKit',
    'myCatalog is never defined on the page and no agent is named',
    'took the catalog from the dynamic schema page and the default agent',
    'sent the prompt and the chat just never replies',
    'waited 4 min over 2 runs,nothing',
  ].join('\n'),
  'a2ui-dynamic-schema': [
    'dynamic schema page says thats all the default path needs',
    'catalog + agent wired exactly like the page',
    'asked for a sales kpi dashboard',
    'no dashboard renders, chat shows a2ui render error',
    'cannot read properties of undefined reading map',
    'same thing on langgraph react',
  ].join('\n'),
  'a2ui-fixed-schema': [
    'fixed schema page, flight card schema + agent streams the data',
    'page says bound props get resolved against the data model',
    'asked for a united flight sfo to jfk for 289',
    'agent says here is the flight,card shows up',
    'but its empty, no airline no airports no price,total blank',
    'only flight details title and the book flight button',
  ].join('\n'),
  'gui-surfaces': [
    "surfaces page, the agent is supposed to fill the featured products row",
    "agent calls render_ui but nothing renders",
    "not in the page target and not in the chat either",
    "no renderer is registered for it on antigravity",
    "same thing as the components and surfaces page",
  ].join('\n'),
  'gui-catalogs': [
    "catalogs page,shopUI catalog passed in like the page shows",
    "asked for 2 running shoes as product cards",
    "agent calls render_ui, no catalog component renders",
    "reply just stays empty,no renderer registered",
  ].join('\n'),
  'gui-standard-catalog': [
    "standard catalog page,standardUI passed in",
    "asked to compare starter team enterprise in a table",
    "no standard component renders",
    "agent just answers with a plain markdown table",
    "same as components and surfaces page",
  ].join('\n'),
  'gui-state-and-actions': [
    "state and actions page,product card with add to cart",
    "asked for the trail runner card",
    "no product card renders",
    "run errors antigravityexecutionerror model produced invalid output",
    "or the tab just crashes",
  ].join('\n'),
  'gui-theming': [
    "theming page sets a2ui colors like the accent",
    "asked for a card with a subscribe button",
    "nothing renders,render_ui has no renderer",
    "so u cant see the theme at all",
  ].join('\n'),
  'gui-transports': [
    "transports page only shows langgraph setup copilotkitmiddleware",
    "nothing for an antigravity agent",
    "used the antigravity agent anyway",
    "asked for the plans table,no ui renders",
  ].join('\n'),
  'gui-markdown-mode': [
    "markdown mode page says any other agent just needs the context in its system prompt",
    "doesnt say how to do that for antigravity",
    "asked for a seat estimator with a slider",
    "no a2ui block,no ui",
    "agent writes html files instead",
  ].join('\n'),
  'gui-from-a2ui': [
    "adopt from a2ui page, airport and arrow components",
    "asked for my flight sfo to jfk",
    "no airport or arrow ui renders",
    "run ends in antigravityexecutionerror",
  ].join('\n'),
};

export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  // In the browser these two pages hide their code behind "Not supported" banners; the code the
  // clip runs comes from the page's .md export (FINDINGS.md #47). Point at the banners.
  'headless-interrupts': [
    { text: 'Not available for Google Antigravity yet', caption: 'Browser page says the feature is not available for Antigravity' },
    { text: 'Not supported on Google Antigravity', caption: 'Code hidden here; the .md export still ships it and it crashes' },
  ],
  'use-interrupt': [
    { text: 'Not available for Google Antigravity yet', caption: 'Browser page: not available for Antigravity' },
    { text: 'Not supported on Google Antigravity', caption: 'Yet experimental_interrupt() works for Antigravity' },
  ],
  components: [
    { text: 'npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai', caption: 'No maplibre-gl, but standardUI needs it' },
    { text: 'Already have CopilotKit running? Do step 3 only.', caption: 'Step 3 alone renders no component on Antigravity' },
  ],
  subagents: [
    { text: 'pip install ag-ui-antigravity google-antigravity', caption: 'Install step: no httpx' },
    { text: 'import httpx', caption: 'The code needs httpx (FINDINGS.md #49)' },
  ],
  'clf-reasoning-messages': [
    { text: 'Some models (like gpt-6-luna) emit reasoning tokens', caption: 'Promises a reasoning card; no Antigravity backend/model shown' },
    { text: 'const AGENT_ID = "reasoning-default";', caption: 'Agent never registered (FINDINGS.md #61)' },
  ],
  voice: [
    { text: 'import { VoiceChat } from "./voice-chat";', caption: 'voice-chat.tsx never shown: Module not found (FINDINGS.md #63)' },
    { text: 'import { TranscriptionServiceOpenAI } from "@copilotkit/voice";', caption: 'No install step for @copilotkit/voice' },
  ],
  reasoning: [
    { text: 'useReasoningCustomSuggestions();', caption: 'Hook never defined (FINDINGS.md #64)' },
    { text: 'const AGENT_ID = "reasoning-custom";', caption: 'Agent never registered, no reasoning backend shown' },
  ],
  a2ui: [
    { text: 'a2ui={{ catalog: myCatalog }}', caption: 'myCatalog never defined, no agent named (FINDINGS.md #71)' },
  ],
  'a2ui-dynamic-schema': [
    { text: 'That is all the default path needs.', caption: 'Wired as shown; A2UI render error instead of a dashboard (FINDINGS.md #72)' },
  ],
  'a2ui-fixed-schema': [
    { text: 'resolved against the data model', caption: 'Card renders but no bound value shows (FINDINGS.md #73)' },
  ],
  'gui-surfaces': [{ text: "fallback={<ProductRow products={products} />}", caption: 'render_ui has no renderer (FINDINGS.md #87)' }],
  'gui-catalogs': [{ text: "generativeUI={{ ui: shopUI }}", caption: 'render_ui has no renderer (FINDINGS.md #89)' }],
  'gui-standard-catalog': [{ text: "generativeUI={{ ui: standardUI }}", caption: 'render_ui has no renderer (FINDINGS.md #90)' }],
  'gui-state-and-actions': [{ text: "state: { cart: cartSchema },", caption: 'render_ui has no renderer (FINDINGS.md #91)' }],
  'gui-theming': [{ text: "\"--a2ui-color-accent\": \"#d97706\",", caption: 'render_ui has no renderer (FINDINGS.md #94)' }],
  'gui-transports': [{ text: "For a LangGraph Python agent, add CopilotKitMiddleware.", caption: 'render_ui has no renderer (FINDINGS.md #95)' }],
  'gui-markdown-mode': [{ text: "Any other agent needs one thing: put the run's context entries into its system prompt.", caption: 'render_ui has no renderer (FINDINGS.md #97)' }],
  'gui-from-a2ui': [{ text: "generativeUI={{ ui: appUI }}", caption: 'render_ui has no renderer (FINDINGS.md #99)' }],
};

/**
 * Level 2 pages (QA-RULES §8a): already reported in the team doc and failing the same way.
 * Short clip: the take ends after the demo (no doc highlight, no Notepad); the voice-over says it.
 */
export const KNOWN_ISSUE = new Set<string>(['use-interrupt']);

/** Type a page's finding into Notepad at the end of its take, after showing it on the doc. */
export async function writeFinding(page: Page, id: string, config?: PageRecordConfig): Promise<void> {
  if (!FINDING_NOTES[id] || !config) return;
  if (KNOWN_ISSUE.has(id)) return;
  await showFinding(page, config, FINDING_EVIDENCE[id], FINDING_NOTES[id]);
}

/** The standard prompt-and-reply take, then the finding in Notepad. */
export const runStandardWithFinding: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
  } finally {
    // A failed take still gets its explanation.
    await writeFinding(page, config.id, config);
  }
};

/**
 * Page actions for Google Antigravity + React. Each one drives the feature its doc page
 * teaches and checks the effect the page promises. A missing effect calls ctx.fail, so a
 * broken page records as a failing clip instead of a quiet pass.
 */

async function settle(page: Page, msgCount: number, ctx: ActionContext): Promise<void> {
  try {
    await waitForAgentResponseCompletion(page, 2500, msgCount);
  } catch (e) {
    ctx.warn(`Reply did not complete cleanly: ${String(e).slice(0, 160)}`);
  }
}

/** Frontend Tools: the agent calls change_background and the page background changes. */
export const runFrontendToolsAction: PageActionHandler = async (page, config, _root, ctx) => {
  const bg = page.locator('[data-testid="frontend-tools-background"]');
  const before = await bg.getAttribute('data-background-value').catch(() => null);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const changed = await page
    .waitForFunction(
      (prev) => document.querySelector('[data-testid="frontend-tools-background"]')?.getAttribute('data-background-value') !== prev,
      before,
      { timeout: 60000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!changed) ctx.fail('change_background never ran: the background did not change.');
  await settle(page, msgCount, ctx);
  await sleep(2500);
};

/** Topic the last picker card showed (read before the slot is clicked; the card then collapses). */
let lastTopic: string | null = null;

/** HITL and useInterrupt: a picker appears in the chat, the user picks a slot, the run resumes. */
function pickSlotAction(slotLabel: string): PageActionHandler {
  return async (page: Page, config: PageRecordConfig, _root, ctx) => {
    const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
    const slot = page.getByRole('button', { name: slotLabel }).first();
    const appeared = await slot.waitFor({ state: 'visible', timeout: 90000 }).then(() => true).catch(() => false);
    if (!appeared) {
      ctx.fail(`The time picker never appeared (no "${slotLabel}" button).`);
      return;
    }
    // Show the card's header first: on the useInterrupt page it reads "a call" (payload lost, FINDINGS.md #20).
    await glideTo(page, page.getByText('Book a call', { exact: false }).first(), 2500);
    lastTopic = (await page.locator('[data-testid="time-picker-card"] h3').first().textContent().catch(() => null))?.trim() ?? null;
    await glideClick(page, slot);
    await sleep(1500);
    await settle(page, msgCount, ctx);
    await sleep(3000);
  };
}

/** Headless interrupts: the hook should surface the pending interrupt. It never does on Antigravity. */
export const runHeadlessInterruptAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const surfaced = await page
    .getByRole('button', { name: 'Tomorrow 2:00 PM' })
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!surfaced) mark('error');
  await glideTo(page, page.locator('[data-testid="app-surface"]'), 3000);
  await writeFinding(page, config.id, config);
  if (!surfaced) ctx.fail('Headless hook never received the interrupt: "no pending interrupt" (FINDINGS.md #31).');
};

/** Shared State: the UI writes a name into state, the agent reads it and writes a note back. */
export const runSharedStateAction: PageActionHandler = async (page, config, _root, ctx) => {
  const name = page.locator('[data-testid="pref-name"]');
  await glideClick(page, name);
  await name.pressSequentially('Zara', { delay: 120 });
  await name.blur();
  await sleep(1200);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const noted = await page
    .locator('[data-testid="notes-list"] li')
    .first()
    .waitFor({ state: 'visible', timeout: 90000 })
    .then(() => true)
    .catch(() => false);
  if (!noted) ctx.fail('set_notes never updated the notes panel.');
  await settle(page, msgCount, ctx);
  await glideTo(page, page.locator('[data-testid="notes-list"]'), 2500);
};

/** Inspector: run one turn, open the launcher, walk the panes the doc names. */
export const runInspectorAction: PageActionHandler = async (page, config, _root, ctx) => {
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  await settle(page, msgCount, ctx);
  const inspector = page.locator('cpk-web-inspector');
  if ((await inspector.count()) === 0) {
    ctx.fail('No <cpk-web-inspector> on the page.');
    return;
  }
  await glideClick(page, inspector.locator('button').first());
  await sleep(2500);
  for (const pane of ['Agent', 'AG-UI Events', 'Frontend Tools', 'Rich Threads']) {
    const link = inspector.getByText(pane, { exact: true }).first();
    if (await link.isVisible().catch(() => false)) {
      await glideClick(page, link);
      await sleep(3500);
    } else if (pane !== 'Frontend Tools') {
      ctx.warn(`Inspector pane "${pane}" not found.`);
    }
  }
};

export const runHitlAction = pickSlotAction('Tomorrow 2:00 PM');
const pickSlot = pickSlotAction('Tomorrow 2:00 PM');
/**
 * useInterrupt (level 2, ❌): runs only on harness wiring (the page's backend is LangGraph, #19, and
 * `gen-ui-interrupt` is never registered, #22). Even then the card reads "a call": the doc's
 * frontend reads `event.value`, empty for an Antigravity interrupt (#20).
 */
export const runUseInterruptAction: PageActionHandler = async (page, config, root, ctx) => {
  lastTopic = null;
  await pickSlot(page, config, root, ctx);
  if (lastTopic === 'a call') {
    mark('error', 'card header reads "a call": interrupt payload lost (event.value)');
    ctx.fail('The card shows "a call" instead of the topic: event.value is empty for Antigravity (FINDINGS.md #20). Backend on the page is LangGraph (#19).');
  }
  await writeFinding(page, config.id, config);
};

/** State Rendering: set_steps streams the plan into agent state; the steps panel re-renders mid-run. */
export const runStateRenderingAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const firstStep = page.locator('[data-testid="step-item"]').first();
  const appeared = await firstStep.waitFor({ state: 'visible', timeout: 120000 }).then(() => true).catch(() => false);
  if (!appeared) {
    mark('error');
    ctx.fail('set_steps never rendered: the steps panel stayed empty.');
    return;
  }
  mark('action', 'steps rendered from agent state');
  await glideTo(page, page.locator('[data-testid="steps-panel"]'), 2000);
  // The agent mostly talks through set_steps tool calls, not chat text, so the chat-reply wait
  // gives up early. Follow the run itself: the LIVE badge (OnRunStatusChanged) goes away at the end.
  const finished = await page
    .locator('[data-testid="live-badge"]')
    .waitFor({ state: 'detached', timeout: 240000 })
    .then(() => true)
    .catch(() => false);
  if (!finished) ctx.warn('Run still LIVE after 4 minutes.');
  await sleep(2000);
  const statuses = await page.locator('[data-testid="step-item"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-status')));
  if (!statuses.length || statuses.some((s) => s !== 'completed')) {
    ctx.warn(`Run ended with steps not all completed: ${statuses.join(', ')}`);
  }
  await glideTo(page, page.locator('[data-testid="steps-progress"]'), 2500);
};

/** Sub-Agents: the supervisor delegates; each sub-agent call lands in the delegation log mid-run. */
export const runSubagentsAction: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runSubagentsTake(page, config, root, ctx);
  } finally {
    // FINDINGS.md #49: on today's versions the sub-agents server never starts.
    await writeFinding(page, config.id, config);
  }
};

const runSubagentsTake: PageActionHandler = async (page, config, _root, ctx) => {
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const entries = page.locator('[data-testid="delegation-entry"]');
  // Stop waiting as soon as the run errors (e.g. "fetch failed" when the sub-agents server is
  // down, FINDINGS.md #49): minutes of a frozen chat explain nothing.
  const runError = page.locator('[data-testid="copilot-error-banner"]').or(page.getByText(/fetch failed|Agent error/i)).first();
  const outcome = await Promise.race([
    entries.first().waitFor({ state: 'visible', timeout: 180000 }).then(() => 'delegated' as const),
    runError.waitFor({ state: 'visible', timeout: 180000 }).then(() => 'error' as const),
  ]).catch(() => 'timeout' as const);
  if (outcome !== 'delegated') {
    mark('error');
    if (outcome === 'error') await glideTo(page, runError, 2500).catch(() => {});
    await sleep(3000);
    ctx.fail(
      outcome === 'error'
        ? 'The run failed before any delegation (error shown in the chat).'
        : 'No delegation ever reached the log (agent.state.delegations stayed empty).',
    );
    return;
  }
  mark('action', 'first delegation in the log');
  await glideTo(page, entries.first(), 2000);
  await settle(page, msgCount, ctx);
  const fired = await page
    .locator('[data-testid="subagent-indicators"] [data-fired="true"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-role')));
  if (fired.length < 3) ctx.warn(`Supervisor called only: ${fired.join(', ') || 'none'} (doc: research, write, critique).`);
  await glideTo(page, page.locator('[data-testid="delegation-count"]'), 1500);
  // Scroll the log (the wheel scrolls what is under the cursor) so every delegation is seen.
  await glideTo(page, entries.first(), 500);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 250);
    await sleep(700);
  }
  await sleep(1500);
};
