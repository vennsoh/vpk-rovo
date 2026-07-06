import type { Spec } from "@json-render/react";
import type { ThinkingToolCallSummary } from "@/lib/rovo-ui-messages";
import type { ParsedGenerativeWidget, PreviewBody } from "@/components/projects/shared/lib/generative-widget";

type JsonRenderPreviewBody = Extract<PreviewBody, { kind: "json-render" }>;

const SYSTEM_INSTRUCTIONS_BLOCK_PATTERN =
	/\[\s*System Instructions\s*\][\s\S]*?\[\s*End System Instructions\s*\]/gi;
const SYSTEM_INSTRUCTIONS_MARKER_PATTERN =
	/\[\s*(?:End\s+)?System Instructions\s*\]/gi;
const LEAKED_SYSTEM_PROMPT_PATTERN =
	/^you are (?:an?|the)\s+(?:ui generator|helpful assistant)\b/i;
const PROFILE_PHOTO_EXPLICIT_KEYS = new Set([
	"avatar",
	"avatarurl",
	"avatarsrc",
	"image",
	"imageurl",
	"photo",
	"photourl",
	"picture",
	"pictureurl",
	"profileimage",
	"profilephoto",
	"profilepicture",
]);
const PERSON_NAME_TOKEN_BLACKLIST = new Set([
	"area",
	"areas",
	"calendar",
	"details",
	"directs",
	"focus",
	"key",
	"manager",
	"org",
	"organization",
	"overview",
	"partners",
	"profile",
	"project",
	"projects",
	"reports",
	"ritual",
	"rituals",
	"summary",
	"team",
	"teams",
]);
const IMAGE_URL_PATTERN = /https?:\/\/[^\s<>"')\]}]+/gi;
const IMAGE_FILE_EXTENSION_PATTERN =
	/\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:$|[?#])/i;
const ATLASSIAN_HOST_PATTERN = /(^|\.)atlassian\.net$/i;

type ProfilePhotoObservation = Pick<
	ThinkingToolCallSummary,
	"toolName" | "state" | "output" | "outputPreview"
>;

interface ProfilePhotoTarget {
	avatarKey: string;
	name: string;
}

interface ProfilePhotoCandidate {
	url: string;
	score: number;
	isExplicit: boolean;
}

function isJsonRenderBody(body: PreviewBody): body is JsonRenderPreviewBody {
	return body.kind === "json-render";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function stripSystemInstructionArtifacts(value: string): string {
	return value
		.replace(SYSTEM_INSTRUCTIONS_BLOCK_PATTERN, " ")
		.replace(SYSTEM_INSTRUCTIONS_MARKER_PATTERN, " ");
}

function getNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = stripSystemInstructionArtifacts(value).trim();
	if (LEAKED_SYSTEM_PROMPT_PATTERN.test(trimmed)) {
		return undefined;
	}
	return trimmed.length > 0 ? trimmed : undefined;
}

function getElementProps(element: Record<string, unknown>): Record<string, unknown> | null {
	return isObjectRecord(element.props) ? element.props : null;
}

function getSpecTraversalKeys(spec: Spec): string[] {
	const keys: string[] = [];
	const visited = new Set<string>();
	const elements = spec.elements ?? {};

	const visit = (key: string) => {
		if (!key || visited.has(key)) {
			return;
		}

		visited.add(key);
		keys.push(key);

		const element = elements[key];
		if (!isObjectRecord(element) || !Array.isArray(element.children)) {
			return;
		}

		for (const childKey of element.children) {
			if (typeof childKey === "string" && childKey.trim().length > 0) {
				visit(childKey);
			}
		}
	};

	visit(spec.root);
	for (const key of Object.keys(elements)) {
		visit(key);
	}

	return keys;
}

function normalizeImageCandidateUrl(value: string): string | null {
	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	return trimmedValue.replace(/[),.;:!?]+$/g, "");
}

function normalizeProfileText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function normalizeProfileTokens(value: string): string[] {
	return normalizeProfileText(value)
		.split(/\s+/)
		.filter(Boolean);
}

function safeDecodeURIComponent(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function isHttpUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

function isAtlassianHost(hostname: string): boolean {
	return ATLASSIAN_HOST_PATTERN.test(hostname.toLowerCase());
}

function isAtlassianImageUrl(value: string): boolean {
	try {
		const parsedUrl = new URL(value);
		if (!isAtlassianHost(parsedUrl.hostname)) {
			return false;
		}

		if (/\/wiki\/pages\/viewpageattachments\.action$/i.test(parsedUrl.pathname)) {
			const previewValue = safeDecodeURIComponent(
				parsedUrl.searchParams.get("preview") ?? "",
			);
			return IMAGE_FILE_EXTENSION_PATTERN.test(previewValue);
		}

		if (/\/wiki\/download\/attachments\//i.test(parsedUrl.pathname)) {
			return IMAGE_FILE_EXTENSION_PATTERN.test(parsedUrl.pathname);
		}

		return /\/secure\/(?:view|user)avatar/i.test(parsedUrl.pathname);
	} catch {
		return false;
	}
}

function isLikelyImageUrl(value: string): boolean {
	return IMAGE_FILE_EXTENSION_PATTERN.test(value) || isAtlassianImageUrl(value);
}

function extractUrlsFromText(value: string): string[] {
	const matches = value.match(IMAGE_URL_PATTERN);
	if (!Array.isArray(matches)) {
		return [];
	}

	return matches
		.map((match) => normalizeImageCandidateUrl(match))
		.filter((url): url is string => Boolean(url));
}

function looksLikePersonName(value: string): boolean {
	if (/[:/|]|\d/.test(value)) {
		return false;
	}

	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length < 2 || parts.length > 4) {
		return false;
	}

	let hasLongToken = false;
	for (const part of parts) {
		if (!/^[A-Z][A-Za-z'\u2019.-]*$/.test(part) && !/^[A-Z]{2,}$/.test(part)) {
			return false;
		}

		if (PERSON_NAME_TOKEN_BLACKLIST.has(part.toLowerCase())) {
			return false;
		}

		if (part.length >= 3) {
			hasLongToken = true;
		}
	}

	return hasLongToken;
}

function buildSpecParentMap(spec: Spec): Map<string, string> {
	const parentByChild = new Map<string, string>();

	for (const [key, element] of Object.entries(spec.elements ?? {})) {
		if (!isObjectRecord(element) || !Array.isArray(element.children)) {
			continue;
		}

		for (const childKey of element.children) {
			if (typeof childKey !== "string" || childKey.trim().length === 0) {
				continue;
			}

			if (!parentByChild.has(childKey)) {
				parentByChild.set(childKey, key);
			}
		}
	}

	return parentByChild;
}

function findPersonNameInSubtree(
	spec: Spec,
	rootKey: string,
	maxDepth = 3,
	skipKeys: ReadonlySet<string> = new Set(),
): string | null {
	const queue: Array<{ key: string; depth: number }> = [{ key: rootKey, depth: 0 }];
	const visited = new Set<string>();
	let bestCandidate: { name: string; score: number } | null = null;

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || visited.has(current.key) || skipKeys.has(current.key)) {
			continue;
		}

		visited.add(current.key);
		const element = spec.elements?.[current.key];
		if (!isObjectRecord(element)) {
			continue;
		}

		const elementType = getNonEmptyString(element.type);
		const props = getElementProps(element);
		if (elementType && props) {
			const candidateTexts = [
				elementType === "Heading" ? getNonEmptyString(props.text) : undefined,
				elementType === "PageHeader" ? getNonEmptyString(props.title) : undefined,
				elementType === "Card" ? getNonEmptyString(props.title) : undefined,
				elementType === "Text" ? getNonEmptyString(props.content) : undefined,
			].filter((candidate): candidate is string => Boolean(candidate));

			for (const candidateText of candidateTexts) {
				if (!looksLikePersonName(candidateText)) {
					continue;
				}

				const score =
					(elementType === "Heading"
						? 200
						: elementType === "PageHeader"
							? 180
							: elementType === "Card"
								? 150
								: 120) - current.depth * 12;
				if (!bestCandidate || score > bestCandidate.score) {
					bestCandidate = {
						name: candidateText,
						score,
					};
				}
			}
		}

		if (current.depth >= maxDepth || !Array.isArray(element.children)) {
			continue;
		}

		for (const childKey of element.children) {
			if (typeof childKey === "string" && childKey.trim().length > 0) {
				queue.push({ key: childKey, depth: current.depth + 1 });
			}
		}
	}

	return bestCandidate?.name ?? null;
}

function findProfilePhotoTarget(spec: Spec): ProfilePhotoTarget | null {
	const parentByChild = buildSpecParentMap(spec);

	for (const key of getSpecTraversalKeys(spec)) {
		const element = spec.elements[key];
		if (!isObjectRecord(element) || getNonEmptyString(element.type) !== "Avatar") {
			continue;
		}

		const props = getElementProps(element);
		if (!props || getNonEmptyString(props.src)) {
			continue;
		}

		const parentKey = parentByChild.get(key);
		if (!parentKey) {
			continue;
		}

		const parentElement = spec.elements[parentKey];
		if (!isObjectRecord(parentElement) || !Array.isArray(parentElement.children)) {
			continue;
		}

		const siblingKeys = parentElement.children.filter(
			(childKey): childKey is string =>
				typeof childKey === "string" &&
				childKey.trim().length > 0 &&
				childKey !== key,
		);

		for (const siblingKey of siblingKeys) {
			const name = findPersonNameInSubtree(spec, siblingKey);
			if (name) {
				return {
					avatarKey: key,
					name,
				};
			}
		}

		const name = findPersonNameInSubtree(
			spec,
			parentKey,
			4,
			new Set([key]),
		);
		if (name) {
			return {
				avatarKey: key,
				name,
			};
		}
	}

	return null;
}

function collectObservationSearchText(observation: ProfilePhotoObservation): string {
	const searchParts = [
		getNonEmptyString(observation.toolName),
		getNonEmptyString(observation.outputPreview),
	];

	if (observation.output !== undefined) {
		try {
			searchParts.push(JSON.stringify(observation.output));
		} catch {
			// Ignore non-serializable outputs.
		}
	}

	return searchParts
		.filter((part): part is string => Boolean(part))
		.join(" ");
}

function scoreProfilePhotoCandidate({
	url,
	isExplicit,
	observationNameMatch,
	urlNameMatch,
}: Readonly<{
	url: string;
	isExplicit: boolean;
	observationNameMatch: boolean;
	urlNameMatch: boolean;
}>): number {
	let score = 0;

	if (isExplicit) {
		score += 320;
	}

	if (observationNameMatch) {
		score += 120;
	}
	if (urlNameMatch) {
		score += 180;
	}

	const normalizedUrl = normalizeProfileText(safeDecodeURIComponent(url));
	if (normalizedUrl.includes("headshot")) {
		score += 180;
	}
	if (normalizedUrl.includes("avatar")) {
		score += 60;
	}

	if (IMAGE_FILE_EXTENSION_PATTERN.test(url)) {
		score += 40;
	}

	if (isAtlassianImageUrl(url)) {
		score += 140;
	}

	return score;
}

function collectProfilePhotoCandidates(
	value: unknown,
	candidatesByUrl: Map<string, ProfilePhotoCandidate>,
	path = "",
): void {
	if (value === null || value === undefined) {
		return;
	}

	if (typeof value === "string") {
		for (const url of extractUrlsFromText(value)) {
			if (!isLikelyImageUrl(url)) {
				continue;
			}

			const score = scoreProfilePhotoCandidate({
				url,
				isExplicit: false,
				observationNameMatch: false,
				urlNameMatch: false,
			});
			const existing = candidatesByUrl.get(url);
			if (!existing || score > existing.score) {
				candidatesByUrl.set(url, {
					url,
					score,
					isExplicit: false,
				});
			}
		}
		return;
	}

	if (Array.isArray(value)) {
		for (let index = 0; index < value.length; index += 1) {
			collectProfilePhotoCandidates(
				value[index],
				candidatesByUrl,
				path ? `${path}[${index}]` : `[${index}]`,
			);
		}
		return;
	}

	if (!isObjectRecord(value)) {
		return;
	}

	for (const [key, nestedValue] of Object.entries(value)) {
		const nextPath = path ? `${path}.${key}` : key;
		const normalizedKey = key.replace(/[^a-z0-9]+/gi, "").toLowerCase();
		const isExplicitKey = PROFILE_PHOTO_EXPLICIT_KEYS.has(normalizedKey);

		if (
			isExplicitKey &&
			typeof nestedValue === "string" &&
			isHttpUrl(nestedValue)
		) {
			const url = normalizeImageCandidateUrl(nestedValue);
			if (url) {
				const score = scoreProfilePhotoCandidate({
					url,
					isExplicit: true,
					observationNameMatch: false,
					urlNameMatch: false,
				});
				const existing = candidatesByUrl.get(url);
				if (!existing || score > existing.score) {
					candidatesByUrl.set(url, {
						url,
						score,
						isExplicit: true,
					});
				}
			}
		}

		collectProfilePhotoCandidates(nestedValue, candidatesByUrl, nextPath);
	}
}

function findBestProfilePhotoUrl(
	targetName: string,
	observations: readonly ProfilePhotoObservation[],
): string | null {
	const nameTokens = normalizeProfileTokens(targetName);
	if (nameTokens.length === 0) {
		return null;
	}

	const candidatesByUrl = new Map<string, ProfilePhotoCandidate>();

	for (const observation of observations) {
		if (observation.state === "error") {
			continue;
		}

		const searchText = normalizeProfileText(
			collectObservationSearchText(observation),
		);
		const observationNameMatch = nameTokens.every((token) =>
			searchText.includes(token),
		);
		const localCandidates = new Map<string, ProfilePhotoCandidate>();

		collectProfilePhotoCandidates(observation.output, localCandidates);
		collectProfilePhotoCandidates(observation.outputPreview, localCandidates);

		for (const candidate of localCandidates.values()) {
			const normalizedCandidateUrl = normalizeProfileText(
				safeDecodeURIComponent(candidate.url),
			);
			const urlNameMatch = nameTokens.every((token) =>
				normalizedCandidateUrl.includes(token),
			);
			if (!candidate.isExplicit && !observationNameMatch && !urlNameMatch) {
				continue;
			}

			const rescoredCandidate = {
				url: candidate.url,
				score: scoreProfilePhotoCandidate({
					url: candidate.url,
					isExplicit: candidate.isExplicit,
					observationNameMatch,
					urlNameMatch,
				}),
				isExplicit: candidate.isExplicit,
			};
			const existing = candidatesByUrl.get(candidate.url);
			if (!existing || rescoredCandidate.score > existing.score) {
				candidatesByUrl.set(candidate.url, rescoredCandidate);
			}
		}
	}

	let bestCandidate: ProfilePhotoCandidate | null = null;
	for (const candidate of candidatesByUrl.values()) {
		if (candidate.score < 200) {
			continue;
		}

		if (!bestCandidate || candidate.score > bestCandidate.score) {
			bestCandidate = candidate;
		}
	}

	return bestCandidate?.url ?? null;
}

export function enrichGenerativeWidgetProfilePhotos(
	widget: ParsedGenerativeWidget,
	observations: readonly ProfilePhotoObservation[] = [],
): ParsedGenerativeWidget {
	if (!isJsonRenderBody(widget.body) || observations.length === 0) {
		return widget;
	}

	const profileTarget = findProfilePhotoTarget(widget.body.spec);
	if (!profileTarget) {
		return widget;
	}

	const photoUrl = findBestProfilePhotoUrl(profileTarget.name, observations);
	if (!photoUrl) {
		return widget;
	}

	const avatarElement = widget.body.spec.elements?.[profileTarget.avatarKey];
	if (!isObjectRecord(avatarElement)) {
		return widget;
	}

	const avatarProps = getElementProps(avatarElement);
	if (!avatarProps || getNonEmptyString(avatarProps.src)) {
		return widget;
	}

	return {
		...widget,
		body: {
			...widget.body,
			spec: {
				...widget.body.spec,
				elements: {
					...widget.body.spec.elements,
					[profileTarget.avatarKey]: {
						...avatarElement,
						props: {
							...avatarProps,
							src: photoUrl,
						},
					},
				},
			},
		},
	};
}
