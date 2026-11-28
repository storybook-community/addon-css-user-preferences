---
"@storybook-community/addon-css-user-preferences": major
---

Support Storybook 11. The addon now declares a peer dependency on `storybook@^11.0.0` and no longer installs alongside Storybook 10; keep using version 1.x with Storybook 10.

The toolbar button now opens its menu with Storybook 11's `PopoverProvider`, which replaces the removed `WithTooltip` and `IconButton` components.
