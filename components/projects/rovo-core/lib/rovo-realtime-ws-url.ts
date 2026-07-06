const WS_ENDPOINT = "/api/realtime/audio-conversation";
const WS_URL_DISCOVERY_ENDPOINT = "/api/realtime/ws-url";
const WS_TOKEN_ENDPOINT = "/api/realtime/audio-conversation-token";

/** Cached backend WS base URL so we only fetch once per page load. */
let cachedWsBaseUrl: string | null = null;

type RealtimeWsFetch = typeof fetch;
type RealtimeWsLocation = Pick<Location, "host" | "protocol">;

export interface BuildRealtimeWsUrlOptions {
	fetcher?: RealtimeWsFetch;
	location?: RealtimeWsLocation;
}

export async function fetchRealtimeSocketToken(
	fetcher: RealtimeWsFetch = fetch,
): Promise<string | null> {
	try {
		const res = await fetcher(WS_TOKEN_ENDPOINT, { cache: "no-store" });
		if (!res.ok) {
			return null;
		}

		const data = (await res.json()) as { token?: unknown };
		return typeof data.token === "string" && data.token.trim()
			? data.token.trim()
			: null;
	} catch {
		return null;
	}
}

export function appendRealtimeSocketToken(url: string, token: string | null): string {
	if (!token) {
		return url;
	}

	const resolvedUrl = new URL(url);
	resolvedUrl.searchParams.set("realtimeToken", token);
	return resolvedUrl.toString();
}

/**
 * Resolve the backend WebSocket URL.
 *
 * In dev mode Next.js cannot proxy WebSocket upgrades, so we ask the server
 * for the direct Express backend URL via a lightweight API route that reads
 * the `.dev-backend-port` file server-side. In production the backend serves
 * the app directly, so same-origin works.
 */
export async function buildRealtimeWsUrl({
	fetcher = fetch,
	location = window.location,
}: BuildRealtimeWsUrlOptions = {}): Promise<string> {
	let wsUrl: string | null = null;
	if (cachedWsBaseUrl) {
		wsUrl = `${cachedWsBaseUrl}${WS_ENDPOINT}`;
	} else {
		try {
			const res = await fetcher(WS_URL_DISCOVERY_ENDPOINT);
			if (res.ok) {
				const data = (await res.json()) as { wsUrl?: string };
				if (data.wsUrl) {
					cachedWsBaseUrl = data.wsUrl;
					wsUrl = `${data.wsUrl}${WS_ENDPOINT}`;
				}
			}
		} catch {
			// Fall through to same-origin default.
		}
	}

	if (!wsUrl) {
		const protocol = location.protocol === "https:" ? "wss:" : "ws:";
		wsUrl = `${protocol}//${location.host}${WS_ENDPOINT}`;
	}

	return appendRealtimeSocketToken(wsUrl, await fetchRealtimeSocketToken(fetcher));
}
