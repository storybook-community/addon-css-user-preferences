# Storybook Addon: CSS User Preferences

This toolbar addon allows you to emulate CSS user preferences in Storybook.

<p align="center"><img src="/src/screenshot.webp" width="50%" /></p>

### Prerequisites

This project uses [mise](https://mise.jdx.dev) to pin Node.js and pnpm. Once mise is installed:

```sh
mise install
pnpm install
pnpm playwright:i   # Chromium, for the browser-mode tests
```

### Development scripts

- `pnpm storybook` starts Storybook, loading the addon straight from `src`
- `pnpm build` builds the addon with tsdown into `dist`
- `pnpm test` runs the Vitest browser-mode suite
- `pnpm check` type-checks without emitting
- `pnpm verify` runs all three

## What's included?

![Demo](https://user-images.githubusercontent.com/42671/107857205-e7044380-6dfa-11eb-8718-ad02e3ba1a3f.gif)

The addon code lives in `src`. It demonstrates all core addon related concepts. The three [UI paradigms](https://storybook.js.org/docs/react/addons/addon-types#ui-based-addons)

- `src/Tool.tsx`
- `src/Panel.js`
- `src/Tab.js`

Which, along with the addon itself, are registered in `src/manager.ts`.

Managing State and interacting with a story:

- `src/withGlobals.js` & `src/Tool.js` demonstrates how to use `useGlobals` to manage global state and modify the contents of a Story.
- `src/withRoundTrip.js` & `src/Panel.js` demonstrates two-way communication using channels.
- `src/Tab.js` demonstrates how to use `useParameter` to access the current story's parameters.

Your addon might use one or more of these patterns. Feel free to delete unused code. Update `src/manager.ts` and `src/preview.ts` accordingly.

Lastly, configure you addon name in `src/constants.js`.

### Metadata

Storybook addons are listed in the [catalog](https://storybook.js.org/addons) and distributed via npm. The catalog is populated by querying npm's registry for Storybook-specific metadata in `package.json`. This project has been configured with sample data. Learn more about available options in the [Addon metadata docs](https://storybook.js.org/docs/react/addons/addon-catalog#addon-metadata).

## Release Management

Releases run on [changesets](https://github.com/changesets/changesets). Deciding
what a change is worth is separate from publishing it.

### Making a change

Every pull request that changes published behaviour needs a changeset:

```sh
pnpm cs
```

Pick `patch`, `minor` or `major`, write a sentence a consumer would want to read
in the changelog, and commit the generated file in `.changeset/`. Changes that
never reach the package — tests, CI, contributor docs — need no changeset.

### Creating a release

Nobody publishes by hand. Merging to `main` runs `.github/workflows/release.yml`,
which verifies the change and then:

- if unreleased changesets are waiting, opens or updates a **version packages**
  pull request that applies the version bump and writes `CHANGELOG.md`;
- if that pull request is what just merged, publishes the new version to npm and
  tags the release.

So a release is one review away: merge the version packages PR when the changelog
reads right.

### npm authentication

There is no `NPM_TOKEN`. The release workflow publishes with [npm trusted
publishing](https://docs.npmjs.com/trusted-publishers/), which exchanges a GitHub
OIDC token for credentials that live for minutes and attaches a provenance
attestation to the release.

That requires a trusted publisher registered at
`npmjs.com/package/@storybook-community/addon-css-user-preferences/access`, naming
this repository and `release.yml` — the _caller_ workflow's filename, not the
reusable workflow it calls. npm validates the caller. Until that registration
exists the publish step fails with a 401.
