import fs from 'node:fs';
import path from 'node:path';

const SCRIPT_NAME = 'language_inspector.js';

/**
 * Copies the browser script of the language select to a folder of a plugin build (its `bin` folder).
 * deck-kit keeps the only copy of the script, and the property inspector pages load the one in `bin`, which git ignores.
 * It is called from the build of each plugin, so the plugin and the script always come from the same deck-kit.
 */
export function copyLanguageInspector(destinationDirectory: string): void {
	fs.mkdirSync(destinationDirectory, { recursive: true });
	fs.copyFileSync(
		path.join(import.meta.dirname, SCRIPT_NAME),
		path.join(destinationDirectory, SCRIPT_NAME)
	);
}
