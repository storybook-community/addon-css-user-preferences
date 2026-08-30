import addonDocs from "@storybook/addon-docs";
import { definePreview } from "@storybook/react-vite";
import addonDarkMode, {
  defineDarkModeParam,
} from "@storybook-community/storybook-dark-mode";
import tagBadgesAddon from "storybook-addon-tag-badges/preview";
import { themes } from "storybook/theming";
import cssUserPrefs from "../src";

// Tailwind, with a class-based dark variant. See tailwind.css for why.
import "./tailwind.css";
import "./tailwind.repobuddy-storybook.css";

export default definePreview({
  parameters: {
    docs: { codePanel: true },
    options: {
      // Reader order: what it is, how to use it, how it works, then internals.
      storySort: {
        order: [
          'Overview',
          'Installation',
          'Usage',
          ['Emulating preferences', 'Supported preferences'],
          'How it works',
          'Examples',
          'Internals',
        ],
      },
    },
    ...defineDarkModeParam({
      current: "light",
      darkClass: ["dark", "dark:bg-black", "dark:text-white"],
      dark: { ...themes.dark, appBg: "black" },
      stylePreview: true,
    }),
  },
  // The addon itself is registered here, so this Storybook dogfoods its own
  // CSF Next entry point.
  addons: [addonDocs(), tagBadgesAddon, addonDarkMode(), cssUserPrefs()],
});
