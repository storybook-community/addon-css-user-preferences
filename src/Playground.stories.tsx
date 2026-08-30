import { showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect, waitFor } from "storybook/test";
import React from "react";
import preview from "../.storybook/preview";

/**
 * A component wired to four CSS user preferences at once. Nothing here reacts
 * to the addon directly: these are ordinary `@media` rules, and the addon
 * rewrites their conditions in place.
 */
const CSS = `
  .cup-card {
    --surface: #ffffff;
    --ink: #1a1a1a;
    --edge: #d0d0d0;

    font-family: ui-sans-serif, system-ui, sans-serif;
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--edge);
    border-radius: 12px;
    padding: 20px;
    max-width: 420px;
  }

  .cup-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
  .cup-label { font-size: 12px; opacity: 0.7; min-width: 130px; }
  .cup-value { font-weight: 700; font-size: 13px; }

  /* prefers-color-scheme */
  @media (prefers-color-scheme: dark) {
    .cup-card { --surface: #16181d; --ink: #f2f2f2; --edge: #3a3f4a; }
  }

  /* prefers-reduced-motion */
  .cup-spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 3px solid #8888; border-top-color: #3b82f6;
    animation: cup-spin 1s linear infinite;
  }
  @keyframes cup-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .cup-spinner { animation: none; border-top-color: #8888; }
  }

  /* prefers-reduced-transparency */
  .cup-glass {
    width: 90px; height: 22px; border-radius: 6px;
    background: rgba(59, 130, 246, 0.35);
  }
  @media (prefers-reduced-transparency: reduce) {
    .cup-glass { background: rgb(59, 130, 246); }
  }

  /* prefers-reduced-data */
  .cup-media {
    width: 90px; height: 22px; border-radius: 6px;
    background: linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6);
  }
  @media (prefers-reduced-data: reduce) {
    .cup-media { background: #9ca3af; }
  }
`;

function Card() {
  return (
    <>
      <style>{CSS}</style>
      <div className="cup-card" data-testid="card">
        <strong>Account settings</strong>
        <div className="cup-row">
          <span className="cup-label">colour scheme</span>
          <span className="cup-value" data-testid="scheme">
            follows the surface
          </span>
        </div>
        <div className="cup-row">
          <span className="cup-label">motion</span>
          <div className="cup-spinner" data-testid="spinner" />
        </div>
        <div className="cup-row">
          <span className="cup-label">transparency</span>
          <div className="cup-glass" data-testid="glass" />
        </div>
        <div className="cup-row">
          <span className="cup-label">data saving</span>
          <div className="cup-media" data-testid="media" />
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
          conditions in the live stylesheet.
        </p>
      ),
    }),
    showSource({
      language: "css",
      source: dedent`
        @media (prefers-color-scheme: dark) {
          .cup-card { --surface: #16181d; --ink: #f2f2f2; }
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
*/
Playground.test(
  "dark scheme swaps the surface",
  { globals: { "prefers-color-scheme": "dark" } },
  async ({ canvas }) => {
    const card = canvas.getByTestId("card");
    await waitFor(() => expect(bg(card)).toBe("rgb(22, 24, 29)"));
  }
);

Playground.test(
  "light scheme keeps the default surface",
  { globals: { "prefers-color-scheme": "light" } },
  async ({ canvas }) => {
    const card = canvas.getByTestId("card");
    await waitFor(() => expect(bg(card)).toBe("rgb(255, 255, 255)"));
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

Playground.test("leaves everything alone by default", async ({ canvas }) => {
  const card = canvas.getByTestId("card");
  const spinner = canvas.getByTestId("spinner");
  await waitFor(() => expect(bg(card)).toBe("rgb(255, 255, 255)"));
  expect(getComputedStyle(spinner).animationName).toBe("cup-spin");
});

Playground.test(
  "reduced data drops the decorative gradient",
  { globals: { "prefers-reduced-data": "reduce" } },
  async ({ canvas }) => {
    const media = canvas.getByTestId("media");
    await waitFor(() => expect(bg(media)).toBe("rgb(156, 163, 175)"));
  }
);

