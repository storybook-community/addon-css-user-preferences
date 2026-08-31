import type {
  DecoratorFunction,
  PartialStoryFn,
  Renderer,
  StoryContext,
} from "storybook/internal/types";
import { PARAM_KEY } from "./constants";
import { emulateMatchMedia } from "./matchMedia";
import { processCSS } from "./processCSS";
import { useGlobals as useAddonGlobals } from "storybook/preview-api";
import type { Globals } from "./useGlobals";
import { useGlobals } from "./useGlobals";

/**
 * The preferences the current story is being rendered with, for the observer
 * below to read. The decorator refreshes this on every render.
 */
let current = {} as Globals;

let observer: MutationObserver | undefined;

/** Elements that can bring a stylesheet with them. */
const SHEET = 'style, link[rel="stylesheet"]';

/** The ones whose sheet arrives later, over the network. */
const LINK = 'link[rel="stylesheet"]';

/**
 * Rewrites conditions in every stylesheet the document currently has.
 *
 * `processCSS` remembers each rule's initial condition, so calling this
 * repeatedly is idempotent and recovers from an earlier set of preferences.
 */
const processAll = () => processCSS(document.styleSheets, current);

/**
 * Rewrites again once a `<link>`'s sheet has arrived.
 *
 * A `<link>` is in the document before its sheet is: `link.sheet` stays `null`
 * until the request resolves and `document.styleSheets` does not list the sheet
 * before then, so the pass its own insertion triggers cannot reach it. Loading
 * is not a DOM mutation either, so nothing re-fires the observer when the sheet
 * does arrive. Waiting for `load` closes that gap; `processCSS` is idempotent,
 * so the extra pass is free of consequence.
 */
function processWhenLoaded(node: Element) {
  const links = node.matches(LINK)
    ? [node as HTMLLinkElement]
    : [...node.querySelectorAll<HTMLLinkElement>(LINK)];

  for (const link of links) {
    if (link.sheet) continue;

    link.addEventListener("load", processAll, { once: true });
  }
}

/**
 * Watches for stylesheets mounting after the story has rendered.
 *
 * A story that ships its own `<style>` inserts it while rendering, which is
 * after this decorator runs. Doing the work in a Storybook `useEffect` was not
 * enough: those effects run after the play function, so an interaction test
 * asserting on the rewritten condition raced them. Observing the document
 * instead applies the rewrite the moment a sheet appears.
 */
function observeStyleSheets() {
  if (observer || typeof MutationObserver === "undefined") return;

  observer = new MutationObserver((mutations) => {
    let found = false;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        // The sheet is usually a descendant of the subtree being mounted, not
        // the added node itself, so check both.
        if (!(node instanceof Element)) continue;

        if (node.matches(SHEET) || node.querySelector(SHEET)) {
          found = true;
          processWhenLoaded(node);
        }
      }
    }

    if (found) processAll();
  });

  observer.observe(document, { childList: true, subtree: true });
}

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

  current = features;
  observeStyleSheets();
  processAll();

  /*
   Patched here, for the same reason the rewrite above runs during render: a
   component may read a preference as it mounts.
  */
  emulateMatchMedia(features);

  return storyFn();
};
