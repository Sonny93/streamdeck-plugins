import { readFileSync } from 'node:fs';
import path from 'node:path';

const SOURCE_DIRECTORY = path.resolve(import.meta.dirname, '..');
const DECK_KIT_DIRECTORY = path.resolve(
	import.meta.dirname,
	'../../../../packages/deck-kit/src'
);
const DECK_KIT_PREFIX = 'deck-kit/';
const STATIC_IMPORT = /^import\s+(?!type\b)[^;]*?from\s+'([^']+)'/gmu;
const DYNAMIC_IMPORT = /\bimport\(\s*'([^']+)'\s*\)/gu;

function resolveSpecifier(
	specifier: string,
	importer: string
): string | undefined {
	if (specifier.startsWith(DECK_KIT_PREFIX)) {
		return `${path.join(DECK_KIT_DIRECTORY, specifier.slice(DECK_KIT_PREFIX.length))}.ts`;
	}
	return specifier.startsWith('.')
		? `${path.resolve(path.dirname(importer), specifier)}.ts`
		: undefined;
}

/**
 * Lists every file a TypeScript file loads at run time, following the plugin and deck-kit imports; type-only imports are skipped.
 * Packages from `node_modules` are returned by name, as `package:<name>`.
 */
export function listRuntimeImports(entry: string): string[] {
	const visited = new Set<string>();
	const pending = [path.resolve(SOURCE_DIRECTORY, entry)];
	while (pending.length > 0) {
		const file = pending.pop();
		if (file === undefined || visited.has(file)) {
			continue;
		}
		visited.add(file);
		const source = readFileSync(file, 'utf8');
		const specifiers = [
			...source.matchAll(STATIC_IMPORT),
			...source.matchAll(DYNAMIC_IMPORT),
		].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
		for (const specifier of specifiers) {
			const resolved = resolveSpecifier(specifier, file);
			if (resolved === undefined) {
				visited.add(`package:${specifier}`);
			} else {
				pending.push(resolved);
			}
		}
	}
	return [...visited];
}
