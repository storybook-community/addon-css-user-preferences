import { definePreviewAddon } from "storybook/internal/csf";
import addonAnnotations from "./preview";

export { defineCssUserPrefsParam } from "./parameters/define_css_user_prefs_param";
export type { CssUserPrefsParam } from "./parameters/define_css_user_prefs_param";
export type { Globals } from "./useGlobals";
export * as options from "./options";

// CSF Next preview addon
export default () => definePreviewAddon(addonAnnotations);
