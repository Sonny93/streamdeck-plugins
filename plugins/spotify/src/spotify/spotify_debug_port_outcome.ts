/** Result of the startup check of Spotify's DevTools port: already open, Spotify not running, or Spotify restarted with the debug flag. */
export type SpotifyDebugPortOutcome =
	| 'already-open'
	| 'spotify-not-running'
	| 'restarted';
