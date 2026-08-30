import * as options from "./options";

/**
 * Storybook's own `useGlobals` hook, which lives in `storybook/manager-api` for
 * the manager and in `storybook/preview-api` for the preview. Callers pass in
 * the one belonging to their bundle so this module stays usable from both.
 */
export type UseStorybookGlobals = () => [
  Record<string, any>,
  (newGlobals: Record<string, any>) => void,
  ...unknown[]
];

/** Returns globals specific to this addon. */
export const useGlobals = (useStorybookGlobals: UseStorybookGlobals) => {
  const [globals, updateGlobals] = useStorybookGlobals();

  const params = {} as Globals;

  let feature: keyof Globals;
  for (feature in options.features) {
    params[feature] = globals[feature];
  }

  return [params, updateGlobals] as [
    Globals,
    (options: Partial<Globals>) => void
  ];
};

export type Globals = Record<
  keyof options.Features,
  options.Features[keyof options.Features][number] | undefined
>;
