import type { ProfileDocument } from './profile_document.ts';

/** A profile folder read from disk: the document and the folder of each page, keyed by lower-case page identifier. */
export type ProfileOnDisk = Readonly<{
	document: ProfileDocument;
	sdProfileDirectory: string;
	pageDirectories: ReadonlyMap<string, string>;
}>;
