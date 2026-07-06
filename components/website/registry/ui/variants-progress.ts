import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const UI_PROGRESS_VARIANT_DEMOS: Record<string, ComponentType> = {
	// Progress Tracker
	"progress-tracker-demo-default": dynamic(
		() =>
			import("../../demos/ui/progress-tracker-demo").then((mod) => ({
				default: mod.ProgressTrackerDemoDefault,
			})),
		{ ssr: false },
	),
	"progress-tracker-demo-all-done": dynamic(
		() =>
			import("../../demos/ui/progress-tracker-demo").then((mod) => ({
				default: mod.ProgressTrackerDemoAllDone,
			})),
		{ ssr: false },
	),
	"progress-tracker-demo-all-todo": dynamic(
		() =>
			import("../../demos/ui/progress-tracker-demo").then((mod) => ({
				default: mod.ProgressTrackerDemoAllTodo,
			})),
		{ ssr: false },
	),
	"progress-tracker-demo-activity-timeline": dynamic(
		() =>
			import("../../demos/ui/progress-tracker-demo").then((mod) => ({
				default: mod.ProgressTrackerDemoActivityTimeline,
			})),
		{ ssr: false },
	),
	// Split Button
	"split-button-demo-default": dynamic(
		() =>
			import("../../demos/ui/split-button-demo").then((mod) => ({
				default: mod.SplitButtonDemoDefault,
			})),
		{ ssr: false },
	),
	"split-button-demo-outline": dynamic(
		() =>
			import("../../demos/ui/split-button-demo").then((mod) => ({
				default: mod.SplitButtonDemoOutline,
			})),
		{ ssr: false },
	),
	"split-button-demo-destructive": dynamic(
		() =>
			import("../../demos/ui/split-button-demo").then((mod) => ({
				default: mod.SplitButtonDemoDestructive,
			})),
		{ ssr: false },
	),
	"split-button-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/split-button-demo").then((mod) => ({
				default: mod.SplitButtonDemoDisabled,
			})),
		{ ssr: false },
	),
	"split-button-demo-variants": dynamic(
		() =>
			import("../../demos/ui/split-button-demo").then((mod) => ({
				default: mod.SplitButtonDemoVariants,
			})),
		{ ssr: false },
	),
	// Tag
	"tag-demo-default": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoDefault,
			})),
		{ ssr: false },
	),
	"tag-demo-removable": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoRemovable,
			})),
		{ ssr: false },
	),
	"tag-demo-front-slot": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoFrontSlot,
			})),
		{ ssr: false },
	),
	"tag-demo-editor-tag": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoEditorTag,
			})),
		{ ssr: false },
	),
	"tag-demo-badge": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoBadge,
			})),
		{ ssr: false },
	),
	"tag-demo-removable-overlay": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoRemovableOverlay,
			})),
		{ ssr: false },
	),
	"tag-demo-variants": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoVariants,
			})),
		{ ssr: false },
	),
	"tag-demo-removable-variants": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoRemovableVariants,
			})),
		{ ssr: false },
	),
	"tag-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoDisabled,
			})),
		{ ssr: false },
	),
	"tag-demo-colors": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoColors,
			})),
		{ ssr: false },
	),
	"tag-demo-rounded": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoRounded,
			})),
		{ ssr: false },
	),
	"tag-demo-avatar-tags": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoAvatarTags,
			})),
		{ ssr: false },
	),
	"tag-demo-tag-group": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoTagGroup,
			})),
		{ ssr: false },
	),
	"tag-demo-tag-group-removable": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoTagGroupRemovable,
			})),
		{ ssr: false },
	),
	"tag-demo-tag-group-variants": dynamic(
		() =>
			import("../../demos/ui/tag-demo").then((mod) => ({
				default: mod.TagDemoTagGroupVariants,
			})),
		{ ssr: false },
	),
	// Time Picker
	"time-picker-demo-default": dynamic(
		() =>
			import("../../demos/ui/time-picker-demo").then((mod) => ({
				default: mod.TimePickerDemoDefault,
			})),
		{ ssr: false },
	),
	"time-picker-demo-with-value": dynamic(
		() =>
			import("../../demos/ui/time-picker-demo").then((mod) => ({
				default: mod.TimePickerDemoWithValue,
			})),
		{ ssr: false },
	),
	"time-picker-demo-15-min": dynamic(
		() =>
			import("../../demos/ui/time-picker-demo").then((mod) => ({
				default: mod.TimePickerDemo15Min,
			})),
		{ ssr: false },
	),
	"time-picker-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/time-picker-demo").then((mod) => ({
				default: mod.TimePickerDemoDisabled,
			})),
		{ ssr: false },
	),
	// Tile
	"tile-demo-default": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoDefault,
			})),
		{ ssr: false },
	),
	"tile-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoSizes,
			})),
		{ ssr: false },
	),
	"tile-demo-transparent": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoTransparent,
			})),
		{ ssr: false },
	),
	"tile-demo-appearances": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoAppearances,
			})),
		{ ssr: false },
	),
	"tile-demo-border": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoBorder,
			})),
		{ ssr: false },
	),
	"tile-demo-inset": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoInset,
			})),
		{ ssr: false },
	),
	"tile-demo-snug": dynamic(
		() =>
			import("../../demos/ui/tile-demo").then((mod) => ({
				default: mod.TileDemoSnug,
			})),
		{ ssr: false },
	),
	// Date Time Picker
	"date-time-picker-demo-default": dynamic(
		() =>
			import("../../demos/ui/date-time-picker-demo").then((mod) => ({
				default: mod.DateTimePickerDemoDefault,
			})),
		{ ssr: false },
	),
	"date-time-picker-demo-with-value": dynamic(
		() =>
			import("../../demos/ui/date-time-picker-demo").then((mod) => ({
				default: mod.DateTimePickerDemoWithValue,
			})),
		{ ssr: false },
	),
	"date-time-picker-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/date-time-picker-demo").then((mod) => ({
				default: mod.DateTimePickerDemoDisabled,
			})),
		{ ssr: false },
	),
};
