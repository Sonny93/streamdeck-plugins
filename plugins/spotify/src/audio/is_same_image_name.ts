const EXECUTABLE_EXTENSION = /\.exe$/i;

function normalize(imageName: string): string {
	return imageName.replace(EXECUTABLE_EXTENSION, '').toLowerCase();
}

/** Compares two executable names ignoring case and a trailing `.exe`, so a name saved on Windows still matches the same app on Linux. */
export function isSameImageName(first: string, second: string): boolean {
	return normalize(first) === normalize(second);
}
