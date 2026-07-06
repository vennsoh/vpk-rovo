import type { ClickyPointTarget } from "@/components/projects/rovo-core/hooks/use-clicky";
import type { StudioScreenAssistantTarget } from "@/components/projects/rovo-core/lib/screen-assistant";

// Viewport center point for a grounded target. Mirrors the route-neutral
// geometry used by the Studio shell's point_at_target handler.
export function viewportPointFromTarget(
	target: StudioScreenAssistantTarget | null | undefined,
): ClickyPointTarget | null {
	if (!target?.rect) {
		return null;
	}
	return {
		x: target.rect.x + target.rect.width / 2,
		y: target.rect.y + target.rect.height / 2,
		label: target.label ?? target.fieldId ?? target.id ?? "Target",
		coordinateSpace: "viewport",
	};
}
