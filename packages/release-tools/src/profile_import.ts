import { runImportProfile } from './run_import_profile.ts';

const [archiveFile, name] = process.argv.slice(2);

try {
	if (archiveFile === undefined) {
		throw new Error(
			'Usage: pnpm profile:import <path.streamDeckProfile> [name]'
		);
	}
	const directory = await runImportProfile({
		archiveFile,
		name,
		workingDirectory: process.env['INIT_CWD'] ?? process.cwd(),
	});
	console.log(`Imported the profile into ${directory}`);
	console.log('Run `mise x -- pnpm format` to format the imported files.');
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
