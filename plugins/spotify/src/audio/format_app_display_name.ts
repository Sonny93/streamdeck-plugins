const EXECUTABLE_EXTENSION = /\.exe$/i;

/** Turns an executable name into a readable app name: `Spotify.exe` becomes `Spotify`, `discord.exe` becomes `Discord`. */
export function formatAppDisplayName(imageName: string): string {
	const name = imageName.replace(EXECUTABLE_EXTENSION, '');
	return `${name.charAt(0).toLocaleUpperCase()}${name.slice(1)}`;
}
