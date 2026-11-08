import type { JsonRecord, ProfileDocument } from './profile_document.ts';

/** Applies a function to every page manifest of a document. */
export function mapProfilePages(
	options: Readonly<{
		document: ProfileDocument;
		transform: (manifest: JsonRecord) => JsonRecord;
	}>
): ProfileDocument {
	const { document, transform } = options;
	return {
		rootManifest: document.rootManifest,
		pages: new Map(
			[...document.pages].map(([pageId, manifest]) => [
				pageId,
				transform(manifest),
			])
		),
	};
}
