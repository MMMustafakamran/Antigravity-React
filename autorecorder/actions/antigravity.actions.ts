import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig, type ActionContext } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { glideClick, glideTo } from './glide-click';
import { runStandardAction } from '../core/actions';
import { closeNotepad, openNotepad, typeInNotepad } from '../core/overlays/notepad';
import { clickTaskbarApp, ensureOverlays, waitForHydration } from '../core/overlays/taskbar';

/**
 * Finding clips end with the finding typed into Notepad, in plain words, so a viewer who
 * skips the doc and code segments still knows what broke (REPOS.md, "Finding clips").
 */
export const FINDING_NOTES: Record<string, string> = {
  'headless-interrupts': [
    'FINDING - Headless interrupts (FINDINGS.md #30, #31, #47)',
    '',
    'In the browser this page says "Not supported on Google Antigravity".',
    'Its .md export (what Copy Prompt gives a coding agent) still ships the code:',
    '1. It crashes: AppSurface is not defined anywhere.',
    '2. With a stand-in AppSurface, the hook never receives the interrupt',
    '   (it listens for the old "on_interrupt" event).',
    '',
    'Result: the chat is stuck and the user can never answer.',
  ].join('\n'),
  'use-interrupt': [
    'FINDING - useInterrupt (FINDINGS.md #19, #20, #47)',
    '',
    'In the browser this page says Antigravity does not support interrupts,',
    'but the HITL overview documents experimental_interrupt() for it - and it works.',
    'The .md export ships a LangGraph agent and reads event.value,',
    'which is empty for an Antigravity interrupt.',
    '',
    'Result: the card shows "a call" instead of the topic; the run still resumes.',
  ].join('\n'),
  components: [
    'FINDING - Components and surfaces (FINDINGS.md #41, #42)',
    '',
    '1. Importing standardUI breaks the build: maplibre-gl is not',
    '   in the install step (harness installs it).',
    '2. The page says "Do step 3 only, your runtime needs no change".',
    '   On Antigravity no component renders.',
    '',
    'Result: the agent answers with a Markdown table as plain text.',
  ].join('\n'),
};

/**
 * Where each finding is visible on the doc page: text that appears in the faulty snippet or
 * sentence, and a short caption drawn beside it. The clip goes back to the doc, scrolls to each
 * one, outlines it and rests the cursor on it, so the viewer sees the defect where the docs
 * publish it (REPOS.md, "Finding clips").
 */
export interface DocEvidence {
  /** Text inside the element to point at (matched against pre/code/p/li/h2/h3). */
  text: string;
  caption: string;
}

export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  // In the browser these two pages hide their code behind "Not supported" banners; the code the
  // clip runs comes from the page's .md export (FINDINGS.md #47). Point at the banners.
  'headless-interrupts': [
    { text: 'Not available for Google Antigravity yet', caption: 'The browser page says this feature is not available for Antigravity...' },
    { text: 'Not supported on Google Antigravity', caption: '...and hides the code. The .md export still ships it, and it crashes (AppSurface undefined)' },
  ],
  'use-interrupt': [
    { text: 'Not available for Google Antigravity yet', caption: 'Browser page: "not available for Antigravity". The .md export ships a LangGraph agent instead' },
    { text: 'Not supported on Google Antigravity', caption: 'Yet the HITL overview documents experimental_interrupt() for Antigravity, and it works' },
  ],
  components: [
    { text: 'npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai', caption: 'No maplibre-gl here, but standardUI needs it: the build fails' },
    { text: 'Already have CopilotKit running? Do step 3 only.', caption: 'On Antigravity, step 3 alone renders no component' },
  ],
};

async function findEvidence(page: Page, text: string) {
  for (const sel of ['pre', 'code', 'p', 'li', 'h2', 'h3']) {
    const loc = page.locator(sel, { hasText: text }).last();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) return loc;
  }
  // Callouts and banners are plain divs: fall back to the innermost element with the text.
  const any = page.getByText(text, { exact: false }).first();
  if ((await any.count()) > 0 && (await any.isVisible().catch(() => false))) return any;
  return null;
}

/** Go back to the doc page and point at each defect, one by one. */
export async function showDocEvidence(page: Page, config: PageRecordConfig): Promise<void> {
  const items = FINDING_EVIDENCE[config.id];
  if (!items?.length) return;
  console.log(`   🔎 Showing the finding on the doc page (${items.length} spot(s))...`);
  await clickTaskbarApp(page, 'chrome').catch(() => {});
  // The demo's verdict is settled before this point. docs.copilotkit.ai throws its own React
  // hydration error (#418) on some pages, and the take's error collectors would blame the app
  // for it, so they are detached before the doc revisit (FINDINGS.md #48).
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  await page.goto(config.docUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await ensureOverlays(page, 'chrome');
  await waitForHydration(page, 15000).catch(() => false);
  await sleep(1500);

  for (const item of items) {
    const target = await findEvidence(page, item.text);
    if (!target) {
      console.warn(`   ⚠️ Evidence not found on the doc page: "${item.text}"`);
      continue;
    }
    await target.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await sleep(1800);
    await target.evaluate((el, caption) => {
      const r = el.getBoundingClientRect();
      const box = document.createElement('div');
      box.className = '__finding_mark';
      Object.assign(box.style, {
        position: 'fixed', left: `${r.left - 6}px`, top: `${r.top - 6}px`,
        width: `${r.width + 12}px`, height: `${r.height + 12}px`,
        border: '3px solid #ef4444', borderRadius: '8px', zIndex: '2147483000', pointerEvents: 'none',
        boxShadow: '0 0 0 4px rgba(239,68,68,0.18)',
      });
      const label = document.createElement('div');
      label.className = '__finding_mark';
      label.textContent = caption;
      Object.assign(label.style, {
        position: 'fixed', left: `${Math.max(8, r.left - 6)}px`, top: `${Math.max(8, r.top - 44)}px`,
        maxWidth: '720px', padding: '6px 12px', background: '#ef4444', color: '#fff',
        font: '600 16px/1.3 Segoe UI, Arial, sans-serif', borderRadius: '6px',
        zIndex: '2147483001', pointerEvents: 'none',
      });
      document.body.append(box, label);
    }, item.caption);
    await glideTo(page, target, 4500);
    await page.evaluate(() => document.querySelectorAll('.__finding_mark').forEach((n) => n.remove()));
    await sleep(500);
  }
}

/** Type a page's finding into Notepad at the end of its take, after showing it on the doc. */
export async function writeFinding(page: Page, id: string, config?: PageRecordConfig): Promise<void> {
  const body = FINDING_NOTES[id];
  if (!body) return;
  if (config) await showDocEvidence(page, config).catch((e) => console.warn(`   ⚠️ Doc evidence step failed: ${String(e).slice(0, 120)}`));
  await openNotepad(page, `finding-${id}.txt`);
  await typeInNotepad(page, body);
  await closeNotepad(page, 4000);
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
    .waitFor({ state: 'visible', timeout: 60000 })
    .then(() => true)
    .catch(() => false);
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
export const runUseInterruptAction: PageActionHandler = async (page, config, root, ctx) => {
  await pickSlot(page, config, root, ctx);
  await writeFinding(page, config.id, config);
};
