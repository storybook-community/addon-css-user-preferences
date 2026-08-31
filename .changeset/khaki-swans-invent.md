---
"@storybook-community/addon-css-user-preferences": minor
---

Emulate preferences for `window.matchMedia`, not just for CSS.

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
