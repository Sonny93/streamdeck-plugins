# Install a release

Each [GitHub release](https://github.com/Sonny93/streamdeck-plugins/releases) carries one file, `streamdeck-plugins-<version>.zip`. It holds the folders `plugins`, `icons` and `profiles`, and `install.ps1` at its root.

## Install everything with the script

Extract the zip entirely, then run the script from the extracted folder, in a normal (not Administrator) PowerShell window:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Add `-WithProfile` to also import the Stream Deck + profile. Each import adds a profile, so it is opt-in.

The script:

- Closes Stream Deck, then starts it again when it is done.
- Removes the dead `com.sonny93.*` links a deleted development checkout left in the Stream Deck folders, and refuses live ones.
- Opens each package so that Stream Deck's own installer installs it. Stream Deck may ask you to confirm each install: accept every prompt.

Its source is [`install.ps1`](../packages/release-tools/assets/install.ps1).

## Install a single file

Double-click a file of the extracted folder:

- A `.streamDeckPlugin` file in `plugins` installs that plugin.
- The `.streamDeckIconPack` file in `icons` installs the Sonny93 Keys icon pack.
- The `.streamDeckProfile` file in `profiles` imports the profile.

## About the profile

The profile expects the `com.sonny93.beamng` plugin (BeamNG Deck, in another repository). The keys of a missing plugin stay empty.

## Update

Install the new release again. Stream Deck updates plugins by itself only for the ones from its Marketplace, and these plugins are not on it.

## Install over a linked plugin

A plugin linked for development with `streamdeck link` must be unlinked first, because installing over it can write into the repository folder. From the folder of that plugin:

```sh
mise x -- pnpm exec streamdeck unlink com.sonny93.<name>
```

`<name>` is `spotify`, `audio` or `display`. For the icon pack, see its [README](../icon-pack/README.md).
