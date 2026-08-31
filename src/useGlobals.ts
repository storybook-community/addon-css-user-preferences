import * as options from "./options";

/**
 * Storybook's own `useGlobals` hook, which lives in `storybook/manager-api` for
 * the manager and in `storybook/preview-api` for the preview. Callers pass in
 * the one belonging to their bundle so this module stays usable from both.
 *
 * The manager's hook also reports `storyGlobals` — the globals the current
 * story pins itself. The preview's hook returns only the first two, so that
 * slot is optional.
 */
export type UseStorybookGlobals = () => [
  Record<string, any>,
  (newGlobals: Record<string, any>) => void,
  Record<string, any>?,
  ...unknown[]
];

/**
 * Returns globals specific to this addon, plus the subset of them the current
 * story pins. A pinned feature cannot be changed from the toolbar: Storybook
 * lets story globals win, so an update would be silently discarded.
 */
export const useGlobals = (useStorybookGlobals: UseStorybookGlobals) => {
  const [globals, updateGlobals, storyGlobals] = useStorybookGlobals();

  const params = {} as Globals;
  const pinned = {} as Globals;

  let feature: keyof Globals;
  for (feature in options.features) {
    params[feature] = globals[feature];
    pinned[feature] = storyGlobals?.[feature];
  }

  return [params, updateGlobals, pinned] as [
    Globals,
    (options: Partial<Globals>) => void,
    Globals
  ];
};

export type Globals = Record<
  keyof options.Features,
  options.Features[keyof options.Features][number] | undefined
>;
