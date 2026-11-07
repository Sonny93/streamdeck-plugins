# Develop a plugin

## Build from source

```sh
git clone https://github.com/Sonny93/streamdeck-plugins.git
cd streamdeck-plugins
mise install
mise x -- pnpm install
mise x -- pnpm build
```

## Link a plugin to Stream Deck

From the folder of the plugin you want:

```sh
cd plugins/<name>
mise x -- pnpm exec streamdeck link com.sonny93.<name>.sdPlugin
mise x -- just restart
```

`<name>` is `spotify`, `audio` or `display`. `just restart` restarts the Stream Deck app so it loads the plugin. A plugin installed from a release must be removed first, and a linked one unlinked before installing a release: see [Install a release](install.md#install-over-a-linked-plugin).

For the icon pack, see its [README](../icon-pack/README.md).

## Rebuild on every change

From a plugin folder:

```sh
mise x -- pnpm watch
```

It rebuilds on every change, including the shared code of [`packages/deck-kit`](../packages/deck-kit) that each plugin bundles, and restarts the plugin. A change to the manifest (new action, layout or state) also needs `mise x -- just restart`.

## Check before committing

From the repo root:

```sh
mise x -- pnpm check
```

It runs lint, format check, typecheck and the tests of every package. To fix lint and format issues:

```sh
mise x -- pnpm format
```

It can need a second run before `pnpm format:check` passes, because the lint fixes and the import sorting each change the other's output.

Every user-visible change adds a line under `## [Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md).

## Change the profile

The profile lives in [`profiles/spotify-deck`](../profiles/spotify-deck) as plain folders and JSON. Edit it on the device, export it from Stream Deck, then import the export over the folder and format it:

```sh
mise x -- pnpm profile:import <path/to/export.streamDeckProfile>
mise x -- pnpm format
```

The folder name is the profile name in lower case with dashes. Pass a name as a second argument to choose another one.

## Build the release files locally

After `mise x -- pnpm build`:

```sh
mise x -- pnpm package
```

It writes the same files as a release into `dist/`.
