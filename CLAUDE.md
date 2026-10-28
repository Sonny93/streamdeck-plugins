# streamdeck-plugins

Stream Deck + plugins for a Windows PC, one pnpm workspace with each plugin under `plugins/<name>`.

## Verify

- `mise x -- pnpm check` from the root runs lint, format check, typecheck and the tests of every plugin. Node and pnpm come from mise and are not on the bare PATH.
- One test file: `mise x -- pnpm --filter <audio-deck|spotify-deck|icon-pack> exec vitest run <path>`.
- `mise x -- pnpm format` can need a second run before `format:check` passes, because the lint fixes and oxfmt's import sorting each change the other's output.
- The user tests on their own Stream Deck + and Volt 1: after a build, ask them to check the device rather than claiming it works.

## Conventions

- Load `typescript-conventions` before touching TypeScript, and `commit` to commit.
- Keys share one look: background `#121212`, one accent per domain (amber `#FFB020` audio, green `#1DB954` Spotify, white for neutral folders, grey for navigation), and a label the plugin draws in SVG in the icon color, because a plugin cannot change the color of the native title.

## Decisions

- Tooling (oxlint, oxfmt, mise, `pnpm check`) lives at the root only; each plugin keeps its own `package.json`, tsdown config, tsconfig and build, watch and restart scripts.
- tsdown (rolldown + oxc) bundles and `tsc` only typechecks, because TypeScript 7 has no JavaScript API for a bundler plugin to call.
- Plugin code keeps `@types/node` on 24: Stream Deck runs plugins on its own bundled Node, 20 or 24, whatever the dev Node from mise is.
- Actions declare `override readonly manifestId` instead of the SDK's `@action` decorator: oxc leaves decorators untransformed and Node cannot run them.
- `packages/` is created only once two plugins need the same code, not before.
- `icon-pack/` copies the key layout of Audio Deck instead of importing it: Node runs its TypeScript natively and cannot resolve the extensionless imports of the plugins, so a layout change goes to both.
- A plugin joins as `plugins/<name>` with its history: a move commit in its own repo, then a merge with `--allow-unrelated-histories`.
- Windows APIs go through koffi FFI instead of native addons, so no C++ toolchain is needed: the tsdown config copies the prebuilt `@koromix/koffi-win32-x64` into `bin/node_modules`, and `allowBuilds` keeps koffi's install script off.
- `.gitattributes` forces LF because Git for Windows checks out CRLF here (`core.autocrlf=true`), which makes oxfmt flag every file.

## Rejected

- One repo per plugin: merged into this workspace.
- A visual charter document: the look is the code above.
- Styling the native folder and Back keys from a plugin: the SDK does not allow it, so an icon pack does it instead.
