import { StoryCard, withStoryCard } from "@repobuddy/storybook";
import { expect } from "storybook/test";
import React from "react";
import preview from "../.storybook/preview";
import * as options from "./options";

const cell: React.CSSProperties = {
  textAlign: "left",
  padding: "0.25rem 1rem 0.25rem 0",
  verticalAlign: "top",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.8125rem",
};

/** Every media feature the toolbar can emulate, read from `options`. */
function SupportedPreferences() {
  return (
    <StoryCard appearance="output" title="Supported preferences">
      <table style={{ borderCollapse: "collapse", marginTop: "0.5rem" }}>
        <thead>
          <tr>
            <th style={{ ...cell, fontWeight: 700 }}>media feature</th>
            <th style={{ ...cell, fontWeight: 700 }}>values</th>
          </tr>
        </thead>
        <tbody>
          {options.keys.map((key) => (
            <tr key={key} data-testid="feature-row">
              <td style={cell} data-testid="feature">
                {key}
              </td>
              <td style={cell} data-testid="values">
                {options.features[key].join(" · ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginBottom: 0 }}>
        Each toolbar row also offers <code>{options.defaultOption}</code>, which
        clears the preference and hands control back to the browser.
      </p>
    </StoryCard>
  );
}

const meta = preview.meta({
  title: "Usage/Supported preferences",
  component: SupportedPreferences,
  tags: ["spec"],
});

export const Table = meta.story({
  decorators: [
    withStoryCard({
      title: "What you can emulate",
      content: (
        <p>
          The toolbar exposes one dropdown per feature below. Values come
          straight from the addon's own <code>options</code>, so this table
          cannot drift from what the toolbar offers.
        </p>
      ),
    }),
  ],
});

Table.test("lists every supported feature", async ({ canvasElement }) => {
  const listed = [...canvasElement.querySelectorAll('[data-testid="feature"]')].map(
    (el) => el.textContent
  );
  await expect(listed).toEqual([...options.keys]);
});

Table.test("lists every value each feature accepts", async ({ canvasElement }) => {
  const rows = [...canvasElement.querySelectorAll('[data-testid="values"]')].map(
    (el) => el.textContent
  );
  const expected = options.keys.map((key) => options.features[key].join(" · "));
  await expect(rows).toEqual(expected);
});
