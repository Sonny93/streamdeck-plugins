import { NO_CURRENT_PAGE } from './profile_action_uuids.ts';
import type { JsonRecord, ProfileDocument } from './profile_document.ts';

/** Builds a profile document from page manifests keyed by identifier, for tests. */
export function buildTestDocument(
	options: Readonly<{
		pages: Readonly<Record<string, JsonRecord>>;
		defaultPage: string;
		listedPages?: readonly string[];
		currentPage?: string;
	}>
): ProfileDocument {
	return {
		rootManifest: {
			Name: 'Test Deck',
			Pages: {
				Current: options.currentPage ?? NO_CURRENT_PAGE,
				Default: options.defaultPage,
				Pages: options.listedPages ?? [],
			},
		},
		pages: new Map(
			Object.entries(options.pages).map(([pageId, manifest]) => [
				pageId.toLowerCase(),
				manifest,
			])
		),
	};
}
