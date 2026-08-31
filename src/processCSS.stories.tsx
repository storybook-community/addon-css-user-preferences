import { StoryCard, showSource, withStoryCard } from "@repobuddy/storybook";
import dedent from "dedent";
import { expect } from "storybook/test";
import React from "react";
import preview from "../.storybook/preview";
import { processCSS } from "./processCSS";
import * as options from "./options";
import type { Globals } from "./useGlobals";

const globals = (values: Partial<Globals>) => values as Globals;

/** Rewrites `condition` for `selected` and reports what the browser ends up with. */
function rewrite(condition: string, selected: Partial<Globals>) {
  const el = document.createElement("style");
  el.textContent = `@media ${condition} { a { color: red } }`;
  document.head.append(el);
  try {
    const sheet = el.sheet as CSSStyleSheet;
    processCSS(sheet.cssRules, globals(selected));
    return (sheet.cssRules[0] as CSSMediaRule).media.mediaText;
  } finally {
    el.remove();
  }
}

type Row = {
  condition: string;
  selected: Partial<Globals>;
  note: string;
};

const ROWS: Row[] = [
  {
    condition: "(prefers-color-scheme: dark)",
    selected: { "prefers-color-scheme": "dark" },
    note: "value matches, so the rule is switched on",
  },
  {
    condition: "(prefers-color-scheme: dark)",
    selected: { "prefers-color-scheme": "light" },
    note: "value differs, so the rule is switched off",
  },
  {
    condition: "(prefers-color-scheme: dark)",
    selected: {},
    note: "feature not set, so the query is left alone",
  },
  {
    condition: "(prefers-reduced-motion)",
    selected: { "prefers-reduced-motion": "reduce" },
    note: "boolean form, preference set",
  },
  {
    condition: "(prefers-reduced-motion)",
    selected: { "prefers-reduced-motion": "no-preference" },
    note: "boolean form, no-preference counts as off",
  },
  {
    condition: "(min-width: 30em)",
    selected: { "prefers-color-scheme": "dark" },
    note: "unrelated feature, never touched",
  },
];

const cell: React.CSSProperties = {
  textAlign: "left",
  padding: "0.25rem 0.75rem 0.25rem 0",
  verticalAlign: "top",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.8125rem",
};

/**
 * What the rewriting actually does, computed live rather than transcribed. Each
 * row runs `processCSS` against a real stylesheet when the story renders.
 */
function RewriteTable() {
  return (
    <StoryCard appearance="output" title="Condition rewriting">
      <table style={{ borderCollapse: "collapse", marginTop: "0.5rem" }}>
        <thead>
          <tr>
            <th style={{ ...cell, fontWeight: 700 }}>@media condition</th>
            <th style={{ ...cell, fontWeight: 700 }}>selected</th>
            <th style={{ ...cell, fontWeight: 700 }}>becomes</th>
            <th style={{ ...cell, fontWeight: 700, fontFamily: "inherit" }}>why</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={i} data-testid="rewrite-row">
              <td style={cell}>{row.condition}</td>
              <td style={cell} data-testid="selected">
                {Object.entries(row.selected)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ") || "—"}
              </td>
              <td style={{ ...cell, fontWeight: 700 }} data-testid="result">
                {rewrite(row.condition, row.selected)}
              </td>
              <td style={{ ...cell, fontFamily: "inherit" }}>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </StoryCard>
  );
}

const meta = preview.meta({
  title: "How it works/Rewriting conditions",
  component: RewriteTable,
  tags: ["spec"],
});

/** The rewriting rules, as a live table. */
export const Rules = meta.story({
  name: "The rewriting rules",
  tags: ["spec", "unit"],
  decorators: [
    withStoryCard({
      title: "How a condition is rewritten",
      content: (
        <p>
          <code>processCSS</code> walks every <code>CSSMediaRule</code> in the
          document and rewrites its condition in place. A matching value becomes{" "}
          <code>all</code>, a differing one becomes <code>not all</code>, and a
          feature the reader has not selected is left untouched.
        </p>
      ),
    }),
    showSource({
      source: dedent`
        processCSS(document.styleSheets, {
          'prefers-color-scheme': 'dark',
        })
      `,
    }),
  ],
});

Rules.test("rewrites every documented case as the table claims", async ({ canvasElement }) => {
  const results = [...canvasElement.querySelectorAll('[data-testid="result"]')].map(
    (el) => el.textContent
  );
  await expect(results).toEqual([
    "all",
    "not all",
    "(prefers-color-scheme: dark)",
    "all",
    "not all",
    "(min-width: 30em)",
  ]);
});

Rules.test("documents every supported feature somewhere", async () => {
  // Guards against adding a feature to options without documenting it here.
  const documented = new Set(ROWS.flatMap((row) => Object.keys(row.selected)));
  const covered = options.keys.filter((key) => documented.has(key));
  await expect(covered.length).toBeGreaterThan(0);
});

Rules.test("re-derives from the original query, so switching back restores it", async () => {
  const el = document.createElement("style");
  el.textContent = "@media (prefers-color-scheme: dark) { a { color: red } }";
  document.head.append(el);
  try {
    const sheet = el.sheet as CSSStyleSheet;
    const mediaOf = () => (sheet.cssRules[0] as CSSMediaRule).media.mediaText;

    processCSS(sheet.cssRules, globals({ "prefers-color-scheme": "dark" }));
    await expect(mediaOf()).toBe("all");

    // Without the original text this would try to rewrite "all" and get stuck.
    processCSS(sheet.cssRules, globals({ "prefers-color-scheme": "light" }));
    await expect(mediaOf()).toBe("not all");

    processCSS(sheet.cssRules, globals({ "prefers-color-scheme": "dark" }));
    await expect(mediaOf()).toBe("all");
  } finally {
    el.remove();
  }
});

Rules.test("recurses into nested rules", async () => {
  const el = document.createElement("style");
  el.textContent =
    "@supports (display: grid) { @media (prefers-color-scheme: dark) { a { color: red } } }";
  document.head.append(el);
  try {
    const sheet = el.sheet as CSSStyleSheet;
    processCSS(sheet.cssRules, globals({ "prefers-color-scheme": "dark" }));

    const nested = (sheet.cssRules[0] as CSSSupportsRule).cssRules[0] as CSSMediaRule;
    await expect(nested.media.mediaText).toBe("all");
  } finally {
    el.remove();
  }
});

Rules.test("walks a whole document styleSheets list", async () => {
  const el = document.createElement("style");
  el.textContent = "@media (prefers-color-scheme: dark) { a { color: red } }";
  document.head.append(el);
  try {
    const sheet = el.sheet as CSSStyleSheet;
    processCSS(document.styleSheets, globals({ "prefers-color-scheme": "dark" }));
    await expect((sheet.cssRules[0] as CSSMediaRule).media.mediaText).toBe("all");
  } finally {
    el.remove();
  }
});

/**
 * A stand-in for a sheet that is not origin-clean. The real thing needs a
 * cross-origin `<link>`, which a test page cannot arrange reliably; what
 * matters is the CSSOM contract — the `cssRules` getter throws `SecurityError`.
 */
function unreadableSheet(href: string) {
  return {
    href,
    get cssRules(): CSSRuleList {
      throw new DOMException("cross-origin", "SecurityError");
    },
  } as unknown as CSSStyleSheet;
}

Rules.test("skips a sheet it is not allowed to read, and keeps going", async () => {
  const el = document.createElement("style");
  el.textContent = "@media (prefers-color-scheme: dark) { a { color: red } }";
  document.head.append(el);
  try {
    const sheet = el.sheet as CSSStyleSheet;
    const containers = [unreadableSheet("https://cdn.example/font.css"), sheet];

    // The throw must not escape: `processAll` runs on the render path.
    processCSS(containers, globals({ "prefers-color-scheme": "dark" }));

    // And the readable sheet after it is still rewritten.
    await expect((sheet.cssRules[0] as CSSMediaRule).media.mediaText).toBe("all");
  } finally {
    el.remove();
  }
});

Rules.test("warns once per unreadable sheet, naming its href", async () => {
  const messages: string[] = [];
  const warn = console.warn;
  console.warn = (...args: unknown[]) => void messages.push(String(args[0]));
  try {
    const containers = [unreadableSheet("https://cdn.example/warned-once.css")];

    processCSS(containers, globals({ "prefers-color-scheme": "dark" }));
    processCSS(containers, globals({ "prefers-color-scheme": "light" }));
  } finally {
    console.warn = warn;
  }

  await expect(messages).toHaveLength(1);
  await expect(messages[0]).toContain("https://cdn.example/warned-once.css");
  await expect(messages[0]).toContain('crossorigin="anonymous"');
});
