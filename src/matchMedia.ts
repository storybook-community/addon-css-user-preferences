import * as options from "./options";
import type { Globals } from "./useGlobals";

/**
 * Conditions that are unconditionally true and unconditionally false, used in
 * place of an emulated feature.
 *
 * `processCSS` substitutes the media types `all` and `not all` because it
 * rewrites a rule's whole condition text. Here the feature can sit anywhere
 * inside a compound condition, and a media type is only legal at the start of a
 * query, so the substitute has to be a condition as well.
 */
const ALWAYS = "(min-width: 0px)";
const NEVER = "(not (min-width: 0px))";

/** Matches `(feature: value)`, tolerating the whitespace a query may carry. */
const conditionOf = (feature: string, value: string) =>
  new RegExp(`\\(\\s*${feature}\\s*:\\s*${value}\\s*\\)`, "g");

/** Matches the boolean form, `(feature)`. */
const booleanOf = (feature: string) =>
  new RegExp(`\\(\\s*${feature}\\s*\\)`, "g");

/**
 * Rewrites every emulated feature named in `query` to a condition carrying the
 * emulated outcome. A feature left at its system default is not touched, so it
 * keeps reporting the real value, and so does the rest of a compound condition.
 *
 * Returns the query unchanged when it names nothing that is being emulated.
 */
export function rewriteQuery(query: string, features: Globals) {
  let rewritten = query;

  let feature: keyof Globals;
  for (feature in features) {
    const value = features[feature];

    if (value === undefined || !rewritten.includes(feature)) continue;

    for (const alternate of options.features[feature]) {
      rewritten = rewritten.replace(
        conditionOf(feature, alternate),
        value === alternate ? ALWAYS : NEVER
      );
    }

    rewritten = rewritten.replace(
      booleanOf(feature),
      value === "no-preference" ? NEVER : ALWAYS
    );
  }

  return rewritten;
}

/** Whether a query names any feature this addon knows how to emulate. */
const namesFeature = (query: string) =>
  options.keys.some((feature) => query.includes(feature));

type MatchMedia = (query: string) => MediaQueryList;

type ChangeListener = (event: MediaQueryListEvent) => unknown;

/** The preferences currently emulated. Empty while the patch is not installed. */
let current = {} as Globals;

/**
 * A `MediaQueryList` for a query naming an emulated feature.
 *
 * It owns no matching logic of its own: it asks the real `matchMedia` about the
 * rewritten query and reports that answer, which keeps every part of the query
 * the addon does not emulate — a viewport condition, an unset preference — on
 * the browser's own evaluation, and keeps it live.
 */
class EmulatedMediaQueryList extends EventTarget implements MediaQueryList {
  /** The query as the browser serializes it, not the rewritten form. */
  readonly media: string;

  matches: boolean;

  #query: string;
  #matchMedia: MatchMedia;
  #source: MediaQueryList;
  #onchange: ChangeListener | null = null;
  #forward = () => this.refresh();

  constructor(query: string, matchMedia: MatchMedia) {
    super();

    this.#query = query;
    this.#matchMedia = matchMedia;
    this.media = matchMedia(query).media;
    this.#source = this.#sourceFor(current);
    this.#source.addEventListener("change", this.#forward);
    this.matches = this.#source.matches;
  }

  /** The real query list this one currently reads from. */
  #sourceFor(features: Globals) {
    const rewritten = rewriteQuery(this.#query, features);

    if (rewritten === this.#query) return this.#matchMedia(this.#query);

    const source = this.#matchMedia(rewritten);

    /*
     A query the browser cannot parse serializes as `not all`. Rather than
     report a confident `false` for a condition the rewrite mangled, fall back
     to the real value: an unsupported query shape reads as it does today.
    */
    return source.media === "not all" ? this.#matchMedia(this.#query) : source;
  }

  /**
   * Re-reads the emulated value and tells subscribers when it moved.
   *
   * Called when the toolbar changes a preference and when the real query list
   * behind this one changes, so a compound query still follows the viewport.
   */
  refresh() {
    const source = this.#sourceFor(current);

    if (source.media !== this.#source.media) {
      this.#source.removeEventListener("change", this.#forward);
      this.#source = source;
      source.addEventListener("change", this.#forward);
    }

    const matches = this.#source.matches;

    if (matches === this.matches) return;

    this.matches = matches;

    /*
     Deferred by a microtask. The decorator applies preferences while the story
     is rendering, and dispatching there would run a consumer's handler — very
     often a `setState` — in the middle of someone else's render. A real change
     event is asynchronous too, so nothing is lost.
    */
    queueMicrotask(() =>
      this.dispatchEvent(
        new MediaQueryListEvent("change", { media: this.media, matches })
      )
    );
  }

  get onchange() {
    return this.#onchange;
  }

  set onchange(listener: ChangeListener | null) {
    if (this.#onchange) {
      this.removeEventListener("change", this.#onchange as EventListener);
    }

    this.#onchange = listener;

    if (listener) this.addEventListener("change", listener as EventListener);
  }

  /** The pre-2020 subscription API, still what several theme libraries call. */
  addListener(listener: ChangeListener | null) {
    if (listener) this.addEventListener("change", listener as EventListener);
  }

  removeListener(listener: ChangeListener | null) {
    if (listener) this.removeEventListener("change", listener as EventListener);
  }
}

/** Lists handed out by the patch, weakly held so a dropped one can be collected. */
const lists = new Set<WeakRef<EmulatedMediaQueryList>>();

type Patch = {
  target: Window;
  original: MatchMedia;
  /** The own property `matchMedia` had before patching, if it had one. */
  owned: PropertyDescriptor | undefined;
};

let patch: Patch | undefined;

function install(target: Window) {
  if (patch?.target === target) return;
  if (patch) restoreMatchMedia(patch.target);

  const original = target.matchMedia.bind(target) as MatchMedia;

  patch = {
    target,
    original,
    owned: Object.getOwnPropertyDescriptor(target, "matchMedia"),
  };

  target.matchMedia = ((query: string) => {
    if (!namesFeature(query)) return original(query);

    const list = new EmulatedMediaQueryList(query, original);

    lists.add(new WeakRef(list));

    return list;
  }) as Window["matchMedia"];
}

/** Re-reads every live list, dropping the ones that have been collected. */
function refreshAll() {
  for (const ref of lists) {
    const list = ref.deref();

    if (list) list.refresh();
    else lists.delete(ref);
  }
}

/**
 * Makes `window.matchMedia` answer for `features`, so JavaScript reading a
 * preference sees what the CSS around it sees.
 *
 * Call it on every render, before the story renders: a consumer may read a
 * preference as it mounts, and a Storybook effect runs too late for that.
 *
 * Emulating nothing restores the real `matchMedia`, so a reader who returns
 * every preference to its system default is left with an untouched window.
 */
export function emulateMatchMedia(
  features: Globals,
  target: Window = globalThis.window
) {
  const emulating = options.keys.some(
    (feature) => features[feature] !== undefined
  );

  if (!emulating) return restoreMatchMedia(target);

  install(target);

  current = features;

  refreshAll();
}

/**
 * Puts the real `window.matchMedia` back.
 *
 * Lists already handed out keep working: they fall back to the real value and
 * stay subscribed to it, so a component that read a preference before the
 * addon was switched off is not left holding a stale answer.
 */
export function restoreMatchMedia(target: Window = globalThis.window) {
  if (patch?.target !== target) return;

  current = {} as Globals;

  // While the patch is still installed, so the lists delegate to the original.
  refreshAll();

  if (patch.owned) Object.defineProperty(target, "matchMedia", patch.owned);
  else delete (target as Partial<Window>).matchMedia;

  patch = undefined;
}
