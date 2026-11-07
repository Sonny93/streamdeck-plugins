# streamdeck-plugins

Stream Deck plugins for a Windows PC, built for the Stream Deck +: Spotify control, PC audio control and monitor control, in one pnpm workspace.

| Plugin                                    | What it controls                                                    |
| ----------------------------------------- | ------------------------------------------------------------------- |
| [Spotify Deck](plugins/spotify/README.md) | The Spotify desktop app: playback, likes, playlists, lyrics, volume |
| [Audio Deck](plugins/audio/README.md)     | Universal Audio Volt 1 front panel, Windows audio devices           |
| [Display Deck](plugins/display/README.md) | Monitors: turning them off, brightness, HDR                         |

[Sonny93 Keys](icon-pack/README.md) is an icon pack for the native folder and Back keys, in the same look as the plugin keys.

## Requirements

- Windows 10 or later, with Stream Deck 7.1 or later.
- To build from source, [mise](https://mise.jdx.dev), which installs Node, pnpm and just from [`mise.toml`](mise.toml).
- A Stream Deck + for the dial actions.

## Install

Download the files of the [latest release](https://github.com/Sonny93/streamdeck-plugins/releases/latest) and double-click each one you want:

- A `.streamDeckPlugin` file per plugin.
- The `.streamDeckIconPack` file for the Sonny93 Keys icon pack.
- The `.streamDeckProfile` file for a Stream Deck + profile.

The profile also expects the `com.sonny93.beamng` plugin (BeamNG Deck, in another repository) and the third-party Mouse Simulator plugin (`com.vivremotion.mousesimulator`, from the Marketplace). The keys of a missing plugin stay empty.

To update, download the new release and double-click the files again: Stream Deck does not update plugins from outside its Marketplace.

A plugin linked for development with `streamdeck link` must be unlinked first, because installing over a linked plugin can write into the repository folder. From the folder of that plugin:

```sh
mise x -- pnpm exec streamdeck unlink com.sonny93.<name>
```

`<name>` is `spotify`, `audio` or `display`.

## Develop

Install from source:

```sh
git clone https://github.com/Sonny93/streamdeck-plugins.git
cd streamdeck-plugins
mise install
mise x -- pnpm install
mise x -- pnpm build
```

Then link each plugin you want to Stream Deck, from its folder:

```sh
cd plugins/<name>
mise x -- pnpm exec streamdeck link com.sonny93.<name>.sdPlugin
mise x -- just restart
```

`just restart` restarts the Stream Deck app so it loads the plugin.

The code that several plugins share lives in [`packages/deck-kit`](packages/deck-kit), bundled into each plugin.

From a plugin folder, `mise x -- pnpm watch` rebuilds on every change, `packages/deck-kit` included, and restarts the plugin. A change to the manifest (new action, layout or state) also needs `mise x -- just restart`.

Before committing, run the checks from the repo root: lint, format, typecheck and tests of every package.

```sh
mise x -- pnpm check
```

`mise x -- pnpm format` fixes lint and format issues.

## Release

Every user-visible change adds a line under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md). One version covers every plugin, the icon pack and the profile.

Releases run in GitHub Actions only, from `main`, never from a local machine:

```sh
gh workflow run release.yml -f increment=<patch|minor|major>
```

To test the pipeline and the files first, add `-f prerelease=true`: the entries stay under Unreleased, the release is marked as a prerelease and its files carry the base version (`1.0.0-next.0` ships files versioned `1.0.0`).

```sh
gh workflow run release.yml -f increment=<patch|minor|major> -f prerelease=true
```

Or use Actions, Release, Run workflow on GitHub. The workflow:

- Runs the checks, then bumps the version, rolls the changelog, tags the commit and creates the GitHub release with the changelog section as its notes.
- Builds the release tag and checks that every package carries the release version.
- Attaches the plugins, the icon pack and the profile to the release.

`mise x -- pnpm package` builds the same files into `dist/` locally, after `mise x -- pnpm build`.

The release needs a one-time GitHub setup: the `release` environment, the deploy key and the tag ruleset. Follow [Releasing, one-time setup](https://github.com/minimalstuff/tooling/blob/main/docs/releasing.md#one-time-setup) and skip the npm parts.

## Troubleshooting

### The build fails with `EPERM` on `koffi-win32-x64`

A running plugin locks the native koffi module, so a build that updates koffi cannot replace it. Close the Stream Deck app, build, then start Stream Deck again.

### A plugin stops after linking it from a new folder

Stream Deck can fail to start a freshly linked plugin a few times before it starts it. Restart the plugin with `mise x -- pnpm restart` from its folder.
