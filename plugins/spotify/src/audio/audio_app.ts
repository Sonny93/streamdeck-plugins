/** An app that plays sound, as the Windows volume mixer shows it: its executable name, a readable name, its volume (0 to 1) and whether it is muted. */
export type AudioApp = Readonly<{
	imageName: string;
	displayName: string;
	volume: number;
	isMuted: boolean;
}>;
