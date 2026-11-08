import { compareCodeUnits } from './compare_code_units.ts';

/** Lists every non-empty subset of the plugins, each sorted: the whole set first, then the larger subsets before the smaller ones. */
export function listPluginSubsets(
	options: Readonly<{ plugins: readonly string[] }>
): string[][] {
	const plugins = [...options.plugins].sort(compareCodeUnits);
	const subsets = Array.from({ length: 2 ** plugins.length - 1 }, (_, index) =>
		plugins.filter((_plugin, position) => ((index + 1) >> position) % 2 === 1)
	);
	return subsets.sort(
		(first, second) =>
			second.length - first.length ||
			compareCodeUnits(first.join(), second.join())
	);
}
