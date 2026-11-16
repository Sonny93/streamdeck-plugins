import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export const PLATFORM_DIRECTORY = path.dirname(
	url.fileURLToPath(import.meta.url)
);
const DECK_KIT_SOURCE = path.resolve(
	PLATFORM_DIRECTORY,
	'../../../../packages/deck-kit/src'
);
const DECK_KIT_PREFIX = 'deck-kit/';
const IMPORT_PATTERN =
	/(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^'";]*?from\s+['"]([^'"]+)['"]|(?:^|\n)\s*import\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function readImports(source: string): string[] {
	return [...source.matchAll(IMPORT_PATTERN)].flatMap((match) => {
		const specifier = match[1] ?? match[2] ?? match[3];
		return specifier === undefined ? [] : [specifier];
	});
}

function resolveSpecifier(
	specifier: string,
	importer: string
): string | undefined {
	if (specifier.startsWith(DECK_KIT_PREFIX)) {
		return path.join(
			DECK_KIT_SOURCE,
			`${specifier.slice(DECK_KIT_PREFIX.length)}.ts`
		);
	}
	if (specifier.startsWith('.')) {
		return path.resolve(path.dirname(importer), `${specifier}.ts`);
	}
	return undefined;
}

/** Test helper: every import specifier and file reachable from an entry file through relative and `deck-kit/` imports, type-only imports excluded. */
export function collectTransitiveImports(entry: string): Set<string> {
	const files = new Set<string>();
	const specifiers = new Set<string>();
	const pending = [entry];
	while (pending.length > 0) {
		const file = pending.pop();
		if (file === undefined || files.has(file)) {
			continue;
		}
		files.add(file);
		for (const specifier of readImports(fs.readFileSync(file, 'utf8'))) {
			specifiers.add(specifier);
			const resolved = resolveSpecifier(specifier, file);
			if (resolved !== undefined) {
				pending.push(resolved);
			}
		}
	}
	files.forEach((file) => specifiers.add(file));
	return specifiers;
}
