const LOCALHOST_SUFFIX = ".localhost";
const DOCUMENT_TITLE_PREFIX_SEPARATOR = ":";
const LEGACY_DOCUMENT_TITLE_PREFIX_SEPARATOR = " — ";
const UNPREFIXED_DOCUMENT_TITLES = new Set(["⚠ Keep this page active"]);

export type DocumentTitleLocation = {
	host?: string | null;
	hostname?: string | null;
};

function normalizeString(value: string | null | undefined): string {
	return typeof value === "string" ? value.trim() : "";
}

function stripLocalhostSuffix(host: string, hostname: string): string {
	const suffixIndex = host.indexOf(LOCALHOST_SUFFIX);

	if (suffixIndex > 0) {
		return `${host.slice(0, suffixIndex)}${host.slice(suffixIndex + LOCALHOST_SUFFIX.length)}`;
	}

	return hostname.slice(0, -LOCALHOST_SUFFIX.length);
}

export function getDocumentTitlePrefix(location: DocumentTitleLocation): string | null {
	const hostname = normalizeString(location.hostname);
	const host = normalizeString(location.host) || hostname;

	if (!host && !hostname) {
		return null;
	}

	if (hostname.endsWith(LOCALHOST_SUFFIX)) {
		return stripLocalhostSuffix(host, hostname) || host || hostname;
	}

	return host || hostname;
}

export function stripDocumentTitlePrefix(title: string, prefix: string): string {
	const normalizedTitle = normalizeString(title);
	const normalizedPrefix = normalizeString(prefix);

	if (!normalizedTitle || !normalizedPrefix) {
		return normalizedTitle;
	}

	if (normalizedTitle === normalizedPrefix) {
		return "";
	}

	for (const separator of [DOCUMENT_TITLE_PREFIX_SEPARATOR, LEGACY_DOCUMENT_TITLE_PREFIX_SEPARATOR]) {
		const prefixWithSeparator = `${normalizedPrefix}${separator}`;
		if (normalizedTitle.startsWith(prefixWithSeparator)) {
			return normalizedTitle.slice(prefixWithSeparator.length).trim();
		}
	}

	return normalizedTitle;
}

export function formatDocumentTitleWithPrefix(title: string, prefix: string): string {
	const normalizedPrefix = normalizeString(prefix);

	if (!normalizedPrefix) {
		return normalizeString(title);
	}

	const baseTitle = stripDocumentTitlePrefix(title, normalizedPrefix);

	if (UNPREFIXED_DOCUMENT_TITLES.has(baseTitle)) {
		return baseTitle;
	}

	return baseTitle
		? `${normalizedPrefix}${DOCUMENT_TITLE_PREFIX_SEPARATOR}${baseTitle}`
		: normalizedPrefix;
}
