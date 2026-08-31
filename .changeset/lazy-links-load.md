---
"@storybook-community/addon-css-user-preferences": patch
---

Emulate preferences in stylesheets that arrive via `<link>`.

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
