# Changelog

All notable changes to streamdeck-plugins are written here for the people who use it. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Icon pack: a Display folder icon in the sky blue of Display Deck, with the label on top, at the bottom or without it.
- `Setup.cmd` at the root of the release zip: double-click it to install the plugins, the icon pack and the profile, without opening PowerShell.

### Changed

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
