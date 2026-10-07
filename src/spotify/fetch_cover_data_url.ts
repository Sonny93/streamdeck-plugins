import { SpotifyCoverFetchError } from './spotify_cover_fetch_error';

const COVER_FETCH_TIMEOUT_MILLISECONDS = 5_000;
const IMAGE_CONTENT_TYPE_PREFIX = 'image/';
const CONTENT_TYPE_PARAMETER_SEPARATOR = ';';

async function fetchCoverResponse(url: string): Promise<Response> {
	try {
		return await fetch(url, {
			signal: AbortSignal.timeout(COVER_FETCH_TIMEOUT_MILLISECONDS),
		});
	} catch (error) {
		throw new SpotifyCoverFetchError({
			url,
			reason: 'the request failed',
			cause: error,
		});
	}
}

function readImageContentType(url: string, response: Response): string {
	const [contentType = ''] = (response.headers.get('content-type') ?? '')
		.split(CONTENT_TYPE_PARAMETER_SEPARATOR)
		.map((part) => part.trim().toLowerCase());
	if (!contentType.startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
		throw new SpotifyCoverFetchError({
			url,
			reason: `the content type "${contentType}" is not an image`,
		});
	}
	return contentType;
}

/** Downloads a cover and returns it as a `data:` URL that Stream Deck can display. */
export async function fetchCoverDataUrl(url: string): Promise<string> {
	const response = await fetchCoverResponse(url);
	if (!response.ok) {
		throw new SpotifyCoverFetchError({
			url,
			reason: `answered HTTP ${response.status}`,
		});
	}
	const contentType = readImageContentType(url, response);
	const bytes = Buffer.from(await response.arrayBuffer());
	return `data:${contentType};base64,${bytes.toString('base64')}`;
}
