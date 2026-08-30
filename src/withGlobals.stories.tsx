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
  title: "Addon/withGlobals",
  component: Subject,
  tags: ["func"],
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

    export const Story = { ${setting} }
  `;

/** Globals are the primary mechanism: the toolbar writes them. */
export const GlobalPrefersDark = meta.story({
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

GlobalPrefersDark.test("rewrites the matching condition to all", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("all"));
});

GlobalPrefersDark.test("applies the dark rule", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
});

/** The opposite value disables the query, so the base rule wins. */
export const GlobalPrefersLight = meta.story({
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

GlobalPrefersLight.test("rewrites the condition to not all", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("not all"));
});

GlobalPrefersLight.test("falls back to the base rule", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(RED));
});

/** Two features at once must not interfere with each other. */
export const TwoFeaturesAtOnce = meta.story({
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
export const ParameterPrefersDark = meta.story({
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
        export const Story = {
          parameters: defineCssUserPrefsParam({ 'prefers-color-scheme': 'dark' })
        }
      `,
    }),
  ],
});

ParameterPrefersDark.test("applies the story parameter", async ({ canvas }) => {
  const subject = canvas.getByTestId("subject");
  await waitFor(() => expect(colorOf(subject)).toBe(GREEN));
});

ParameterPrefersDark.test("rewrites the condition too", async ({ canvasElement }) => {
  await waitFor(() => expect(conditionsOf(canvasElement)[0]).toBe("all"));
});
