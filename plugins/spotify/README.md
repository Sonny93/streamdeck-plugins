# Spotify Deck

Control the Spotify desktop app from Stream Deck: playback, likes, playlists, lyrics, full screen, and the volume of Spotify or of any other app.

Install and develop it as described in the [root README](../../README.md).

## Actions

- **Play / Pause**, **Previous track**, **Next track**: control playback.
- **Play on device**: moves playback to a Spotify Connect device: this PC, your phone, a TV or a speaker.
- **Like**: adds the current track to the playlist picked on the Playlists dial (Liked Songs by default).
- **Playlists** (dial): browse your playlists, play one, or add the playing track to one.
- **Volume** (dial): controls the volume of Spotify, of the app in the foreground, or of an app you pick.
- **Toggle lyrics**: shows or hides the lyrics view.
- **Toggle full screen**: enters or exits the Spotify full screen mode.
- **Open search**: brings Spotify to the front with the search field focused.
- **Show Spotify**: brings the Spotify window to the foreground.

## How the plugin reaches Spotify

Spotify has no local API for its desktop app, so the plugin drives the app through its Chrome DevTools port, `9229` on `localhost`. Spotify opens that port only when it is launched with `--remote-debugging-port`:

- When Spotify is not running, the plugin starts it with the flag.
- When Spotify is already running without the port, the plugin closes it and starts it again with the flag. Playback stops for a moment when the plugin starts.

The desktop app itself fetches the lyrics, with its own session: the plugin needs no Spotify account setup or API key.

## Troubleshooting

### `Spotify did not open its DevTools port 9229`

Spotify is running without the debug port, often because Windows started it at logon. Close Spotify completely, or turn off its autostart, then press any Spotify Deck key: the plugin starts Spotify with the port.
