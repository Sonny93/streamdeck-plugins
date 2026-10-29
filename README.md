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
- [mise](https://mise.jdx.dev), which installs Node, pnpm and just from [`mise.toml`](mise.toml).
- A Stream Deck + for the dial actions.

## Install from source

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

`<name>` is `spotify`, `audio` or `display`. `just restart` restarts the Stream Deck app so it loads the plugin.

## Develop

The code that several plugins share lives in [`packages/deck-kit`](packages/deck-kit), bundled into each plugin.

From a plugin folder, `mise x -- pnpm watch` rebuilds on every change, `packages/deck-kit` included, and restarts the plugin. A change to the manifest (new action, layout or state) also needs `mise x -- just restart`.

Before committing, run the checks from the repo root: lint, format, typecheck and tests of every package.

```sh
mise x -- pnpm check
```

`mise x -- pnpm format` fixes lint and format issues.

## Troubleshooting

### The build fails with `EPERM` on `koffi-win32-x64`

A running plugin locks the native koffi module, so a build that updates koffi cannot replace it. Close the Stream Deck app, build, then start Stream Deck again.

### A plugin stops after linking it from a new folder

Stream Deck can fail to start a freshly linked plugin a few times before it starts it. Restart the plugin with `mise x -- pnpm restart` from its folder.
