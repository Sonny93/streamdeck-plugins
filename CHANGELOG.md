# Changelog

All notable changes to streamdeck-plugins are written here for the people who use it. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Spotify Deck, Audio Deck and Display Deck run on Linux under [OpenDeck](https://github.com/nekename/OpenDeck), with the same keys and dials as on Windows, except where noted below. See [Install on Linux](docs/install.md#install-on-linux).
- Linux: audio devices, default device, mute and volume go through `pactl` (PipeWire or PulseAudio), and the keys follow changes made outside the plugin. The Volt 1 buttons go through `/dev/hidraw` and need a udev rule.
- Linux: brightness and HDR go through `kscreen-doctor` (KDE Plasma 6), and monitor standby through `ddcutil`. On monitors whose brightness KDE already drives over DDC/CI, the plugin goes through KDE instead of talking to the monitor itself.
- Linux: raising the Spotify window and the "focused app" volume target use `kdotool` when it is installed.
- Linux: the "App in the foreground" volume target matches the window and the sound by process, so it finds apps that rename their process or play sound from a child process (games, browsers, Electron apps).
- Linux: the black screen of Screen Power is not available, because Wayland does not let a plugin draw over the desktop. A new Screen Power key uses the standby, and one set to black screen shows as unavailable.
- Linux: Restart Elgato Audio shows as unavailable, since Elgato has no audio server there.
- Linux: Spotify shows in the app list of the volume dial, and covers, backdrops and playlist thumbnails show on the touch strip. The plugin draws the strip frames as PNG with resvg compiled to WebAssembly, because OpenDeck drops pictures inside SVG frames; a frame that fails to draw is skipped instead of stopping the plugin.

### Changed

- The "Picked app" setting of the Spotify volume dial shows only when its target is "Picked app".
- The Spotify "now playing" screen shows after 5 seconds without touching the dials, instead of 15.
- The released profile no longer carries the author's app and device settings: the volume dial falls back to the Spotify target, and the default-output and play-on-device keys lose their "Casque", "Enceintes" and "PC" labels.
- Audio changes run one at a time: quick turns of the volume dial add up instead of overwriting each other, and quick presses on Mute no longer cancel each other.
- A volume app saved as `name.exe` also matches `name`, whatever the case, so a profile carries over between Windows and Linux.
- The audio choice "Follow Windows" is now "Follow system", and the brightness control "Windows" is now "System". Saved settings keep working.

### Fixed

- On OpenDeck, the property inspector lists (outputs, inputs, monitors, apps, devices) fill in as soon as the inspector opens instead of staying on "Looking for ...".
- Display Deck no longer piles up monitor reads when a monitor is slow to answer.

## [1.2.0] - 2026-11-08

### Added

- `Setup.cmd` asks which plugins to install, and imports the profile without the keys and folders of the plugins you left out.
- When the profile is already installed, `Setup.cmd` offers to replace it, and to back up the current one first in `%LOCALAPPDATA%\streamdeck-plugins\profile-backup` (otherwise it goes to the Recycle Bin).

### Changed

- Icon pack and profile folder keys: labels use the Selawik Bold font, the same on every build, instead of a fallback font in the release builds.

### Fixed

- The profile no longer asks for a BeamNG plugin that the release does not ship.
- `Setup.cmd` waits up to 60 seconds for Stream Deck to close and closes it again when it restarts itself, instead of failing on the first run; when it still fails, the error lists the Stream Deck processes left.

## [1.1.0] - 2026-11-08

### Added

- Icon pack: a Display folder icon in the sky blue of Display Deck, with the label on top, at the bottom or without it.
- `Setup.cmd` at the root of the release zip: double-click it to install the plugins, the icon pack and the profile, without opening PowerShell.

### Changed

- Profile: the Macros folder becomes a Display folder, with the new Display folder icon and example keys (Screen Power, brightness at 100 % and 30 %, HDR, a Brightness Dial), and Restart Elgato Audio moves to the Audio folder.
- The profile no longer ships personal settings: after installing it, pick the device, playlist or monitor again in the property inspector of the Play on device, Playlists, Default Output and HDR keys.
- `install.ps1` installs only the plugins and icon packs that are missing or changed, leaves Stream Deck open when everything is up to date, and does not import the profile again when a profile with the same name exists. The new `-Force` switch installs every plugin and icon pack whatever its version.

### Fixed

- Display Deck: changing the brightness of a monitor under a black screen no longer lights it up; the monitor takes the new brightness when it wakes.

## [1.0.0] - 2026-11-07

### Added

- Spotify Deck: control the Spotify desktop app from Stream Deck with keys for playback, likes, playlists, lyrics, full screen and volume, and a Play on device key that moves playback to a Spotify Connect device.
- Audio Deck: the MONITOR and VINTAGE buttons of a Universal Audio Volt 1, the default Windows output, device mute, a device volume dial and a Restart Elgato Audio key that restarts the Elgato audio server.
- Display Deck: turn monitors off without moving the windows, change their brightness and switch HDR.
- Sonny93 Keys, an icon pack for the native folder and Back keys in the look of the plugin keys.
- A Stream Deck + profile that lays out the keys and dials of the plugins of this repository over 6 pages, with a BeamNG page for the BeamNG Deck plugin.
- Each GitHub release carries one zip with the packaged plugins, the icon pack and the profile, each installable with a double-click, and an `install.ps1` script that installs them in one go, after removing the dead links a deleted development checkout leaves in the Stream Deck folders.
- The code is available under the MIT license.
