/** An app that plays sound, as the OS volume mixer shows it: its executable name, a readable name, its volume (0 to 1) and whether it is muted; where the OS tells, `processIds` lists the processes playing its sound and the ones that started them, the closest first. */
export type AudioApp = Readonly<{
	imageName: string;
	displayName: string;
	volume: number;
	isMuted: boolean;
	processIds?: readonly number[];
}>;
