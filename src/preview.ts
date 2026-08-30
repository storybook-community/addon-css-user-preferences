import type { GlobalTypes, ProjectAnnotations, Renderer } from "storybook/internal/types";
import { withGlobals } from "./withGlobals";
import * as options from "./options";

export const decorators = [withGlobals];

export const globalTypes = Object.entries(options.features).reduce(
  (globalTypes: GlobalTypes, [name, value]) =>
    Object.assign(globalTypes, {
      [name]: {
        name,
        type: {
          name: "enum",
          value,
        },
      },
    } as GlobalTypes),
  {}
);

/**
 * Default export for CSF Next, consumed by `definePreviewAddon` in `index.ts`.
 * The named exports above stay for Storybook's classic preview annotations.
 */
export default {
  decorators,
  globalTypes,
} satisfies ProjectAnnotations<Renderer>;
