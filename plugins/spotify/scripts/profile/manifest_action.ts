/** An action declared in the plugin manifest, reduced to what a profile page needs. */
export type ManifestAction = Readonly<{
	name: string;
	uuid: string;
	stateCount: number;
}>;
