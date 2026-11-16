import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const IMPORT_PATTERN =
	/(?:from|import\s*\()\s*'([^']+)'|^import\s+'([^']+)'/gmu;
const DECK_KIT_PREFIX = 'deck-kit/';
const DECK_KIT_SOURCE = path.resolve(
	import.meta.dirname,
	'../../../../packages/deck-kit/src'
);

export type TransitiveImports = Readonly<{
	/** Absolute paths of every source file reached, the entry included. */
	files: ReadonlySet<string>;
	/** Specifiers of packages and Node built-ins that no source file of the workspace answers. */
	externalSpecifiers: ReadonlySet<string>;
}>;

function resolveSourceFile(
	fromFile: string,
	specifier: string
): string | undefined {
	const base = specifier.startsWith(DECK_KIT_PREFIX)
		? path.join(DECK_KIT_SOURCE, specifier.slice(DECK_KIT_PREFIX.length))
		: specifier.startsWith('.')
			? path.resolve(path.dirname(fromFile), specifier)
			: undefined;
	if (base === undefined) {
		return undefined;
	}
	return [`${base}.ts`, base].find((candidate) => existsSync(candidate));
}

/** Follows the static and dynamic imports of a source file through the workspace, to tell what a bundle of it would pull in. */
export function collectTransitiveImports(entry: string): TransitiveImports {
	const files = new Set<string>();
	const externalSpecifiers = new Set<string>();
	const pending = [entry];
	for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
		if (files.has(file)) {
			continue;
		}
		files.add(file);
		const source = readFileSync(file, 'utf8');
		for (const match of source.matchAll(IMPORT_PATTERN)) {
			const specifier = match[1] ?? match[2];
			if (specifier === undefined) {
				continue;
			}
			const resolved = resolveSourceFile(file, specifier);
			if (resolved === undefined) {
				externalSpecifiers.add(specifier);
				continue;
			}
			pending.push(resolved);
		}
	}
	return { files, externalSpecifiers };
}
