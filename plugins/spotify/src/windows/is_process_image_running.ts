import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { isImageInTasklistOutput } from './is_image_in_tasklist_output';
import { ProcessListError } from './process_list_error';

const execFileAsync = promisify(execFile);

/** Tells whether at least one process of the given executable image (e.g. `Spotify.exe`) is running. */
export async function isProcessImageRunning(
	imageName: string
): Promise<boolean> {
	try {
		const { stdout } = await execFileAsync(
			'tasklist',
			['/FI', `IMAGENAME eq ${imageName}`, '/FO', 'CSV', '/NH'],
			{ windowsHide: true }
		);
		return isImageInTasklistOutput({ output: stdout, imageName });
	} catch (error) {
		throw new ProcessListError({ imageName, cause: error });
	}
}
