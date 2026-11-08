/** A parsed JSON object of a profile. */
export type JsonRecord = Readonly<Record<string, unknown>>;

/** The manifests of a profile in memory: the root one and one per page or folder, keyed by lower-case page identifier. */
export type ProfileDocument = Readonly<{
	rootManifest: JsonRecord;
	pages: ReadonlyMap<string, JsonRecord>;
}>;
