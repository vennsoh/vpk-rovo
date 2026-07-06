import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const UI_OVERLAY_VARIANT_DEMOS: Record<string, ComponentType> = {
	// Dialog
	"dialog-demo-default": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoDefault,
			})),
		{ ssr: false },
	),
	"dialog-demo-form": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoForm,
			})),
		{ ssr: false },
	),
	"dialog-demo-no-close": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoNoClose,
			})),
		{ ssr: false },
	),
	"dialog-demo-custom-width": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoCustomWidth,
			})),
		{ ssr: false },
	),
	"dialog-demo-chat-settings": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoChatSettings,
			})),
		{ ssr: false },
	),
	"dialog-demo-no-close-button": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoNoCloseButton,
			})),
		{ ssr: false },
	),
	"dialog-demo-scrollable-content": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoScrollableContent,
			})),
		{ ssr: false },
	),
	"dialog-demo-with-form": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoWithForm,
			})),
		{ ssr: false },
	),
	"dialog-demo-with-sticky-footer": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoWithStickyFooter,
			})),
		{ ssr: false },
	),
	"dialog-demo-warning": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoWarning,
			})),
		{ ssr: false },
	),
	"dialog-demo-destructive": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoDestructive,
			})),
		{ ssr: false },
	),
	"dialog-demo-widths": dynamic(
		() =>
			import("../../demos/ui/dialog-demo").then((mod) => ({
				default: mod.DialogDemoWidths,
			})),
		{ ssr: false },
	),
	// Tabs
	"tabs-demo-default": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoDefault,
			})),
		{ ssr: false },
	),
	"tabs-demo-line": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoLine,
			})),
		{ ssr: false },
	),
	"tabs-demo-vertical": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoVertical,
			})),
		{ ssr: false },
	),
	"tabs-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoDisabled,
			})),
		{ ssr: false },
	),
	"tabs-demo-basic": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoBasic,
			})),
		{ ssr: false },
	),
	"tabs-demo-icon-only": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoIconOnly,
			})),
		{ ssr: false },
	),
	"tabs-demo-line-disabled": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoLineDisabled,
			})),
		{ ssr: false },
	),
	"tabs-demo-line-with-content": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoLineWithContent,
			})),
		{ ssr: false },
	),
	"tabs-demo-multiple": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoMultiple,
			})),
		{ ssr: false },
	),
	"tabs-demo-variants-alignment": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoVariantsAlignment,
			})),
		{ ssr: false },
	),
	"tabs-demo-with-content": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoWithContent,
			})),
		{ ssr: false },
	),
	"tabs-demo-with-dropdown": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoWithDropdown,
			})),
		{ ssr: false },
	),
	"tabs-demo-with-icons": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoWithIcons,
			})),
		{ ssr: false },
	),
	"tabs-demo-with-input-and-button": dynamic(
		() =>
			import("../../demos/ui/tabs-demo").then((mod) => ({
				default: mod.TabsDemoWithInputAndButton,
			})),
		{ ssr: false },
	),
	// Select
	"select-demo-default": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoDefault,
			})),
		{ ssr: false },
	),
	"select-demo-grouped": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoGrouped,
			})),
		{ ssr: false },
	),
	"select-demo-small": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoSmall,
			})),
		{ ssr: false },
	),
	"select-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoDisabled,
			})),
		{ ssr: false },
	),
	"select-demo-basic": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoBasic,
			})),
		{ ssr: false },
	),
	"select-demo-in-dialog": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoInDialog,
			})),
		{ ssr: false },
	),
	"select-demo-inline-with-input-nativeselect": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoInlineWithInputNativeselect,
			})),
		{ ssr: false },
	),
	"select-demo-invalid": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoInvalid,
			})),
		{ ssr: false },
	),
	"select-demo-item-aligned": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoItemAligned,
			})),
		{ ssr: false },
	),
	"select-demo-large-list": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoLargeList,
			})),
		{ ssr: false },
	),
	"select-demo-multiple-selection": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoMultipleSelection,
			})),
		{ ssr: false },
	),
	"select-demo-sides": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoSides,
			})),
		{ ssr: false },
	),
	"select-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoSizes,
			})),
		{ ssr: false },
	),
	"select-demo-subscription-plan": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoSubscriptionPlan,
			})),
		{ ssr: false },
	),
	"select-demo-with-button": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoWithButton,
			})),
		{ ssr: false },
	),
	"select-demo-with-field": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoWithField,
			})),
		{ ssr: false },
	),
	"select-demo-with-groups-labels": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoWithGroupsLabels,
			})),
		{ ssr: false },
	),
	"select-demo-with-icons": dynamic(
		() =>
			import("../../demos/ui/select-demo").then((mod) => ({
				default: mod.SelectDemoWithIcons,
			})),
		{ ssr: false },
	),
	// Checkbox
	"checkbox-demo-default": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoDefault,
			})),
		{ ssr: false },
	),
	"checkbox-demo-checked": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoChecked,
			})),
		{ ssr: false },
	),
	"checkbox-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoDisabled,
			})),
		{ ssr: false },
	),
	"checkbox-demo-with-description": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoWithDescription,
			})),
		{ ssr: false },
	),
	"checkbox-demo-basic": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoBasic,
			})),
		{ ssr: false },
	),
	"checkbox-demo-disabled-full": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoDisabledFull,
			})),
		{ ssr: false },
	),
	"checkbox-demo-group": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoGroup,
			})),
		{ ssr: false },
	),
	"checkbox-demo-in-table": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoInTable,
			})),
		{ ssr: false },
	),
	"checkbox-demo-invalid": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoInvalid,
			})),
		{ ssr: false },
	),
	"checkbox-demo-with-description-full": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoWithDescriptionFull,
			})),
		{ ssr: false },
	),
	"checkbox-demo-with-title": dynamic(
		() =>
			import("../../demos/ui/checkbox-demo").then((mod) => ({
				default: mod.CheckboxDemoWithTitle,
			})),
		{ ssr: false },
	),
	// Radio Group
	"radio-group-demo-default": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoDefault,
			})),
		{ ssr: false },
	),
	"radio-group-demo-horizontal": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoHorizontal,
			})),
		{ ssr: false },
	),
	"radio-group-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoDisabled,
			})),
		{ ssr: false },
	),
	"radio-group-demo-basic": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoBasic,
			})),
		{ ssr: false },
	),
	"radio-group-demo-grid-layout": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoGridLayout,
			})),
		{ ssr: false },
	),
	"radio-group-demo-invalid": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoInvalid,
			})),
		{ ssr: false },
	),
	"radio-group-demo-with-descriptions": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoWithDescriptions,
			})),
		{ ssr: false },
	),
	"radio-group-demo-with-fieldset": dynamic(
		() =>
			import("../../demos/ui/radio-group-demo").then((mod) => ({
				default: mod.RadioGroupDemoWithFieldset,
			})),
		{ ssr: false },
	),
	// Switch
	"switch-demo-default": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoDefault,
			})),
		{ ssr: false },
	),
	"switch-demo-small": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoSmall,
			})),
		{ ssr: false },
	),
	"switch-demo-checked": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoChecked,
			})),
		{ ssr: false },
	),
	"switch-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoDisabled,
			})),
		{ ssr: false },
	),
	"switch-demo-basic": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoBasic,
			})),
		{ ssr: false },
	),
	"switch-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoSizes,
			})),
		{ ssr: false },
	),
	"switch-demo-with-description": dynamic(
		() =>
			import("../../demos/ui/switch-demo").then((mod) => ({
				default: mod.SwitchDemoWithDescription,
			})),
		{ ssr: false },
	),
	// Toggle
	"toggle-demo-default": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoDefault,
			})),
		{ ssr: false },
	),
	"toggle-demo-outline": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoOutline,
			})),
		{ ssr: false },
	),
	"toggle-demo-with-text": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoWithText,
			})),
		{ ssr: false },
	),
	"toggle-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoSizes,
			})),
		{ ssr: false },
	),
	"toggle-demo-basic": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoBasic,
			})),
		{ ssr: false },
	),
	"toggle-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoDisabled,
			})),
		{ ssr: false },
	),
	"toggle-demo-with-button-icon-text": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoWithButtonIconText,
			})),
		{ ssr: false },
	),
	"toggle-demo-with-button-icon": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoWithButtonIcon,
			})),
		{ ssr: false },
	),
	"toggle-demo-with-button-text": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoWithButtonText,
			})),
		{ ssr: false },
	),
	"toggle-demo-with-icon": dynamic(
		() =>
			import("../../demos/ui/toggle-demo").then((mod) => ({
				default: mod.ToggleDemoWithIcon,
			})),
		{ ssr: false },
	),
	// Toggle Group
	"toggle-group-demo-default": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoDefault,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-outline": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoOutline,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-multiple": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoMultiple,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-basic": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoBasic,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-date-range": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoDateRange,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-filter": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoFilter,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-outline-with-icons": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoOutlineWithIcons,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoSizes,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-sort": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoSort,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-vertical-outline-with-icons": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoVerticalOutlineWithIcons,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-vertical-outline": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoVerticalOutline,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-vertical-with-spacing": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoVerticalWithSpacing,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-vertical": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoVertical,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-with-icons": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoWithIcons,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-with-input-and-select": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoWithInputAndSelect,
			})),
		{ ssr: false },
	),
	"toggle-group-demo-with-spacing": dynamic(
		() =>
			import("../../demos/ui/toggle-group-demo").then((mod) => ({
				default: mod.ToggleGroupDemoWithSpacing,
			})),
		{ ssr: false },
	),
	// Label
	"label-demo-default": dynamic(
		() =>
			import("../../demos/ui/label-demo").then((mod) => ({
				default: mod.LabelDemoDefault,
			})),
		{ ssr: false },
	),
	"label-demo-with-input": dynamic(
		() =>
			import("../../demos/ui/label-demo").then((mod) => ({
				default: mod.LabelDemoWithInput,
			})),
		{ ssr: false },
	),
	"label-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/label-demo").then((mod) => ({
				default: mod.LabelDemoDisabled,
			})),
		{ ssr: false },
	),
	"label-demo-with-checkbox": dynamic(
		() =>
			import("../../demos/ui/label-demo").then((mod) => ({
				default: mod.LabelDemoWithCheckbox,
			})),
		{ ssr: false },
	),
	"label-demo-with-textarea": dynamic(
		() =>
			import("../../demos/ui/label-demo").then((mod) => ({
				default: mod.LabelDemoWithTextarea,
			})),
		{ ssr: false },
	),
};
