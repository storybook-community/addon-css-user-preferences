import { showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect } from "storybook/test";
import { ThemeProvider, ensure, themes } from "storybook/theming";
import React from "react";
import preview from "../../.storybook/preview";
import { TooltipList } from "./TooltipList";
import * as options from "../options";

const meta = preview.meta({
  title: "Internals/Toolbar list",
  component: TooltipList,
  tags: ["internal"],
  // These are manager components: they read Storybook's theme, which the
  // preview iframe does not provide on its own.
  decorators: [
    (Story: React.ComponentType) => (
      <ThemeProvider theme={ensure(themes.light)}>
        <Story />
      </ThemeProvider>
    ),
  ],
});

const featureItems = options.keys.map((id) => ({
  id,
  title: id,
  right: (
    <select defaultValue="" aria-label={id}>
      <option value="">{options.defaultOption}</option>
      {options.features[id].map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  ),
}));

/** The list exactly as the toolbar renders it: one row per supported feature. */
export const AllFeatures = meta.story({
  tags: ["spec", "unit"],
  args: { items: featureItems },
  decorators: [
    withStoryCard({
      title: "The toolbar dropdown",
      content: (
        <p>
          One row per CSS user preference the addon can emulate. Each row offers{" "}
          <code>{options.defaultOption}</code> to hand control back to the
          browser, plus every value that feature accepts.
        </p>
      ),
    }),
    showSource({
      source: dedent`
        <TooltipList items={options.keys.map((id) => ({
          id,
          title: id,
          right: <select>…</select>,
        }))} />
      `,
    }),
  ],
});

AllFeatures.test("lists every supported feature", async ({ canvas }) => {
  for (const id of options.keys) {
    await expect(canvas.getByText(id)).toBeInTheDocument();
  }
});

AllFeatures.test("offers exactly the values each feature accepts", async ({ canvas }) => {
  for (const id of options.keys) {
    const select = canvas.getByLabelText(id) as HTMLSelectElement;
    const values = [...select.options].map((o) => o.textContent);

    // The first entry clears the preference; the rest are the feature's values.
    await expect(values).toEqual([options.defaultOption, ...options.features[id]]);
  }
});

AllFeatures.test("defaults every feature to the browser's own setting", async ({ canvas }) => {
  for (const id of options.keys) {
    const select = canvas.getByLabelText(id) as HTMLSelectElement;
    await expect(select.value).toBe("");
  }
});

/** Nothing to emulate renders an empty list rather than a broken one. */
export const Empty = meta.story({
  tags: ["unit"],
  args: { items: [] },
  decorators: [
    withStoryCard({
      title: "No items",
      content: <p>The list renders empty rather than throwing on an empty array.</p>,
    }),
  ],
});

Empty.test("renders no rows", async ({ canvasElement }) => {
  await expect(canvasElement.querySelectorAll("select")).toHaveLength(0);
  // The list container itself still renders, so the tooltip keeps its shape.
  await expect(canvasElement.firstElementChild).toBeInTheDocument();
});
