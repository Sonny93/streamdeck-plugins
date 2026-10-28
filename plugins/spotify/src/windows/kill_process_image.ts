import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

import { ProcessKillError } from './process_kill_error';

const execFileAsync = promisify(execFile);

/** Force-kills every process of the given executable image (e.g. `Spotify.exe`) together with its child processes. */
export async function killProcessImage(imageName: string): Promise<void> {
	try {
		await execFileAsync('taskkill', ['/IM', imageName, '/T', '/F'], {
			windowsHide: true,
		});
	} catch (error) {
		throw new ProcessKillError({ imageName, cause: error });
	}
}
