# Sonny93 Keys

An icon pack for the keys a plugin cannot draw on, the native folders and their Back key, in the look of the plugin keys: a stroked icon and a label in one accent color on a dark key.

| Icon                 | Color    |
| -------------------- | -------- |
| Audio folder         | Amber    |
| Spotify folder       | Green    |
| Display folder       | Sky blue |
| Climate folder       | Mint     |
| Climate modes folder | Mint     |
| Macros folder        | White    |
| Back                 | Grey     |

Each icon comes five ways, named `<id>.png` for the image without label (for a key that uses the native title) and `<id>-label-top-<language>.png` and `<id>-label-bottom-<language>.png` for the label on top and at the bottom, with `<language>` being `en` or `fr`. In the key image menu they read like "Display folder, label at the bottom (French)". The label positions match the labels of Audio Deck.

| Icon                 | English | French    |
| -------------------- | ------- | --------- |
| Audio folder         | Audio   | Audio     |
| Spotify folder       | Spotify | Spotify   |
| Display folder       | Display | Affichage |
| Climate folder       | Climate | Climat    |
| Climate modes folder | Modes   | Modes     |
| Macros folder        | Macros  | Macros    |
| Back                 | Back    | Retour    |

Labels use the bundled Selawik Bold font (SIL OFL, in [`fonts/`](fonts)), so the build looks the same on any OS.

## Install

The release zip carries the pack: see [Install a release](../docs/install.md).

## Install from source

After installing the workspace as described in the [root README](../README.md), from this folder:

```sh
mise x -- pnpm build
mise x -- pnpm link-pack
```

`build` draws the PNG images into `com.sonny93.keys.sdIconPack`. `link-pack` links that folder into the Stream Deck icon packs folder, the way `streamdeck link` does for a plugin. That link is a junction: to install a released icon pack afterwards, remove it first with `cmd /c rmdir "%APPDATA%\Elgato\StreamDeck\IconPacks\com.sonny93.keys.sdIconPack"`, which keeps this folder, or the link breaks when you delete the checkout. Restart Stream Deck to load the pack, then pick the images from the icon library in the key image menu.

## Change an icon

The icons are drawn in SVG by [`src/pack_icons.ts`](src/pack_icons.ts). After a change, run `mise x -- pnpm build` again and restart Stream Deck: the link already points to the rebuilt folder.
