import type {
  DecoratorFunction,
  PartialStoryFn,
  Renderer,
  StoryContext,
} from "storybook/internal/types";
import { PARAM_KEY } from "./constants";
import { processCSS } from "./processCSS";
import { useEffect, useGlobals as useAddonGlobals } from "storybook/preview-api";
import type { Globals } from "./useGlobals";
import { useGlobals } from "./useGlobals";

export const withGlobals: DecoratorFunction<Renderer> = (
  storyFn: PartialStoryFn<Renderer>,
  context: StoryContext<Renderer>
) => {
  const [globals] = useGlobals(useAddonGlobals);

  /*
   A story's `cssUserPrefs` parameter supplies a default for any feature the
   toolbar has not set. Merging it here rather than writing it back through
   `updateGlobals` keeps the decorator free of side effects: Storybook ignores
   a globals update issued during render, so the write never applied.
  */
  const overrides = (context.parameters[PARAM_KEY] ?? {}) as Partial<Globals>;
  const features = { ...globals } as Globals;

  let feature: keyof Globals;
  for (feature in overrides) {
    if (features[feature] === undefined) {
      features[feature] = overrides[feature];
    }
  }

  // transform css
  useEffect(() => {
    processCSS(document.styleSheets, features);
  }, Object.values(features));

  return storyFn();
};
