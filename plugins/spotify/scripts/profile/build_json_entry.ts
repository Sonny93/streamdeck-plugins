import type { ZipEntry } from 'deck-kit/zip/zip_entry';

/** Builds a zip entry that holds the value as compact JSON, the way the Stream Deck app writes its manifests. */
export function buildJsonEntry(
	options: Readonly<{ name: string; value: unknown }>
): ZipEntry {
	return {
		name: options.name,
		data: Buffer.from(JSON.stringify(options.value), 'utf8'),
	};
}
