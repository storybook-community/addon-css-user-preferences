export const title = 'Emulate CSS User Preferences'

export const features = {
  "prefers-color-scheme": ["light", "dark"],
  "prefers-contrast": ["no-preference", "less", "more", "custom"],
  "prefers-reduced-data": ["no-preference", "reduce"],
  "prefers-reduced-motion": ["no-preference", "reduce"],
  "prefers-reduced-transparency": ["no-preference", "reduce"],
  hover: ["hover", "none"],
  "any-hover": ["hover", "none"],
  pointer: ["fine", "coarse", "none"],
  "any-pointer": ["fine", "coarse", "none"],
} as const;

/**
 * Values that make a feature false in the boolean context, `(feature)`. Per
 * Media Queries 4 that is `none` and, for the `prefers-*` features,
 * `no-preference`.
 */
export const isFalseInBooleanContext = (value: string) =>
  value === "no-preference" || value === "none";

export const defaultOption = 'system default'

export const keys = Object.keys(features) as Array<keyof Features>

export const entries = Object.entries(features) as [keyof Features, Features[keyof Features]][]

export type Features = typeof features;
