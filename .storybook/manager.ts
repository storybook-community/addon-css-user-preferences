import { brandTitle } from '@repobuddy/storybook/manager'
import { tagBadges } from '@repobuddy/storybook/storybook-addon-tag-badges'
import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

/*
 The scope sits above the name rather than inline: the full package name is
 too long for the sidebar and wrapped across three ragged lines.

 Storybook renders `brandTitle` with `dangerouslySetInnerHTML` whenever
 `brandImage` is unset, so markup here is its own code path, not a workaround.
 `brandImage` is the documented option but replaces the text entirely, which
 would drop the package name.
*/
const brand = brandTitle({
  title: `<span style="display:flex;flex-direction:column;line-height:1.2">
    <span style="font-size:10px;font-weight:400;opacity:0.7">@storybook-community</span>
    <span style="font-size:12px">addon-css-user-preferences</span>
  </span>`,
  logo: '<img src="https://avatars.githubusercontent.com/u/216219414?s=200&v=4" alt="" width="24" height="24" style="border-radius:3px">',
})

addons.setConfig({
  // Brand lives on the theme, not at the root of `setConfig`.
  // `storybook-dark-mode` owns the rest of the theme and merges these brand keys
  // back in on mount and on every mode change, so `base` here is only the first paint.
  theme: create({
    base: 'light',
    brandTitle: brand,
    brandUrl: 'https://github.com/storybook-community/addon-css-user-preferences',
    brandTarget: '_blank',
  }),
  // Renders the story tags as badges in the sidebar.
  tagBadges,
})
