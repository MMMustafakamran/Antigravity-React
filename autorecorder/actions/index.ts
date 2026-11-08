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
  runUseInterruptAction,
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
