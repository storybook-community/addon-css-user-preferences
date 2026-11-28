import type { GlobalTypes, ProjectAnnotations, Renderer } from "storybook/internal/types";
import { withGlobals } from "./withGlobals";
import * as options from "./options";

export const decorators = [withGlobals];

// Declaring each feature as a global type lets Storybook accept it as a global.
// Storybook 11 global types only describe the toolbar, so the allowed values
// live in `options.features`, which the toolbar renders.
export const globalTypes: GlobalTypes = Object.fromEntries(
  Object.keys(options.features).map((name) => [name, { name }])
);

/**
 * Default export for CSF Next, consumed by `definePreviewAddon` in `index.ts`.
 * The named exports above stay for Storybook's classic preview annotations.
 */
export default {
  decorators,
  globalTypes,
} satisfies ProjectAnnotations<Renderer>;
