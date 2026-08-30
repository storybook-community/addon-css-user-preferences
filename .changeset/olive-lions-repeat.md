---
"@storybook-community/addon-css-user-preferences": minor
---

Apply preferences to stylesheets a story mounts as it renders.

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
