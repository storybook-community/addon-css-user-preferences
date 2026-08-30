import { tagBadges } from '@repobuddy/storybook/storybook-addon-tag-badges'
import { addons } from 'storybook/manager-api'

// Renders the story tags as badges in the sidebar.
addons.setConfig({ tagBadges })
