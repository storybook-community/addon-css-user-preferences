import { StoryCard, showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect, waitFor } from "storybook/test";
import React from "react";
import preview from "../.storybook/preview";
import { emulateMatchMedia, restoreMatchMedia, rewriteQuery } from "./matchMedia";
import type { Globals } from "./useGlobals";

/**
 * The real implementation, captured before the addon has had a chance to patch
 * anything, so a test can compare an emulated answer against the true one.
 */
const REAL_MATCH_MEDIA = window.matchMedia;
const real = (query: string) => REAL_MATCH_MEDIA.call(window, query);

/**
 * Storybook's instrumented `expect` does not preserve function identity through
 * an argument, so identity is asserted as a boolean.
 */
const isReal = () => window.matchMedia === REAL_MATCH_MEDIA;

const globals = (values: Partial<Globals>) => values as Globals;

/**
 * The subscribing form of a media query read, which is what a `useMediaQuery`
 * hook or a theme library does. It reads once as it mounts and then relies on
 * `change` events, so it also proves the patched list dispatches them.
 */
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(
    () => window.matchMedia(query).matches
  );

  React.useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);

    setMatches(list.matches);
    list.addEventListener("change", onChange);

    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

const QUERIES = [
  "(prefers-color-scheme: dark)",
  "(prefers-color-scheme: light)",
  "(prefers-reduced-motion: reduce)",
  "(prefers-reduced-motion: reduce) and (min-width: 1px)",
  "(min-width: 1px)",
];

const cell: React.CSSProperties = {
  textAlign: "left",
  padding: "0.25rem 0.75rem 0.25rem 0",
  verticalAlign: "top",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.8125rem",
};

function Row({ query }: { query: string }) {
  const matches = useMediaQuery(query);

  return (
    <tr>
      <td style={cell}>{query}</td>
      <td style={{ ...cell, fontWeight: 700 }} data-testid={query}>
        {String(matches)}
      </td>
    </tr>
  );
}

/** What `window.matchMedia` answers, read the way a component would read it. */
function MatchMediaProbe() {
  return (
    <StoryCard appearance="output" title="window.matchMedia">
      <table style={{ borderCollapse: "collapse", marginTop: "0.5rem" }}>
        <thead>
          <tr>
            <th style={{ ...cell, fontWeight: 700 }}>query</th>
            <th style={{ ...cell, fontWeight: 700 }}>matches</th>
          </tr>
        </thead>
        <tbody>
          {QUERIES.map((query) => (
            <Row key={query} query={query} />
          ))}
        </tbody>
      </table>
    </StoryCard>
  );
}

const meta = preview.meta({
  title: "How it works/Emulating matchMedia",
  component: MatchMediaProbe,
  tags: ["spec"],
});

/** What the probe currently shows for `query`. */
const valueOf = (canvasElement: HTMLElement, query: string) =>
  canvasElement.querySelector(`[data-testid="${query}"]`)?.textContent;

/**
 * The headline case: a preference read in JavaScript agrees with the CSS.
 */
export const InJavaScript = meta.story({
  name: "JavaScript sees the preference",
  tags: ["spec", "use-case", "integration"],
  globals: { "prefers-color-scheme": "dark" },
  decorators: [
    withStoryCard({
      title: "The same answer as the CSS",
      content: (
        <p>
          Emulating a dark preference rewrites the <code>@media</code> conditions{" "}
          <em>and</em> makes <code>window.matchMedia</code> report it, so a
          component that branches in JavaScript stays in step with its
          stylesheet. Preferences left at their system default keep reporting
          the real value.
        </p>
      ),
    }),
    showSource({
      source: dedent`
        // inside the story, with the toolbar set to dark
        window.matchMedia('(prefers-color-scheme: dark)').matches // true
        window.matchMedia('(prefers-color-scheme: light)').matches // false
      `,
    }),
  ],
});

InJavaScript.test("reports the emulated value", async ({ canvasElement }) => {
  await waitFor(() =>
    expect(valueOf(canvasElement, "(prefers-color-scheme: dark)")).toBe("true")
  );
});

InJavaScript.test("switches the other value off", async ({ canvasElement }) => {
  await waitFor(() =>
    expect(valueOf(canvasElement, "(prefers-color-scheme: light)")).toBe("false")
  );
});

InJavaScript.test("leaves an unset preference on the real value", async ({ canvasElement }) => {
  const expected = String(real("(prefers-reduced-motion: reduce)").matches);

  await waitFor(() =>
    expect(valueOf(canvasElement, "(prefers-reduced-motion: reduce)")).toBe(expected)
  );
});

InJavaScript.test("leaves an unrelated query alone", async ({ canvasElement }) => {
  await waitFor(() => expect(valueOf(canvasElement, "(min-width: 1px)")).toBe("true"));

  expect(window.matchMedia("(min-width: 1px)").media).toBe("(min-width: 1px)");
});

/**
 * A query can be a compound condition. Only the emulated part is substituted,
 * so the browser still evaluates the rest.
 */
export const CompoundConditions = meta.story({
  name: "Compound conditions",
  tags: ["spec", "integration"],
  globals: { "prefers-reduced-motion": "reduce" },
  decorators: [
    withStoryCard({
      title: "Only the emulated part is substituted",
      content: (
        <p>
          The preference in a compound condition is replaced by a condition
          carrying the emulated outcome, and the browser evaluates the query as
          a whole. The viewport half of the condition is still the real
          viewport, and it stays live.
        </p>
      ),
    }),
  ],
});

CompoundConditions.test("emulates one half and evaluates the other", async ({ canvasElement }) => {
  await waitFor(() =>
    expect(
      valueOf(canvasElement, "(prefers-reduced-motion: reduce) and (min-width: 1px)")
    ).toBe("true")
  );
});

CompoundConditions.test("reports the query the caller asked for", async () => {
  const query = "(prefers-reduced-motion: reduce) and (min-width: 1px)";

  await expect(window.matchMedia(query).media).toBe(real(query).media);
});

/**
 * Emulated changes come from the toolbar rather than the operating system, so
 * the patched list has to dispatch its own `change` events. Without them a
 * consumer reads a correct first value and then silently goes stale.
 */
export const Subscriptions = meta.story({
  name: "Subscribers hear a change",
  tags: ["spec", "integration"],
  globals: { "prefers-color-scheme": "light" },
  decorators: [
    withStoryCard({
      title: "A change event, from the toolbar",
      content: (
        <p>
          The rows above subscribe with <code>addEventListener('change')</code>.
          Changing a preference updates them, because the patched{" "}
          <code>MediaQueryList</code> dispatches the event the browser would
          have dispatched for a real change.
        </p>
      ),
    }),
    showSource({
      source: dedent`
        const list = window.matchMedia('(prefers-color-scheme: dark)')

        list.addEventListener('change', () => {
          list.matches // follows the toolbar
        })
      `,
    }),
  ],
});

Subscriptions.test("updates a subscribed component", async ({ canvasElement }) => {
  await waitFor(() =>
    expect(valueOf(canvasElement, "(prefers-color-scheme: dark)")).toBe("false")
  );

  try {
    emulateMatchMedia(globals({ "prefers-color-scheme": "dark" }));

    await waitFor(() =>
      expect(valueOf(canvasElement, "(prefers-color-scheme: dark)")).toBe("true")
    );
  } finally {
    restoreMatchMedia();
  }
});

Subscriptions.test("dispatches a change event carrying the new value", async () => {
  const list = window.matchMedia("(prefers-color-scheme: dark)");
  const seen: Array<{ matches: boolean; media: string }> = [];

  const onChange = (event: MediaQueryListEvent) =>
    seen.push({ matches: event.matches, media: event.media });

  list.addEventListener("change", onChange);

  try {
    emulateMatchMedia(globals({ "prefers-color-scheme": "dark" }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]).toEqual({ matches: true, media: list.media });
    expect(list.matches).toBe(true);
  } finally {
    list.removeEventListener("change", onChange);
    restoreMatchMedia();
  }
});

Subscriptions.test("notifies the deprecated addListener too", async () => {
  const list = window.matchMedia("(prefers-color-scheme: dark)");
  const seen: boolean[] = [];
  const onChange = (event: MediaQueryListEvent) => seen.push(event.matches);

  list.addListener(onChange);

  try {
    emulateMatchMedia(globals({ "prefers-color-scheme": "dark" }));
    await waitFor(() => expect(seen).toEqual([true]));

    list.removeListener(onChange);
    emulateMatchMedia(globals({ "prefers-color-scheme": "light" }));

    await waitFor(() => expect(list.matches).toBe(false));
    expect(seen).toEqual([true]);
  } finally {
    restoreMatchMedia();
  }
});

Subscriptions.test("supports the onchange property", async () => {
  const list = window.matchMedia("(prefers-color-scheme: dark)");
  const seen: boolean[] = [];

  list.onchange = (event) => seen.push(event.matches);

  try {
    emulateMatchMedia(globals({ "prefers-color-scheme": "dark" }));
    await waitFor(() => expect(seen).toEqual([true]));

    list.onchange = null;
    emulateMatchMedia(globals({ "prefers-color-scheme": "light" }));

    await waitFor(() => expect(list.matches).toBe(false));
    expect(seen).toEqual([true]);
  } finally {
    list.onchange = null;
    restoreMatchMedia();
  }
});

/**
 * A query the substitution cannot express is answered with the real value
 * rather than a guess.
 */
export const FailsClosed = meta.story({
  name: "Unsupported queries fail closed",
  tags: ["spec", "unit"],
  globals: { "prefers-color-scheme": "dark" },
  decorators: [
    withStoryCard({
      title: "A shape it cannot express",
      content: (
        <p>
          The rewrite is a substitution over the query text, so a shape it
          cannot parse — or one it would leave the browser unable to parse — is
          handed back to the real <code>matchMedia</code>. An unsupported query
          reads as it does without the addon, never as a confident wrong answer.
        </p>
      ),
    }),
  ],
});

FailsClosed.test("delegates a query the rewrite would break", async () => {
  // `(min-width: 0px) and` is not a query the browser can parse.
  const query = "(prefers-color-scheme: dark) and";

  await expect(window.matchMedia(query).matches).toBe(real(query).matches);
});

FailsClosed.test("delegates a query it cannot match at all", async () => {
  // Unbalanced, so the substitution never fires.
  const query = "(prefers-color-scheme: dark";

  await expect(window.matchMedia(query).matches).toBe(real(query).matches);
});

FailsClosed.test("substitutes only inside a condition, never a bare word", async () => {
  await expect(
    rewriteQuery(
      "prefers-color-scheme",
      globals({ "prefers-color-scheme": "dark" })
    )
  ).toBe("prefers-color-scheme");
});

FailsClosed.test("tolerates the whitespace a query may carry", async () => {
  const rewritten = rewriteQuery(
    "(  prefers-color-scheme :  dark  )",
    globals({ "prefers-color-scheme": "dark" })
  );

  await expect(real(rewritten).matches).toBe(true);
});

FailsClosed.test("reads the boolean form as no-preference means off", async () => {
  const on = rewriteQuery(
    "(prefers-reduced-motion)",
    globals({ "prefers-reduced-motion": "reduce" })
  );
  const off = rewriteQuery(
    "(prefers-reduced-motion)",
    globals({ "prefers-reduced-motion": "no-preference" })
  );

  await expect(real(on).matches).toBe(true);
  expect(real(off).matches).toBe(false);
});

/**
 * The patch belongs to the addon. A Storybook that is not emulating anything
 * must be left with the browser's own function.
 */
export const NothingEmulated = meta.story({
  name: "Nothing emulated, nothing patched",
  tags: ["spec", "unit"],
  decorators: [
    withStoryCard({
      title: "Reverting the patch",
      content: (
        <p>
          <code>window.matchMedia</code> is patched only while a preference is
          being emulated. Returning every preference to its system default
          removes the patch, and the property goes back to the browser's own
          method rather than to a wrapper of it.
        </p>
      ),
    }),
  ],
});

NothingEmulated.test("leaves the real matchMedia in place", async () => {
  await expect(isReal()).toBe(true);
});

NothingEmulated.test("hands back the browser's own query list", async () => {
  const list = window.matchMedia("(prefers-color-scheme: dark)");

  await expect(list instanceof MediaQueryList).toBe(true);
});

NothingEmulated.test("restores after emulating", async () => {
  emulateMatchMedia(globals({ "prefers-color-scheme": "dark" }));
  await expect(isReal()).toBe(false);

  restoreMatchMedia();
  expect(isReal()).toBe(true);
});

NothingEmulated.test("hands a list back to the real value when it restores", async () => {
  emulateMatchMedia(globals({ "prefers-color-scheme": "dark" }));

  const query = "(prefers-color-scheme: dark)";
  const list = window.matchMedia(query);
  const seen: boolean[] = [];

  list.addEventListener("change", (event) => seen.push(event.matches));
  expect(list.matches).toBe(true);

  restoreMatchMedia();

  await waitFor(() => expect(list.matches).toBe(real(query).matches));

  // Only a value that actually moved is announced.
  if (!real(query).matches) expect(seen.at(-1)).toBe(false);
});
