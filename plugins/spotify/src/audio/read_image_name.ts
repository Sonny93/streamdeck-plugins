const PATH_SEPARATORS = /[\\/]/;

/** Gives the executable name of a process image path, e.g. `Spotify.exe` for `C:\...\Spotify.exe`. */
export function readImageName(imagePath: string): string {
	return imagePath.split(PATH_SEPARATORS).at(-1) ?? imagePath;
}
