import type { Globals } from "../useGlobals";
import { PARAM_KEY } from "../constants";

/** The CSS user preferences a story can force, keyed by media feature. */
export type CssUserPrefsParam = Partial<Globals>;

/**
 * Sets CSS user preferences for a story.
 *
 * @example
 * ```ts
 * export const Dark: StoryObj = {
 *   parameters: defineCssUserPrefsParam({ "prefers-color-scheme": "dark" })
 * }
 * ```
 */
export function defineCssUserPrefsParam(cssUserPrefs: CssUserPrefsParam) {
  return { [PARAM_KEY]: cssUserPrefs } as { cssUserPrefs: CssUserPrefsParam };
}
