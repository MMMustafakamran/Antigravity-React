/**
 * Which handler serves which page id. Pages not listed here use runStandardAction
 * (send the page's prompt, wait for the reply).
 */
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { waitForPageReady } from './page-ready';
import {
  runFrontendToolsAction,
  runHeadlessInterruptAction,
  runHitlAction,
  runInspectorAction,
  runSharedStateAction,
  runStandardWithFinding,
  runStateRenderingAction,
  runSubagentsAction,
  runChatControlsAction,
  runUseInterruptAction,
  runThreadsDrawerAction,
  runHeadlessThreadsAction,
  runMcpAppsAction,
} from './antigravity.actions';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  'frontend-tools': runFrontendToolsAction,
  'human-in-the-loop': runHitlAction,
  'use-interrupt': runUseInterruptAction,
  'headless-interrupts': runHeadlessInterruptAction,
  'shared-state': runSharedStateAction,
  inspector: runInspectorAction,
  components: runStandardWithFinding,
  'state-rendering': runStateRenderingAction,
  subagents: runSubagentsAction,
  'chat-controls': runChatControlsAction,
  // 2026-11-10 pages (level 1): standard take, then doc evidence + Notepad.
  'clf-reasoning-messages': runStandardWithFinding,
  voice: runStandardWithFinding,
  reasoning: runStandardWithFinding,
  a2ui: runStandardWithFinding,
  'a2ui-dynamic-schema': runStandardWithFinding,
  'a2ui-fixed-schema': runStandardWithFinding,
  'gui-surfaces': runStandardWithFinding,
  'gui-catalogs': runStandardWithFinding,
  'gui-standard-catalog': runStandardWithFinding,
  'gui-state-and-actions': runStandardWithFinding,
  'gui-theming': runStandardWithFinding,
  'gui-transports': runStandardWithFinding,
  'gui-markdown-mode': runStandardWithFinding,
  'gui-from-a2ui': runStandardWithFinding,
  // Threads pages with the Intelligence key (2026-11-10).
  'threads-drawer': runThreadsDrawerAction,
  'headless-threads': runHeadlessThreadsAction,
  // HARNESS: MCP Apps counts the rendered iframe as the result when the agent adds no text.
  'mcp-apps': runMcpAppsAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  // A dev server compiles client chunks lazily, so markup can be on screen before
  // anything is wired to it. Wait for the page to settle before any handler runs.
  await waitForPageReady(page, { label: config.id });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
