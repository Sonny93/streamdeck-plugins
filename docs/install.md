# Install a release

Each [GitHub release](https://github.com/Sonny93/streamdeck-plugins/releases) carries one file, `streamdeck-plugins-<version>.zip`. It holds the folders `plugins`, `icons` and `profiles`, and `Setup.cmd` and `install.ps1` at its root.

## Install everything with a double-click

Extract the zip entirely, then double-click `Setup.cmd` in the extracted folder. Windows may warn about an unknown publisher: choose More info, then Run anyway. The window stays open at the end so that you can read the result. Stream Deck may ask you to confirm each install: accept every prompt.

`Setup.cmd` runs `install.ps1` with `-WithProfile`: it asks which plugins to install, installs them and the icon pack, and imports the Stream Deck + profile in the variant that matches your plugins. The window asks its questions before it closes Stream Deck; answer with Enter to take the default shown in brackets.

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

- Considers only the plugins and icon packs that are missing or whose version differs from the installed one.
- Asks `Install <plugin> <version>? [Y/n]` for each such plugin. Declining one leaves the installed copy, if any, as it is: nothing is ever uninstalled. Icon packs are installed without a question.
- Considers everything whatever the installed version with `-Force`; the plugins are still asked about.
- Imports the profile, with `-WithProfile`, in the variant that matches the plugins present after the run (the ones just installed plus the ones already installed). A profile whose plugins are all missing is skipped. A release without the profiles index imports its main profile files instead.
- Leaves Stream Deck open and prints that there is nothing to do when nothing is installed or imported.
- Otherwise closes Stream Deck when a plugin or icon pack must be installed or a profile replaced, waits up to 60 seconds for it to exit, then starts it again when it is done.
- Removes the dead `com.sonny93.*` links a deleted development checkout left in the Stream Deck folders, and refuses live ones.
- Opens each package so that Stream Deck's own installer installs it. Stream Deck may ask you to confirm each install: accept every prompt.

## Replace an existing profile

With `-WithProfile`, when Stream Deck already has a profile with the same name, the script asks `The profile '<name>' is already installed. Replace it? [y/N]`. Enter keeps the profile as it is. If you answer yes, it asks `Back up the current one first? [Y/n]`.

- With a backup, the profile folder is moved to `%LOCALAPPDATA%\streamdeck-plugins\profile-backup\<yyyyMMdd-HHmmss>\<folder name>` and the script prints that path. If the move fails, the script stops and changes nothing else.
- All backups are made first. If one fails, the ones already made are put back and the script stops. Only then are the folders you chose not to back up sent to the Recycle Bin, where you can restore them from while Stream Deck is closed.
- If several profiles have that name, the script lists their folders and skips the profile: remove the extras in Stream Deck, then run it again.
- A profile counts as already installed when its name and its device model both match. The prompt shows the folder path.
- If the profile folder holds a link (a reparse point), the script refuses to touch it and changes nothing.

To restore a backup, close Stream Deck from the tray icon, then move the `<folder name>.sdProfile` folder from the backup folder back into `%APPDATA%\Elgato\StreamDeck\ProfilesV3` (or `ProfilesV2` on older versions), and start Stream Deck. Delete the replacement profile in Stream Deck first if you want to keep a single one.

Its sources are [`Setup.cmd`](../packages/release-tools/assets/Setup.cmd) and [`install.ps1`](../packages/release-tools/assets/install.ps1).

## Install a single file

Double-click a file of the extracted folder:

- A `.streamDeckPlugin` file in `plugins` installs that plugin.
- The `.streamDeckIconPack` file in `icons` installs the Sonny93 Keys icon pack.
- The `.streamDeckProfile` file in `profiles` imports the profile for all the plugins; the files in `profiles/variants` import the profile for fewer plugins (`profiles/profiles-index.json` lists which file fits which plugins). This does not replace an existing profile: delete it in Stream Deck first.

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
