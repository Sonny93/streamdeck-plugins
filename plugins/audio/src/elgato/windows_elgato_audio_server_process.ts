import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { ElgatoAudioProcessError } from './elgato_audio_process_error';
import { ELGATO_AUDIO_SERVER_IMAGE_NAME } from './elgato_audio_server_image_name';
import type { ElgatoAudioServerProcess } from './elgato_audio_server_process';
import { ElgatoAudioTiming } from './elgato_audio_timing';
import { isImageListed } from './is_image_listed';
import { resolveSystemToolPath } from './resolve_system_tool_path';

const execFileAsync = promisify(execFile);

async function runTool(
	toolName: string,
	args: readonly string[]
): Promise<string> {
	const { stdout } = await execFileAsync(
		resolveSystemToolPath(toolName),
		args,
		{
			windowsHide: true,
			timeout: ElgatoAudioTiming.toolTimeoutMilliseconds,
		}
	);
	return stdout;
}

/** The Elgato audio server process of Windows, reached through `tasklist.exe` and `taskkill.exe` without a shell. */
export const windowsElgatoAudioServerProcess: ElgatoAudioServerProcess = {
	async isRunning() {
		try {
			const output = await runTool('tasklist.exe', [
				'/fi',
				`IMAGENAME eq ${ELGATO_AUDIO_SERVER_IMAGE_NAME}`,
				'/fo',
				'csv',
				'/nh',
			]);
			return isImageListed(output, ELGATO_AUDIO_SERVER_IMAGE_NAME);
		} catch (error) {
			throw new ElgatoAudioProcessError('list', error);
		}
	},
	async kill() {
		try {
			await runTool('taskkill.exe', [
				'/im',
				ELGATO_AUDIO_SERVER_IMAGE_NAME,
				'/f',
			]);
		} catch (error) {
			throw new ElgatoAudioProcessError('kill', error);
		}
	},
};
