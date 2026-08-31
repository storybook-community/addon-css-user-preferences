import type { Globals } from "./useGlobals";

import * as options from "./options";

/** Recursively process CSS and transform media queries based on feature flags. */
export function processCSS(
  containers: ArrayLike<CSSContainer>,
  features: Globals
) {
  for (const target of containers as CSSContainer[]) {
    if (target instanceof CSSMediaRule) {
      /** Initial value, regardless of present transformations. */
      let initialMediaText = getMediaText(target);

      /** Current value, to be transformed */
      let currentMediaText = initialMediaText;

      let feature: keyof Globals;
      for (feature in features) {
        const value = features[feature];

        // only transform conditions when a feature is defined and detected
        if (value !== undefined && currentMediaText.includes(feature)) {
          // replace boolean uses of the feature
          for (const alternate of options.features[feature]) {
            if (value === alternate) {
              currentMediaText = currentMediaText.replace(
                `(${feature}: ${alternate})`,
                "all"
              );
            } else {
              currentMediaText = currentMediaText.replace(
                `(${feature}: ${alternate})`,
                "not all"
              );
            }
          }

          // replace boolean uses of the feature
          currentMediaText = currentMediaText.replace(
            `(${feature})`,
            value === "no-preference" ? "not all" : "all"
          );
        }
      }

      // update the media text if the value has changed
      if (currentMediaText !== target.media.mediaText) {
        target.media.mediaText = currentMediaText;
      }
    } else {
      /*
       `"cssRules" in target` would not guard this: the property is an accessor
       on `CSSStyleSheet.prototype`, so `in` is true for every sheet and the
       getter still runs when the value is read. Per CSSOM it throws
       `SecurityError` for a sheet that is not origin-clean — an ordinary
       cross-origin `<link>` without `crossorigin`, even when the server sends
       `access-control-allow-origin: *`, since origin-cleanliness follows the
       request mode. Reading it is the only way to find out.
      */
      let rules: CSSRuleList | undefined;
      try {
        rules = (target as CSSGroupingRule).cssRules;
      } catch {
        // Its CSSOM is not ours to rewrite. Skip it and keep going, rather
        // than taking down the render this runs on.
        warnUnreadable(target);
        continue;
      }

      if (rules) processCSS(rules, features);
    }
  }
}

/** Returns the initial text of a Media Rule, regardless of transformations. */
const getMediaText = (target: CSSMediaRule) => {
  let conditionText = conditionTextMap.get(target);

  if (conditionText) return conditionText;

  conditionTextMap.set(target, (conditionText = target.media.mediaText));

  return conditionText;
};

/** WeakMap used to store initial text of Media Rules. */
const conditionTextMap = new WeakMap<CSSRule, string>();

/**
 * Tells the reader once why a stylesheet's `prefers-*` conditions ignore the
 * toolbar, since a silently skipped sheet points nowhere near its own cause.
 */
function warnUnreadable(target: CSSContainer) {
  if (warned.has(target)) return;

  warned.add(target);

  const href = (target as CSSStyleSheet).href;

  console.warn(
    `[addon-css-user-preferences] Cannot read the rules of ${href ?? "a stylesheet"}, ` +
      "so its user-preference conditions are left alone. The sheet is not " +
      'origin-clean; add crossorigin="anonymous" to its <link> to opt it in.'
  );
}

/** Sheets already reported as unreadable, so the warning is not repeated. */
const warned = new WeakSet<CSSContainer>();

export type CSSContainer = CSSStyleSheet | CSSMediaRule | CSSRule;
