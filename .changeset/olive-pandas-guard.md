---
"@storybook-community/addon-css-user-preferences": patch
---

Skip stylesheets the browser will not let the addon read, instead of failing the render.

`processCSS` read `.cssRules` on every sheet in `document.styleSheets`. For a sheet that is not origin-clean the CSSOM getter throws `SecurityError`, and the `"cssRules" in target` guard did not help — `cssRules` is an accessor on `CSSStyleSheet.prototype`, so `in` is true for every sheet and the throw came one line later. Since `processAll()` runs on the render path, one cross-origin `<link>` — an ordinary Google Fonts or CDN stylesheet without `crossorigin` — took every story down.

The read is now guarded: an unreadable sheet is skipped and reported once with a `console.warn` naming its `href`, and the remaining sheets are still rewritten.
