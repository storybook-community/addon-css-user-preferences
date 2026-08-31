# @storybook-community/addon-css-user-preferences

## 1.0.0

### Major Changes

- [#1](https://github.com/storybook-community/addon-css-user-preferences/pull/1) [`498ae6b`](https://github.com/storybook-community/addon-css-user-preferences/commit/498ae6b8b1d4302583d8f2cef21c42adbfff421d) Thanks [@unional](https://github.com/unional)! - Support Storybook 10, and ship the addon as ESM only.

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

### Minor Changes

- [#5](https://github.com/storybook-community/addon-css-user-preferences/pull/5) [`27bcc1b`](https://github.com/storybook-community/addon-css-user-preferences/commit/27bcc1b1dd6be1aeb2fca94a7400b3d8384db4ae) Thanks [@unional](https://github.com/unional)! - Emulate preferences for `window.matchMedia`, not just for CSS.

  The addon rewrote `@media` conditions in the CSSOM and nothing else, so a
  component that read a preference in JavaScript — a `useMediaQuery` hook, a theme
  library resolving its initial theme, a reduced-motion check gating an animation
  — kept seeing the real operating system value while the CSS around it was
  emulated, and the story rendered half emulated.

  While a preference is being emulated, `window.matchMedia` now answers for it. A
  query naming an emulated feature is rewritten to carry the emulated outcome and
  handed to the real implementation, so an unset preference, a viewport condition,
  and the rest of a compound query are still the browser's own answer, and a query
  shape the rewrite cannot express falls back to the real value rather than
  guessing.

  The returned `MediaQueryList` dispatches a `change` event when the toolbar
  changes a preference, through `addEventListener('change')`, `onchange`, and the
  deprecated `addListener`, so a subscriber follows the toolbar instead of reading
  a correct first value and then going stale.

  Returning every preference to its system default puts the browser's own
  `window.matchMedia` back, so a Storybook that is not emulating anything is left
  untouched.

- [#4](https://github.com/storybook-community/addon-css-user-preferences/pull/4) [`58197bd`](https://github.com/storybook-community/addon-css-user-preferences/commit/58197bdd68281957e73895f07a1165f9a0805fc7) Thanks [@unional](https://github.com/unional)! - Apply preferences to stylesheets a story mounts as it renders.

  The rewrite ran from a Storybook `useEffect`, which fires after the play
  function, so a story shipping its own `<style>` could render with un-emulated
  CSS and its interaction tests could assert before the rewrite landed. The
  decorator now processes during render and observes the document for sheets
  that arrive later.

  The toolbar dropdowns follow the manager theme instead of the operating
  system's, which previously left dark controls inside a light manager.

  A preference the story pins in its own `globals` is now shown read-only.
  Storybook lets story globals win, so changing it from the toolbar was
  silently discarded.

### Patch Changes

- [#10](https://github.com/storybook-community/addon-css-user-preferences/pull/10) [`be11101`](https://github.com/storybook-community/addon-css-user-preferences/commit/be111016ee7e9cad254f47fe361ce7ead607f9a5) Thanks [@unional](https://github.com/unional)! - Emulate preferences in stylesheets that arrive via `<link>`.

  A `<link rel="stylesheet">` is in the document before its sheet is: `link.sheet`
  stays `null` until the request resolves, and `document.styleSheets` does not list
  the sheet before then. The rewrite triggered by the element's insertion therefore
  ran against a collection that did not yet contain the sheet that triggered it,
  and because loading is not a DOM mutation, nothing re-fired the observer when the
  sheet did arrive — so that stylesheet was never rewritten.

  A later re-render or any toolbar change picked the sheet up, which hid the
  problem while clicking through the UI. What it did not hide is the case the
  observer exists for: a play function runs before Storybook's effects, so an
  interaction test asserting on a rewritten condition raced the network and passed
  or failed on timing.

  The addon now waits for a pending `<link>` to load and rewrites once its sheet is
  there, so a linked stylesheet is emulated like an inline one.

- [#9](https://github.com/storybook-community/addon-css-user-preferences/pull/9) [`5b19bf6`](https://github.com/storybook-community/addon-css-user-preferences/commit/5b19bf6d4d1907aafc1cd6a5e80ea9225dc0d9e5) Thanks [@unional](https://github.com/unional)! - Skip stylesheets the browser will not let the addon read, instead of failing the render.

  `processCSS` read `.cssRules` on every sheet in `document.styleSheets`. For a sheet that is not origin-clean the CSSOM getter throws `SecurityError`, and the `"cssRules" in target` guard did not help — `cssRules` is an accessor on `CSSStyleSheet.prototype`, so `in` is true for every sheet and the throw came one line later. Since `processAll()` runs on the render path, one cross-origin `<link>` — an ordinary Google Fonts or CDN stylesheet without `crossorigin` — took every story down.

  The read is now guarded: an unreadable sheet is skipped and reported once with a `console.warn` naming its `href`, and the remaining sheets are still rewritten.

## v0.0.3 (Fri Mar 11 2022)

### ⚠️ Pushed to `main`

- update github url ([@jonathantneal](https://github.com/jonathantneal))

### Authors: 1

- Jonathan Neal ([@jonathantneal](https://github.com/jonathantneal))

## v0.0.2 (Fri Mar 11 2022)

### ⚠️ Pushed to `main`

- update github ref ([@jonathantneal](https://github.com/jonathantneal))

### Authors: 1

- Jonathan Neal ([@jonathantneal](https://github.com/jonathantneal))

## v0.0.1 (Fri Mar 11 2022)

### ⚠️ Pushed to `main`

- remove esm compatibility for webpack compatibility :( ([@jonathantneal](https://github.com/jonathantneal))
- Remove postinstall to share on StackBlitz ([@jonathantneal](https://github.com/jonathantneal))
- Emulate CSS Preferences - second pass ([@jonathantneal](https://github.com/jonathantneal))
- Emulate CSS - first pass ([@jonathantneal](https://github.com/jonathantneal))
- update button to include 'pulsing' variant ([@jonathantneal](https://github.com/jonathantneal))
- project post-setup ([@jonathantneal](https://github.com/jonathantneal))
- project setup ([@jonathantneal](https://github.com/jonathantneal))
- Initial commit ([@jonathantneal](https://github.com/jonathantneal))

### Authors: 1

- Jonathan Neal ([@jonathantneal](https://github.com/jonathantneal))
