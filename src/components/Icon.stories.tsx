import { showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect } from "storybook/test";
import React from "react";
import preview from "../../.storybook/preview";
import { Icon } from "./Icon";

const meta = preview.meta({
  title: "Internals/Icon",
  component: Icon,
  tags: ["internal"],
});

/** Toolbar size. This is what the addon actually puts in the Storybook toolbar. */
export const Default = meta.story({
  tags: ["example", "unit"],
  decorators: [
    withStoryCard({
      title: "Toolbar size",
      content: (
        <p>
          The icon ships its own <code>width</code> and <code>height</code>.
          Storybook's toolbar button does not size raw SVG children, so without
          them the toolbar renders an empty box.
        </p>
      ),
    }),
    showSource({ source: dedent`<Icon />` }),
  ],
});

Default.test("renders at a non-zero size", async ({ canvasElement }) => {
  const svg = canvasElement.querySelector("svg");
  await expect(svg).toBeInTheDocument();

  const { width, height } = svg!.getBoundingClientRect();
  await expect(width).toBeGreaterThan(0);
  await expect(height).toBeGreaterThan(0);
});

const PURPLE = "rgb(102, 51, 153)";

/**
 * `Icon` is an emotion `styled()` component, so it only themes if it forwards
 * the generated `className` onto the `<svg>`. The paths use
 * `fill="currentColor"`, so `color` reaches the artwork.
 */
export const Styled = meta.story({
  tags: ["use-case", "unit", "bug"],
  render: () => (
    <>
      <style>{`
        .demo-icon {
          color: rebeccapurple;
          width: 64px;
          height: 64px;
        }
      `}</style>
      <Icon className="demo-icon" />
    </>
  ),
  decorators: [
    withStoryCard({
      title: "Styling reaches the artwork",
      content: (
        <p>
          Sized to 64px and coloured via a class. If the styled wrapper stopped
          forwarding props, this would silently fall back to the toolbar size in
          the default colour, which is how the empty-toolbar-box bug looked.
        </p>
      ),
    }),
    showSource({
      source: dedent`
        .demo-icon { color: rebeccapurple; width: 64px; height: 64px; }

        <Icon className="demo-icon" />
      `,
      language: "html",
    }),
  ],
});

Styled.test("takes colour from the class", async ({ canvasElement }) => {
  const svg = canvasElement.querySelector(".demo-icon")!;
  await expect(getComputedStyle(svg).color).toBe(PURPLE);
});

Styled.test("takes size from the class", async ({ canvasElement }) => {
  const svg = canvasElement.querySelector(".demo-icon")!;
  const { width, height } = svg.getBoundingClientRect();
  await expect(width).toBe(64);
  await expect(height).toBe(64);
});

Styled.test("paints the artwork with the inherited colour", async ({ canvasElement }) => {
  // fill="currentColor" is what makes the icon themeable at all.
  const path = canvasElement.querySelector(".demo-icon path")!;
  await expect(getComputedStyle(path).fill).toBe(PURPLE);
});
