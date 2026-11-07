import { runPackageRelease } from './run_package_release.ts';

try {
	const files = await runPackageRelease();
	console.log(files.join('\n'));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
