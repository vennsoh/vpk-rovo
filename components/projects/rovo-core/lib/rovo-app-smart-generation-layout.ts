export type RovoAppSmartWidthClass = "compact" | "regular" | "wide";
export type RovoAppSmartGenerationSurface = "rovo" | "rovo-preview";

interface RovoAppSmartGenerationLayoutInput {
	shellWidth?: number | null;
	viewportWidth?: number | null;
}

export interface RovoAppSmartGenerationLayoutContext {
	containerWidthPx?: number;
	viewportWidthPx?: number;
	widthClass?: RovoAppSmartWidthClass;
}

export interface RovoAppSmartGenerationRequest {
	enabled: true;
	surface: RovoAppSmartGenerationSurface;
	containerWidthPx?: number;
	viewportWidthPx?: number;
	widthClass?: RovoAppSmartWidthClass;
}

interface RovoAppSmartGenerationRequestInput {
	embedded: boolean;
	layout?: RovoAppSmartGenerationLayoutContext | null;
}

function normalizeWidth(value: number | null | undefined): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return null;
	}

	return Math.max(1, Math.round(value));
}

export function getRovoAppSmartWidthClass(widthPx: number): RovoAppSmartWidthClass {
	if (widthPx <= 520) {
		return "compact";
	}

	if (widthPx <= 900) {
		return "regular";
	}

	return "wide";
}

export function getRovoAppSmartGenerationLayoutContext(
	input: RovoAppSmartGenerationLayoutInput,
): RovoAppSmartGenerationLayoutContext {
	const containerWidthPx = normalizeWidth(input.shellWidth);
	const viewportWidthPx = normalizeWidth(input.viewportWidth);
	const widthSource = containerWidthPx ?? viewportWidthPx;

	return {
		containerWidthPx: containerWidthPx ?? undefined,
		viewportWidthPx: viewportWidthPx ?? undefined,
		widthClass:
			typeof widthSource === "number"
				? getRovoAppSmartWidthClass(widthSource)
				: undefined,
	};
}

export function buildRovoAppSmartGenerationRequest({
	embedded,
	layout,
}: RovoAppSmartGenerationRequestInput): RovoAppSmartGenerationRequest {
	return {
		enabled: true,
		surface: embedded ? "rovo-preview" : "rovo",
		containerWidthPx: layout?.containerWidthPx,
		viewportWidthPx: layout?.viewportWidthPx,
		widthClass: layout?.widthClass,
	};
}
