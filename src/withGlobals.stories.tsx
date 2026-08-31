import { showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect, waitFor } from "storybook/test";
import React from "react";
import preview from "../.storybook/preview";
import { defineCssUserPrefsParam } from "./parameters/define_css_user_prefs_param";

/**
 * End-to-end cover for the decorator. Each story ships real `@media` rules and
 * asserts both the rewritten condition and the resulting computed style, so it
 * exercises the whole chain: globals or parameters, into `processCSS`, into the
 * live CSSOM.
 */
const GREEN = "rgb(0, 128, 0)";
const RED = "rgb(255, 0, 0)";
const BLUE = "rgb(0, 0, 255)";

const CSS = `
  .css-user-prefs-subject { color: ${RED}; }
  @media (prefers-color-scheme: dark) {
    .css-user-prefs-subject { color: ${GREEN}; }
  }
  @media (prefers-reduced-motion: reduce) {
    .css-user-prefs-subject { background-color: ${BLUE}; }
  }
  @media (min-width: 1px) {
    .css-user-prefs-subject { font-style: italic; }
  }
`;

function Subject() {
  return (
    <>
      <style data-testid="subject-style">{CSS}</style>
      <p className="css-user-prefs-subject" data-testid="subject">
        Emulated preference
      </p>
    </>
  );
}

const meta = preview.meta({
  title: "Usage/Emulating preferences",
  component: Subject,
  tags: ["use-case"],
});

const colorOf = (el: Element) => getComputedStyle(el).color;
const backgroundOf = (el: Element) => getComputedStyle(el).backgroundColor;

/** The media conditions of the story's own stylesheet, in source order. */
function conditionsOf(canvasElement: HTMLElement) {
  const style = canvasElement.querySelector<HTMLStyleElement>(
    '[data-testid="subject-style"]'
  )!;
  return [...(style.sheet!.cssRules as unknown as CSSRule[])]
    .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
    .map((rule) => rule.media.mediaText);
}

const sourceFor = (setting: string) =>
  dedent`
    // your own CSS, unchanged
    @media (prefers-color-scheme: dark) { … }

    // CSF Next
    export const Story = meta.story({ ${setting} })

    // CSF 3
    export const Story = { ${setting} }
  `;

/** Globals are the primary mechanism: the toolbar writes them. */
export const FromTheToolbar = meta.story({
  name: "From the toolbar",
  tags: ["spec", "use-case", "integration"],
  globals: { "prefers-color-scheme": "dark" },
  decorators: [
    withStoryCard({
      title: "Emulating a dark preference",
      content: (
        <p>
          The dark-scheme rule applies even though the browser is not in dark
          mode, because the addon rewrote the condition to <code>all</code>.
        </p>
      ),
    }),
    showSource({ source: sourceFor(`globals: { 'prefers-color-scheme': 'dark' }`) }),
  ],
});

FromTheToolbar.test("rewrites the matching condition to all", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("all"));
});

FromTheToolbar.test("applies the dark rule", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
});

/** The opposite value disables the query, so the base rule wins. */
export const TheOppositeValue = meta.story({
  name: "Switching a rule off",
  tags: ["use-case", "integration"],
  globals: { "prefers-color-scheme": "light" },
  decorators: [
    withStoryCard({
      title: "Emulating a light preference",
      content: (
        <p>
          Selecting the other value rewrites the condition to{" "}
          <code>not all</code>, so the dark rule is switched off rather than
          merely unmatched.
        </p>
      ),
    }),
    showSource({ source: sourceFor(`globals: { 'prefers-color-scheme': 'light' }`) }),
  ],
});

TheOppositeValue.test("rewrites the condition to not all", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("not all"));
});

TheOppositeValue.test("falls back to the base rule", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(RED));
});

/** Two features at once must not interfere with each other. */
export const TwoFeaturesAtOnce = meta.story({
  name: "Two preferences at once",
  tags: ["use-case", "integration"],
  globals: {
    "prefers-color-scheme": "dark",
    "prefers-reduced-motion": "reduce",
  },
  decorators: [
    withStoryCard({
      title: "Two preferences at once",
      content: (
        <p>
          Colour comes from the dark rule and background from the reduced-motion
          rule, so both conditions were rewritten independently.
        </p>
      ),
    }),
    showSource({
      source: sourceFor(
        `globals: {\n    'prefers-color-scheme': 'dark',\n    'prefers-reduced-motion': 'reduce',\n  }`
      ),
    }),
  ],
});

TwoFeaturesAtOnce.test("applies both features", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
  await waitFor(() => expect(backgroundOf(subject)).toBe(BLUE));
});

TwoFeaturesAtOnce.test("rewrites both conditions", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement).slice(0, 2)).toEqual(["all", "all"]));
});

/** Selecting one feature must leave every other query untouched. */
export const OnlyTheSelectedFeature = meta.story({
  name: "Other queries are untouched",
  tags: ["spec", "integration"],
  globals: { "prefers-color-scheme": "dark" },
  decorators: [
    withStoryCard({
      title: "Other queries are left alone",
      content: (
        <p>
          Only conditions naming a selected feature are rewritten. The
          reduced-motion rule and an unrelated <code>min-width</code> query keep
          their original text.
        </p>
      ),
    }),
  ],
});

OnlyTheSelectedFeature.test("leaves unselected features untouched", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("all"));
  expect(conditionsOf(canvasElement)[1]).toBe("(prefers-reduced-motion: reduce)");
});

OnlyTheSelectedFeature.test("leaves unrelated queries untouched", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("all"));
  expect(conditionsOf(canvasElement)[2]).toBe("(min-width: 1px)");
});

OnlyTheSelectedFeature.test("does not apply the unselected feature", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
  expect(backgroundOf(subject)).not.toBe(BLUE);
});

/**
 * The parameter path is the per-story override. It supplies a default for any
 * feature the toolbar has not set.
 */
export const PerStory = meta.story({
  name: "Pinning one per story",
  tags: ["use-case", "props", "integration"],
  parameters: defineCssUserPrefsParam({ "prefers-color-scheme": "dark" }),
  decorators: [
    withStoryCard({
      title: "Setting a preference per story",
      content: (
        <p>
          A story can pin a preference with <code>defineCssUserPrefsParam</code>
          . The toolbar still wins if the reader picks a value themselves.
        </p>
      ),
    }),
    showSource({
      source: dedent`
        // CSF Next
        export const Story = meta.story({
          parameters: defineCssUserPrefsParam({ 'prefers-color-scheme': 'dark' })
        })

        // CSF 3
        export const Story = {
          parameters: defineCssUserPrefsParam({ 'prefers-color-scheme': 'dark' })
        }
      `,
    }),
  ],
});

PerStory.test("applies the story parameter", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
});

PerStory.test("rewrites the condition too", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("all"));
});

/**
 * A `<link>` is in the document before its sheet is, so the rewrite its own
 * insertion triggers cannot reach it, and loading is not a DOM mutation, so
 * nothing re-fires the observer when the sheet finally arrives.
 */
const LINKED_CSS = `
  .css-user-prefs-linked { color: ${RED}; }
  @media (prefers-color-scheme: dark) {
    .css-user-prefs-linked { color: ${GREEN}; }
  }
`;

function LinkedSubject() {
  return (
    <div data-testid="linked-host">
      <p className="css-user-prefs-linked" data-testid="linked-subject">
        Emulated preference
      </p>
    </div>
  );
}

export const FromALinkedStylesheet = meta.story({
  name: "CSS arriving via link",
  tags: ["spec", "integration"],
  render: () => <LinkedSubject />,
  globals: { "prefers-color-scheme": "dark" },
  decorators: [
    withStoryCard({
      title: "A stylesheet that loads over the network",
      content: (
        <p>
          The sheet of a <code>&lt;link&gt;</code> does not exist yet when the
          element mounts. The addon rewrites it once it has loaded, so a linked
          stylesheet is emulated like an inline one.
        </p>
      ),
    }),
  ],
});

/**
 * Mounts the stylesheet the way a lazily loaded one arrives: after the story has
 * rendered, with nothing rendering again afterwards to paper over the gap.
 */
async function linkStylesheet(canvasElement: HTMLElement) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  // A fresh URL every time, so the sheet is fetched rather than served from
  // cache, and the element is in the document before its sheet is.
  link.href = URL.createObjectURL(new Blob([LINKED_CSS], { type: "text/css" }));

  canvasElement.querySelector('[data-testid="linked-host"]')!.append(link);
  expect(link.sheet).toBe(null);

  await waitFor(() => expect(link.sheet).not.toBe(null));

  return link;
}

/** The media conditions of a linked stylesheet, in source order. */
const conditionsIn = (sheet: CSSStyleSheet) =>
  [...(sheet.cssRules as unknown as CSSRule[])]
    .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
    .map((rule) => rule.media.mediaText);

FromALinkedStylesheet.test("rewrites the condition once the sheet has loaded", async ({ canvasElement }) => {
  const link = await linkStylesheet(canvasElement);
  await waitFor(() => expect(conditionsIn(link.sheet!)[0]).toBe("all"));
});

FromALinkedStylesheet.test("applies the dark rule from the linked sheet", async ({ canvas, canvasElement }) => {
  await linkStylesheet(canvasElement);
  const subject = canvas.getByTestId("linked-subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
});
