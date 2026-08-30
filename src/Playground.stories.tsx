import { showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect, waitFor } from "storybook/test";
import React from "react";
import preview from "../.storybook/preview";

/**
 * A component wired to every preference the toolbar can emulate, in the same
 * order the toolbar lists them. Nothing here reacts to the addon directly:
 * these are ordinary `@media` rules whose conditions the addon rewrites.
 */
const CSS = `
  .cup-card {
    /*
     With no preference selected the card inherits the page, so it sits
     correctly in either Storybook theme. The two branches below are what the
     addon switches between.
    */
    --surface: transparent;
    --ink: inherit;
    --edge: rgba(136, 136, 136, 0.4);

    font-family: ui-sans-serif, system-ui, sans-serif;
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--edge);
    border-radius: 12px;
    padding: 20px;
    max-width: 440px;
  }

  .cup-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
  .cup-label { font-size: 12px; opacity: 0.7; min-width: 150px; }
  .cup-value { font-weight: 700; font-size: 13px; }

  /* 1. prefers-color-scheme */
  @media (prefers-color-scheme: light) {
    .cup-card { --surface: #ffffff; --ink: #1a1a1a; --edge: #d0d0d0; }
  }
  @media (prefers-color-scheme: dark) {
    .cup-card { --surface: #16181d; --ink: #f2f2f2; --edge: #3a3f4a; }
  }

  /* 2. prefers-contrast */
  .cup-contrast {
    border: 1px solid #9ca3af;
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 12px;
    color: #6b7280;
  }
  @media (prefers-contrast: more) {
    .cup-contrast { border-color: #111827; color: #111827; font-weight: 700; }
  }
  @media (prefers-contrast: less) {
    .cup-contrast { border-color: transparent; color: #9ca3af; }
  }

  /* 3. prefers-reduced-data */
  .cup-media {
    width: 90px; height: 22px; border-radius: 6px;
    background: linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6);
  }
  @media (prefers-reduced-data: reduce) {
    .cup-media { background: #9ca3af; }
  }

  /* 4. prefers-reduced-motion */
  .cup-spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 3px solid rgba(136, 136, 136, 0.5); border-top-color: #3b82f6;
    animation: cup-spin 1s linear infinite;
  }
  @keyframes cup-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .cup-spinner { animation: none; border-top-color: rgba(136, 136, 136, 0.5); }
  }

  /* 5. prefers-reduced-transparency */
  .cup-glass {
    width: 90px; height: 22px; border-radius: 6px;
    background: rgba(59, 130, 246, 0.35);
  }
  @media (prefers-reduced-transparency: reduce) {
    .cup-glass { background: rgb(59, 130, 246); }
  }
`;

function Card() {
  return (
    <>
      <style data-testid="card-style">{CSS}</style>
      <div className="cup-card" data-testid="card">
        <strong>Account settings</strong>

        <div className="cup-row">
          <span className="cup-label">prefers-color-scheme</span>
          <span className="cup-value" data-testid="scheme">
            surface and text follow it
          </span>
        </div>

        <div className="cup-row">
          <span className="cup-label">prefers-contrast</span>
          <span className="cup-contrast" data-testid="contrast">
            Subtle label
          </span>
        </div>

        <div className="cup-row">
          <span className="cup-label">prefers-reduced-data</span>
          <div className="cup-media" data-testid="media" />
        </div>

        <div className="cup-row">
          <span className="cup-label">prefers-reduced-motion</span>
          <div className="cup-spinner" data-testid="spinner" />
        </div>

        <div className="cup-row">
          <span className="cup-label">prefers-reduced-transparency</span>
          <div className="cup-glass" data-testid="glass" />
        </div>
      </div>
    </>
  );
}

const meta = preview.meta({
  title: "Playground",
  component: Card,
  tags: ["playground"],
});

const bg = (el: Element) => getComputedStyle(el).backgroundColor;

export const Playground = meta.story({
  name: "Try it",
  decorators: [
    withStoryCard({
      title: "Change a preference in the toolbar",
      content: (
        <p>
          Open the <strong>Emulate CSS User Preferences</strong> toolbar button
          and pick a value. The card below has no idea the addon exists: it just
          has ordinary <code>@media</code> rules, and the addon rewrites their
          conditions in the live stylesheet. Rows are listed in the same order
          as the toolbar.
        </p>
      ),
    }),
    showSource({
      language: "css",
      source: dedent`
        @media (prefers-color-scheme: light) {
          .cup-card { --surface: #ffffff; --ink: #1a1a1a; }
        }
        @media (prefers-color-scheme: dark) {
          .cup-card { --surface: #16181d; --ink: #f2f2f2; }
        }
        @media (prefers-contrast: more) {
          .cup-contrast { border-color: #111827; color: #111827; }
        }
        @media (prefers-reduced-data: reduce) {
          .cup-media { background: #9ca3af; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cup-spinner { animation: none; }
        }
        @media (prefers-reduced-transparency: reduce) {
          .cup-glass { background: rgb(59, 130, 246); }
        }
      `,
    }),
  ],
});

/*
 The story stays explorable; each test pins one preference through the
 annotations argument rather than baking a state into the story itself.
 Ordered to match the toolbar.
*/
Playground.test(
  "a light scheme paints a light surface",
  { globals: { "prefers-color-scheme": "light" } },
  async ({ canvas }) => {
    const card = canvas.getByTestId("card");
    await waitFor(() => expect(bg(card)).toBe("rgb(255, 255, 255)"));
    expect(getComputedStyle(card).color).toBe("rgb(26, 26, 26)");
  }
);

Playground.test(
  "a dark scheme paints a dark surface",
  { globals: { "prefers-color-scheme": "dark" } },
  async ({ canvas }) => {
    const card = canvas.getByTestId("card");
    await waitFor(() => expect(bg(card)).toBe("rgb(22, 24, 29)"));
    expect(getComputedStyle(card).color).toBe("rgb(242, 242, 242)");
  }
);

Playground.test(
  "more contrast strengthens the label",
  { globals: { "prefers-contrast": "more" } },
  async ({ canvas }) => {
    const label = canvas.getByTestId("contrast");
    await waitFor(() =>
      expect(getComputedStyle(label).color).toBe("rgb(17, 24, 39)")
    );
    expect(getComputedStyle(label).fontWeight).toBe("700");
  }
);

Playground.test(
  "less contrast softens the label",
  { globals: { "prefers-contrast": "less" } },
  async ({ canvas }) => {
    const label = canvas.getByTestId("contrast");
    await waitFor(() =>
      expect(getComputedStyle(label).borderTopColor).toBe("rgba(0, 0, 0, 0)")
    );
  }
);

Playground.test(
  "reduced data drops the decorative gradient",
  { globals: { "prefers-reduced-data": "reduce" } },
  async ({ canvas }) => {
    const media = canvas.getByTestId("media");
    await waitFor(() => expect(bg(media)).toBe("rgb(156, 163, 175)"));
  }
);

Playground.test(
  "reduced motion stops the spinner",
  { globals: { "prefers-reduced-motion": "reduce" } },
  async ({ canvas }) => {
    const spinner = canvas.getByTestId("spinner");
    await waitFor(() =>
      expect(getComputedStyle(spinner).animationName).toBe("none")
    );
  }
);

Playground.test(
  "reduced transparency makes the panel opaque",
  { globals: { "prefers-reduced-transparency": "reduce" } },
  async ({ canvas }) => {
    const glass = canvas.getByTestId("glass");
    await waitFor(() => expect(bg(glass)).toBe("rgb(59, 130, 246)"));
  }
);

/**
 * With nothing selected the addon leaves every condition alone, so the browser's
 * own preferences still decide. Asserting on the conditions rather than on a
 * colour keeps this independent of the machine running the test.
 */
Playground.test("rewrites nothing until a preference is chosen", async ({ canvasElement }) => {
  const style = canvasElement.querySelector<HTMLStyleElement>(
    '[data-testid="card-style"]'
  )!;
  const conditions = [...(style.sheet!.cssRules as unknown as CSSRule[])]
    .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
    .map((rule) => rule.media.mediaText);

  await expect(conditions).toEqual([
    "(prefers-color-scheme: light)",
    "(prefers-color-scheme: dark)",
    "(prefers-contrast: more)",
    "(prefers-contrast: less)",
    "(prefers-reduced-data: reduce)",
    "(prefers-reduced-motion: reduce)",
    "(prefers-reduced-transparency: reduce)",
  ]);
});
