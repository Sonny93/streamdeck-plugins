# Install a release

Each [GitHub release](https://github.com/Sonny93/streamdeck-plugins/releases) carries one file, `streamdeck-plugins-<version>.zip`. It holds the folders `plugins`, `icons` and `profiles`, and `Setup.cmd` and `install.ps1` at its root.

## Install everything with a double-click

Extract the zip entirely, then double-click `Setup.cmd` in the extracted folder. Windows may warn about an unknown publisher: choose More info, then Run anyway. The window stays open at the end so that you can read the result. Stream Deck may ask you to confirm each install: accept every prompt.

`Setup.cmd` runs `install.ps1` with `-WithProfile`: it installs the plugins and the icon pack, and imports the Stream Deck + profile.

## Install everything with the script

To install without the profile, run the script from the extracted folder, in a normal (not Administrator) PowerShell window:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Add `-WithProfile` to also import the Stream Deck + profile. A prerelease carries the same version as the previous one, so use `-Force` to reinstall it:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Force
```

The script:

- Installs only the plugins and icon packs that are missing or whose version differs from the installed one.
- Installs everything whatever the installed version with `-Force`, which does not affect the profile.
- Imports the profile, with `-WithProfile`, only when Stream Deck has no profile with the same name. To import it again, delete that profile in Stream Deck first.
- Leaves Stream Deck open and prints that everything is up to date when there is nothing to do.
- Otherwise closes Stream Deck when a plugin or icon pack must be installed, then starts it again when it is done.
- Removes the dead `com.sonny93.*` links a deleted development checkout left in the Stream Deck folders, and refuses live ones.
- Opens each package so that Stream Deck's own installer installs it. Stream Deck may ask you to confirm each install: accept every prompt.

Its sources are [`Setup.cmd`](../packages/release-tools/assets/Setup.cmd) and [`install.ps1`](../packages/release-tools/assets/install.ps1).

## Install a single file

Double-click a file of the extracted folder:

- A `.streamDeckPlugin` file in `plugins` installs that plugin.
- The `.streamDeckIconPack` file in `icons` installs the Sonny93 Keys icon pack.
- The `.streamDeckProfile` file in `profiles` imports the profile.

## About the profile

The profile expects the `com.sonny93.beamng` plugin (BeamNG Deck, in another repository). The keys of a missing plugin stay empty.

## Update

Run `Setup.cmd` or `install.ps1` from the new release: only the plugins and icon packs whose version changed are installed. Stream Deck updates plugins by itself only for the ones from its Marketplace, and these plugins are not on it.

## Install over a linked plugin

A plugin linked for development with `streamdeck link` must be unlinked first, because installing over it can write into the repository folder. From the folder of that plugin:

```sh
mise x -- pnpm exec streamdeck unlink com.sonny93.<name>
```

`<name>` is `spotify`, `audio` or `display`. For the icon pack, see its [README](../icon-pack/README.md).
