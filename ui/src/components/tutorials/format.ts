/**
 * Formatting helpers for the tutorials page.
 *
 * Anything returned from here is rendered in the mono stack — these are the
 * figures a reader compares between two tutorials.
 */

import { Tutorial, TutorialFormat } from '../../types';

/** What the kit costs if you buy every part on the list. */
export const kitTotal = (tutorial: Tutorial): number =>
  tutorial.parts.reduce((sum, part) => sum + part.qty * part.price, 0);

/** How many individual items that is, not how many distinct lines. */
export const partCount = (tutorial: Tutorial): number =>
  tutorial.parts.reduce((sum, part) => sum + part.qty, 0);

/** Grouped to three digits, so column-aligned prices stay comparable. */
export const groupDigits = (amount: number): string =>
  amount.toLocaleString('en-US');

/** Grouped to three digits, so column-aligned prices stay comparable. */
export const formatPkr = (amount: number): string =>
  'Rs ' + groupDigits(amount);

/** Video length as m:ss. */
export const formatRuntime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes + ':' + String(rest).padStart(2, '0');
};

export const FORMAT_LABEL: Record<TutorialFormat, string> = {
  video: 'Video',
  guide: 'Build guide',
  wiring: 'Wiring',
};

/**
 * How much work the tutorial is, in the one unit every format shares. Runtime
 * lives on the thumbnail instead, where a viewer already looks for it.
 */
export const lengthLabel = (tutorial: Tutorial): string =>
  tutorial.steps + (tutorial.steps === 1 ? ' step' : ' steps');
