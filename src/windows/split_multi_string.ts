const NUL = '\0';

/** Splits a Win32 multi-string (strings separated by NUL, ended by an empty one) into its strings. */
export function splitMultiString(text: string): string[] {
	return text.split(NUL).filter((part) => part.length > 0);
}
