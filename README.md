# streamdeck-plugins

Stream Deck plugins for a Windows PC, built for the Stream Deck +: Spotify control, PC audio control (Universal Audio Volt 1, Windows audio devices) and monitor control, plus an icon pack and a Stream Deck + profile, in one pnpm workspace.

| Package                                   | What it does                                                        |
| ----------------------------------------- | ------------------------------------------------------------------- |
| [Spotify Deck](plugins/spotify/README.md) | The Spotify desktop app: playback, likes, playlists, lyrics, volume |
| [Audio Deck](plugins/audio/README.md)     | Universal Audio Volt 1 front panel, Windows audio devices           |
| [Display Deck](plugins/display/README.md) | Monitors: turning them off, brightness, HDR                         |
| [Sonny93 Keys](icon-pack/README.md)       | Icon pack for the native folder and Back keys                       |

A Stream Deck + profile lays the keys and dials of these plugins out over several pages.

## Requirements

- Windows 10 or later, with Stream Deck 7.1 or later.
- A Stream Deck + for the dial actions.
- To build from source, [mise](https://mise.jdx.dev), which installs Node, pnpm and just from [`mise.toml`](mise.toml).

## Install

Download `streamdeck-plugins-<version>.zip` from the [latest release](https://github.com/Sonny93/streamdeck-plugins/releases/latest), extract it entirely, then double-click `Setup.cmd` in the extracted folder. Windows may warn about an unknown publisher: choose More info, then Run anyway. Stream Deck may ask you to confirm each install.

`Setup.cmd` installs the plugins and the icon pack and imports the Stream Deck + profile. To install without the profile, run the script from a normal (not Administrator) PowerShell window in the extracted folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

To update, run `Setup.cmd` or the script from the new release: only what changed is installed, and the profile is skipped when one with the same name exists. See [Install a release](docs/install.md) for the details and how to install a single file.

## Develop

```sh
mise install
mise x -- pnpm install
mise x -- pnpm build
mise x -- pnpm check
```

`pnpm check` runs lint, format check, typecheck and tests of every package: run it before committing. See [Develop a plugin](docs/develop.md) to link a plugin to Stream Deck, watch changes and edit the profile.

## Release

Releases run only through the `release.yml` GitHub Actions workflow, from `main`. See [Release a version](docs/release.md).

## Troubleshooting

See [Troubleshooting](docs/troubleshooting.md): "Unable to install" after deleting a checkout, `EPERM` on `koffi-win32-x64` during a build, and a freshly linked plugin that does not start.

Report anything else in the [issues](https://github.com/Sonny93/streamdeck-plugins/issues).

## License

[MIT](LICENSE)
