# Storybook Addon: CSS User Preferences

This toolbar addon allows you to emulate CSS user preferences in Storybook.

<p align="center"><img src="/src/screenshot.webp" width="50%" /></p>

## Compatibility

| Addon version | Storybook version |
| ------------- | ----------------- |
| 2.x           | 11.x              |
| 1.x           | 10.x              |

## Getting started

First, install the addon.

```sh
pnpm add -D @storybook-community/addon-css-user-preferences
```

Add this line to your `main.js` file (create this file inside your Storybook config directory if needed).

```js
module.exports = {
  addons: ['@storybook-community/addon-css-user-preferences'],
};
```

## Configuration

By default, all CSS user preferences are set to the system default.

You can configure your own set of user preferences with the `parameters.cssUserPrefs` parameter:

```js
// .storybook/preview.js

export const parameters = {
  cssUserPrefs: {
    "prefers-color-scheme": "light",
  },
};
```

## JavaScript reads the same preference

Rewriting the CSSOM only reaches CSS. A component that branches in JavaScript —
a `useMediaQuery` hook, a theme library resolving its initial theme, a
reduced-motion check gating an animation — reads `window.matchMedia`, so the
addon patches that too while a preference is being emulated:

```js
// with the toolbar set to dark
window.matchMedia('(prefers-color-scheme: dark)').matches // true
window.matchMedia('(prefers-color-scheme: light)').matches // false
```

The patched `MediaQueryList` dispatches a `change` event when the toolbar
changes a preference, so a subscriber follows the toolbar instead of reading a
correct first value and then going stale. `addEventListener('change')`,
`onchange`, and the deprecated `addListener` all work.

Only the emulated part of a query is substituted. A preference left at its
system default, and everything else in a compound condition, is still evaluated
by the browser. A query shape the addon cannot express is answered with the real
value rather than a guess.

Returning every preference to its system default puts the browser's own
`window.matchMedia` back, so a Storybook that is not emulating anything is left
untouched.

## Cross-origin stylesheets

The rewriting works through the CSSOM, and the browser only exposes a
stylesheet's rules to a page that is allowed to read them. A `<link>` to another
origin without a `crossorigin` attribute — a Google Fonts or CDN stylesheet, say
— is fetched no-CORS, which leaves the sheet unreadable *even when the server
sends `access-control-allow-origin: *`*: origin-cleanliness follows the request
mode, not the response header alone.

Such a sheet is skipped, with one `console.warn` naming its `href`. Its
media conditions keep answering the real browser value instead of the
toolbar. To opt one back in, ask for it with CORS:

```html
<link rel="stylesheet" crossorigin="anonymous" href="https://cdn.example/theme.css" />
```

## Options

### prefers-color-scheme

The `prefers-color-scheme` preference is used to detect if the user has requested a light or dark color theme.

```css
@media (prefers-color-scheme: dark) {
  .button {
    background: #333;
    color:      #fff;
  }
}

@media (prefers-color-scheme: light) {
  .button {
    background: #fff;
    color:      #555;
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-5/#prefers-color-scheme) [![MDN Documentation](https://shields.io/badge/docs-black?logo=mozilla&amp;style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

### prefers-contrast

The `prefers-contrast` preference is used to detect if the user has requested that the web content is presented with a higher or lower contrast.

```css
.outline {
  outline: 2px dashed black;
}

@media (prefers-contrast: more) {
  .outline {
    outline: 2px solid black;
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-5/#prefers-contrast) [![MDN Documentation](https://shields.io/badge/docs-black?logo=mozilla&amp;style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)

### prefers-reduced-data

The `prefers-reduced-data` preference is used to detect if the user has requested the web content that consumes less internet traffic.

```css
.hero {
  background-image: url("images/hero.webp");
}

@media (prefers-reduced-data: reduce) {
  .image {
    background-image: url("images/hero@reduced.webp");
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-data) [![MDN Documentation](https://shields.io/badge/docs-black?logo=mozilla&amp;style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data)

### prefers-reduced-motion

The `prefers-reduced-motion` preference is used to detect if the user has requested that the system minimize the amount of non-essential motion it uses.

```css
.button {
  animation: pulse 1s linear infinite both;
}

@media (prefers-reduced-motion) {
  .button {
    animation: none;
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion) [![MDN Documentation](https://shields.io/badge/docs-black?logo=mozilla&amp;style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### prefers-reduced-transparency

The `prefers-reduced-transparency` preference is used to detect if the user has requested the system minimize the amount of transparent or translucent layer effects it uses.

```css
.glass {
  opacity: 0.5; 
}

@media (prefers-reduced-transparency: reduce) {
  .glass {
    opacity: 1;
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-transparency)

### hover and any-hover

The `hover` feature reports whether the primary input can hover over elements: `hover` for a mouse, `none` for a touchscreen. `any-hover` asks the same of every available input. Emulating `hover: none` shows what a phone gets, including Tailwind CSS v4's `hover:` variants, which it wraps in `@media (hover: hover)`.

```css
.card .actions {
  opacity: 1;
}

@media (hover: hover) {
  .card .actions {
    opacity: 0;
  }

  .card:hover .actions {
    opacity: 1;
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-4/#hover) [![MDN Documentation](https://shields.io/badge/docs-black?logo=mozilla&amp;style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)

### pointer and any-pointer

The `pointer` feature reports how accurate the primary pointing device is: `fine` for a mouse or stylus, `coarse` for a finger, `none` for no pointer at all. `any-pointer` asks the same of every available input.

```css
@media (pointer: coarse) {
  .button {
    min-block-size: 44px;
  }
}
```

[![W3C Specification](https://img.shields.io/badge/Spec-005A9C?logo=w3c&amp;style=flat-square)](https://www.w3.org/TR/mediaqueries-4/#pointer) [![MDN Documentation](https://shields.io/badge/docs-black?logo=mozilla&amp;style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)

Emulation only changes what media queries and `window.matchMedia` report. It does not change the input itself: a test that hovers with a real mouse still triggers `:hover`, and the browser still fires mouse events rather than touch events.
