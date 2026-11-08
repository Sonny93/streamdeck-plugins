# streamdeck-plugins

Stream Deck + plugins for a Windows PC, one pnpm workspace with each plugin under `plugins/<name>`.

## Verify

- `mise x -- pnpm check` from the root runs lint, format check, typecheck and the tests of every package. Node and pnpm come from mise and are not on the bare PATH.
- One test file: `mise x -- pnpm --filter <audio-deck|spotify-deck|display-deck|deck-kit|icon-pack|release-tools> exec vitest run <path>`.
- Package tests run one at a time (`--workspace-concurrency=1`): vitest 5 shares its module cache at the workspace root, and parallel runs fail with `ENOTEMPTY` on `node_modules/.vitest-cache`.
- `mise x -- pnpm package` writes the release files into `dist/` and needs a `pnpm build` first.
- `mise x -- pnpm format` can need a second run before `format:check` passes, because the lint fixes and oxfmt's import sorting each change the other's output.
- The user tests on their own Stream Deck + and Volt 1: after a build, ask them to check the device rather than claiming it works.

## Conventions

- Load `typescript-conventions` before touching TypeScript, and `commit` to commit.
- Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md` in the same commit: release-it fails on an empty section.
- Keys share one look: background `#121212`, one accent per domain (amber `#FFB020` audio, green `#1DB954` Spotify, sky blue `#4FC3F7` displays, white for neutral folders, grey for navigation), and a label the plugin draws in SVG in the icon color, because a plugin cannot change the color of the native title.

## Decisions

- Tooling (oxlint, oxfmt, mise, `pnpm check`) lives at the root only; each plugin keeps its own `package.json`, tsdown config, tsconfig and build, watch and restart scripts.
- tsdown (rolldown + oxc) bundles and `tsc` only typechecks, because TypeScript 7 has no JavaScript API for a bundler plugin to call.
- Plugin code keeps `@types/node` on 24: Stream Deck runs plugins on its own bundled Node, 20 or 24, whatever the dev Node from mise is.
- Actions declare `override readonly manifestId` instead of the SDK's `@action` decorator: oxc leaves decorators untransformed and Node cannot run them.
- Code moves to `packages/deck-kit` on its second use across plugins, not before. Plugins import `deck-kit/<folder>/<file>` and bundle it through `deps.alwaysBundle`, since tsdown leaves dependencies external and `bin/node_modules` only ships koffi.
- `icon-pack/` copies the key layout of `deck-kit` instead of importing it: Node runs its TypeScript natively and cannot resolve the extensionless imports of the plugins, so a layout change goes to both.
- `icon-pack/` renders its labels with the bundled Selawik Bold instead of Segoe UI, because the release builds on Linux where Segoe UI is missing; the folder images in the profile are copies of the pack PNGs.
- The oxlint preset runs with `subpathImports: false`, because the plugins rely on extensionless relative imports that tsdown resolves.
- Releases run only through the dispatched `release.yml`, which calls the shared `minimalstuff/tooling` release workflow; never `pnpm release`, release-it or `git tag` locally, since tags are reserved to the CI deploy key.
- One version covers every plugin, the icon pack and the profile. `release-tools` writes it at pack time (`streamdeck pack --version`) into a staged copy, because `pack` rewrites the manifest it packs; the committed manifests keep their placeholder version. A prerelease (`1.0.0-next.0`) ships files versioned `1.0.0`, since a four-part manifest version cannot carry the suffix.
- The Stream Deck + profile lives unpacked in `profiles/<name>/` so its changes show in diffs: edit it on the device, export it, then `pnpm profile:import <file>` and `pnpm format`. The packer adds the empty `Images/` folders that git drops.
- A committed profile holds only workspace plugins: `profile:import` drops the actions of other plugins and the folders they empty, and `pnpm package` builds one variant per subset of its plugins, listed in `profiles-index.json`, so `install.ps1` picks a file instead of editing JSON in PowerShell 5.1. Multi actions are refused, since they nest actions of any plugin.
- The release zip's `install.ps1` only removes dead `com.sonny93.*` junctions and then hands each package to Stream Deck's own installer: it never extracts into `%APPDATA%`, and the only folder it removes there is a profile the user agreed to replace, moved to `%LOCALAPPDATA%\streamdeck-plugins\profile-backup` or the Recycle Bin after checking its tree holds no reparse point, never with a recursive delete.
- `supportedArchitectures` in `pnpm-workspace.yaml` installs the win32 packages on Linux too, so the koffi copy works on the Linux CI runners.
- A plugin joins as `plugins/<name>` with its history: a move commit in its own repo, then a merge with `--allow-unrelated-histories`.
- Windows APIs go through koffi FFI instead of native addons, so no C++ toolchain is needed: the tsdown config copies the prebuilt `@koromix/koffi-win32-x64` into `bin/node_modules`, and `allowBuilds` keeps koffi's install script off.
- `.gitattributes` forces LF because Git for Windows checks out CRLF here (`core.autocrlf=true`), which makes oxfmt flag every file.

## Rejected

- One repo per plugin: merged into this workspace.
- A visual charter document: the look is the code above.
- Styling the native folder and Back keys from a plugin: the SDK does not allow it, so an icon pack does it instead.
- A release hook that commits the version into the manifests: rewriting them risks breaking `format:check` on a release commit that skips the checks.
- A profile generated by the Spotify plugin and auto-installed with it: it duplicated the exported full profile.
- An install script that extracts the packages into `%APPDATA%` itself: deleting folders there can follow junctions into a checkout, and the official installer already does the job.
- A bash install script: Stream Deck has no Linux build; revisit with OpenDeck.
- The Marketplace: the plugins are personal, so they ship as GitHub release files even though only the Marketplace auto-updates.
