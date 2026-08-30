---
"@storybook-community/addon-css-user-preferences": major
---

Support Storybook 10, and ship the addon as ESM only.

The package is now published as `@storybook-community/addon-css-user-preferences`
under the storybook-community org. It requires Storybook 10, builds with tsdown,
and drops the CommonJS build: `dist/cjs`, `dist/esm` and `dist/ts` are gone, and
`./preview` and `./manager` are reached through the exports map instead.

The `prefers-contrast` global and `cssUserPrefs` parameter key was misspelled
`prefers-constrast`. Any story that set the misspelled key must be updated,
though it never had an effect.

The addon-kit `Header` and `Page` example components have been removed, along
with the panel and tab they were demonstrated in. Only the toolbar addon remains.

Adds a CSF Next entry point with typed story parameters, and renders the toolbar
icon at a visible size.
