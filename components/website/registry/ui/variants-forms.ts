import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const UI_FORM_VARIANT_DEMOS: Record<string, ComponentType> = {
	// Field
	"field-demo-default": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoDefault,
			})),
		{ ssr: false },
	),
	"field-demo-error": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoError,
			})),
		{ ssr: false },
	),
	"field-demo-horizontal": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoHorizontal,
			})),
		{ ssr: false },
	),
	"field-demo-fieldset": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoFieldset,
			})),
		{ ssr: false },
	),
	"field-demo-checkbox-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoCheckboxFields,
			})),
		{ ssr: false },
	),
	"field-demo-horizontal-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoHorizontalFields,
			})),
		{ ssr: false },
	),
	"field-demo-input-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoInputFields,
			})),
		{ ssr: false },
	),
	"field-demo-native-select-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoNativeSelectFields,
			})),
		{ ssr: false },
	),
	"field-demo-otp-input-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoOtpInputFields,
			})),
		{ ssr: false },
	),
	"field-demo-radio-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoRadioFields,
			})),
		{ ssr: false },
	),
	"field-demo-select-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoSelectFields,
			})),
		{ ssr: false },
	),
	"field-demo-slider-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoSliderFields,
			})),
		{ ssr: false },
	),
	"field-demo-switch-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoSwitchFields,
			})),
		{ ssr: false },
	),
	"field-demo-textarea-fields": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextareaFields,
			})),
		{ ssr: false },
	),
	"field-demo-text-field": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextField,
			})),
		{ ssr: false },
	),
	"field-demo-text-field-disabled": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextFieldDisabled,
			})),
		{ ssr: false },
	),
	"field-demo-text-field-invalid": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextFieldInvalid,
			})),
		{ ssr: false },
	),
	"field-demo-text-field-variants": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextFieldVariants,
			})),
		{ ssr: false },
	),
	"field-demo-textarea": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextarea,
			})),
		{ ssr: false },
	),
	"field-demo-textarea-disabled": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextareaDisabled,
			})),
		{ ssr: false },
	),
	"field-demo-textarea-invalid": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoTextareaInvalid,
			})),
		{ ssr: false },
	),
	"field-demo-form": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoForm,
			})),
		{ ssr: false },
	),
	"field-demo-input-types": dynamic(
		() =>
			import("../../demos/ui/field-demo").then((mod) => ({
				default: mod.FieldDemoInputTypes,
			})),
		{ ssr: false },
	),
	// Native Select
	"native-select-demo-default": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoDefault,
			})),
		{ ssr: false },
	),
	"native-select-demo-small": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoSmall,
			})),
		{ ssr: false },
	),
	"native-select-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoDisabled,
			})),
		{ ssr: false },
	),
	"native-select-demo-basic": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoBasic,
			})),
		{ ssr: false },
	),
	"native-select-demo-invalid": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoInvalid,
			})),
		{ ssr: false },
	),
	"native-select-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoSizes,
			})),
		{ ssr: false },
	),
	"native-select-demo-with-field": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoWithField,
			})),
		{ ssr: false },
	),
	"native-select-demo-with-groups": dynamic(
		() =>
			import("../../demos/ui/native-select-demo").then((mod) => ({
				default: mod.NativeSelectDemoWithGroups,
			})),
		{ ssr: false },
	),
	// Input OTP
	"input-otp-demo-default": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoDefault,
			})),
		{ ssr: false },
	),
	"input-otp-demo-with-separator": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoWithSeparator,
			})),
		{ ssr: false },
	),
	"input-otp-demo-pattern": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoPattern,
			})),
		{ ssr: false },
	),
	"input-otp-demo-4-digits": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemo4Digits,
			})),
		{ ssr: false },
	),
	"input-otp-demo-alphanumeric": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoAlphanumeric,
			})),
		{ ssr: false },
	),
	"input-otp-demo-digits-only": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoDigitsOnly,
			})),
		{ ssr: false },
	),
	"input-otp-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoDisabled,
			})),
		{ ssr: false },
	),
	"input-otp-demo-form": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoForm,
			})),
		{ ssr: false },
	),
	"input-otp-demo-invalid-state": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoInvalidState,
			})),
		{ ssr: false },
	),
	"input-otp-demo-simple": dynamic(
		() =>
			import("../../demos/ui/input-otp-demo").then((mod) => ({
				default: mod.InputOtpDemoSimple,
			})),
		{ ssr: false },
	),
	// Alert Dialog
	"alert-dialog-demo-default": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoDefault,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-destructive": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoDestructive,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-small": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoSmall,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-custom-actions": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoCustomActions,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-basic": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoBasic,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-in-dialog": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoInDialog,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-small-with-media": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoSmallWithMedia,
			})),
		{ ssr: false },
	),
	"alert-dialog-demo-with-media": dynamic(
		() =>
			import("../../demos/ui/alert-dialog-demo").then((mod) => ({
				default: mod.AlertDialogDemoWithMedia,
			})),
		{ ssr: false },
	),
	// Popover
	"popover-demo-default": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoDefault,
			})),
		{ ssr: false },
	),
	"popover-demo-with-form": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoWithForm,
			})),
		{ ssr: false },
	),
	"popover-demo-placement": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoPlacement,
			})),
		{ ssr: false },
	),
	"popover-demo-alignments": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoAlignments,
			})),
		{ ssr: false },
	),
	"popover-demo-basic": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoBasic,
			})),
		{ ssr: false },
	),
	"popover-demo-in-dialog": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoInDialog,
			})),
		{ ssr: false },
	),
	"popover-demo-sides": dynamic(
		() =>
			import("../../demos/ui/popover-demo").then((mod) => ({
				default: mod.PopoverDemoSides,
			})),
		{ ssr: false },
	),
	// Tooltip
	"tooltip-demo-default": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoDefault,
			})),
		{ ssr: false },
	),
	"tooltip-demo-side": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoSide,
			})),
		{ ssr: false },
	),
	"tooltip-demo-icon-button": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoIconButton,
			})),
		{ ssr: false },
	),
	"tooltip-demo-basic": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoBasic,
			})),
		{ ssr: false },
	),
	"tooltip-demo-disabled": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoDisabled,
			})),
		{ ssr: false },
	),
	"tooltip-demo-formatted-content": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoFormattedContent,
			})),
		{ ssr: false },
	),
	"tooltip-demo-long-content": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoLongContent,
			})),
		{ ssr: false },
	),
	"tooltip-demo-on-link": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoOnLink,
			})),
		{ ssr: false },
	),
	"tooltip-demo-sides": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoSides,
			})),
		{ ssr: false },
	),
	"tooltip-demo-with-icon": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoWithIcon,
			})),
		{ ssr: false },
	),
	"tooltip-demo-with-keyboard-shortcut": dynamic(
		() =>
			import("../../demos/ui/tooltip-demo").then((mod) => ({
				default: mod.TooltipDemoWithKeyboardShortcut,
			})),
		{ ssr: false },
	),
	// Hover Card
	"hover-card-demo-default": dynamic(
		() =>
			import("../../demos/ui/hover-card-demo").then((mod) => ({
				default: mod.HoverCardDemoDefault,
			})),
		{ ssr: false },
	),
	"hover-card-demo-button": dynamic(
		() =>
			import("../../demos/ui/hover-card-demo").then((mod) => ({
				default: mod.HoverCardDemoButton,
			})),
		{ ssr: false },
	),
	"hover-card-demo-inline-message": dynamic(
		() =>
			import("../../demos/ui/hover-card-demo").then((mod) => ({
				default: mod.HoverCardDemoInlineMessage,
			})),
		{ ssr: false },
	),
	"hover-card-demo-placement": dynamic(
		() =>
			import("../../demos/ui/hover-card-demo").then((mod) => ({
				default: mod.HoverCardDemoPlacement,
			})),
		{ ssr: false },
	),
	"hover-card-demo-sides": dynamic(
		() =>
			import("../../demos/ui/hover-card-demo").then((mod) => ({
				default: mod.HoverCardDemoSides,
			})),
		{ ssr: false },
	),
	// Sheet
	"sheet-demo-default": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoDefault,
			})),
		{ ssr: false },
	),
	"sheet-demo-left": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoLeft,
			})),
		{ ssr: false },
	),
	"sheet-demo-top": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoTop,
			})),
		{ ssr: false },
	),
	"sheet-demo-no-close": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoNoClose,
			})),
		{ ssr: false },
	),
	"sheet-demo-no-close-button": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoNoCloseButton,
			})),
		{ ssr: false },
	),
	"sheet-demo-sides": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoSides,
			})),
		{ ssr: false },
	),
	"sheet-demo-with-form": dynamic(
		() =>
			import("../../demos/ui/sheet-demo").then((mod) => ({
				default: mod.SheetDemoWithForm,
			})),
		{ ssr: false },
	),
	// Drawer
	"drawer-demo-default": dynamic(
		() =>
			import("../../demos/ui/drawer-demo").then((mod) => ({
				default: mod.DrawerDemoDefault,
			})),
		{ ssr: false },
	),
	"drawer-demo-with-form": dynamic(
		() =>
			import("../../demos/ui/drawer-demo").then((mod) => ({
				default: mod.DrawerDemoWithForm,
			})),
		{ ssr: false },
	),
	"drawer-demo-right": dynamic(
		() =>
			import("../../demos/ui/drawer-demo").then((mod) => ({
				default: mod.DrawerDemoRight,
			})),
		{ ssr: false },
	),
	"drawer-demo-scrollable-content": dynamic(
		() =>
			import("../../demos/ui/drawer-demo").then((mod) => ({
				default: mod.DrawerDemoScrollableContent,
			})),
		{ ssr: false },
	),
	"drawer-demo-sides": dynamic(
		() =>
			import("../../demos/ui/drawer-demo").then((mod) => ({
				default: mod.DrawerDemoSides,
			})),
		{ ssr: false },
	),
	// Collapsible
	"collapsible-demo-default": dynamic(
		() =>
			import("../../demos/ui/collapsible-demo").then((mod) => ({
				default: mod.CollapsibleDemoDefault,
			})),
		{ ssr: false },
	),
	"collapsible-demo-open": dynamic(
		() =>
			import("../../demos/ui/collapsible-demo").then((mod) => ({
				default: mod.CollapsibleDemoOpen,
			})),
		{ ssr: false },
	),
	"collapsible-demo-styled": dynamic(
		() =>
			import("../../demos/ui/collapsible-demo").then((mod) => ({
				default: mod.CollapsibleDemoStyled,
			})),
		{ ssr: false },
	),
	"collapsible-demo-file-tree": dynamic(
		() =>
			import("../../demos/ui/collapsible-demo").then((mod) => ({
				default: mod.CollapsibleDemoFileTree,
			})),
		{ ssr: false },
	),
	"collapsible-demo-settings": dynamic(
		() =>
			import("../../demos/ui/collapsible-demo").then((mod) => ({
				default: mod.CollapsibleDemoSettings,
			})),
		{ ssr: false },
	),
	// Breadcrumb
	"breadcrumb-demo-default": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoDefault,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-ellipsis": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoEllipsis,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-custom-separator": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoCustomSeparator,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-basic": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoBasic,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-sizes": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoSizes,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-with-slots": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoWithSlots,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-with-dropdown": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoWithDropdown,
			})),
		{ ssr: false },
	),
	"breadcrumb-demo-with-link": dynamic(
		() =>
			import("../../demos/ui/breadcrumb-demo").then((mod) => ({
				default: mod.BreadcrumbDemoWithLink,
			})),
		{ ssr: false },
	),
	// Pagination
	"pagination-demo-default": dynamic(
		() =>
			import("../../demos/ui/pagination-demo").then((mod) => ({
				default: mod.PaginationDemoDefault,
			})),
		{ ssr: false },
	),
	"pagination-demo-with-ellipsis": dynamic(
		() =>
			import("../../demos/ui/pagination-demo").then((mod) => ({
				default: mod.PaginationDemoWithEllipsis,
			})),
		{ ssr: false },
	),
	"pagination-demo-simple": dynamic(
		() =>
			import("../../demos/ui/pagination-demo").then((mod) => ({
				default: mod.PaginationDemoSimple,
			})),
		{ ssr: false },
	),
	"pagination-demo-basic": dynamic(
		() =>
			import("../../demos/ui/pagination-demo").then((mod) => ({
				default: mod.PaginationDemoBasic,
			})),
		{ ssr: false },
	),
	"pagination-demo-with-select": dynamic(
		() =>
			import("../../demos/ui/pagination-demo").then((mod) => ({
				default: mod.PaginationDemoWithSelect,
			})),
		{ ssr: false },
	),
	// Accordion
	"accordion-demo-default": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoDefault,
			})),
		{ ssr: false },
	),
	"accordion-demo-open": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoOpen,
			})),
		{ ssr: false },
	),
	"accordion-demo-multiple": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoMultiple,
			})),
		{ ssr: false },
	),
	"accordion-demo-basic": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoBasic,
			})),
		{ ssr: false },
	),
	"accordion-demo-in-card": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoInCard,
			})),
		{ ssr: false },
	),
	"accordion-demo-with-borders": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoWithBorders,
			})),
		{ ssr: false },
	),
	"accordion-demo-with-disabled": dynamic(
		() =>
			import("../../demos/ui/accordion-demo").then((mod) => ({
				default: mod.AccordionDemoWithDisabled,
			})),
		{ ssr: false },
	),
	// Separator
	"separator-demo-default": dynamic(
		() =>
			import("../../demos/ui/separator-demo").then((mod) => ({
				default: mod.SeparatorDemoDefault,
			})),
		{ ssr: false },
	),
	"separator-demo-vertical": dynamic(
		() =>
			import("../../demos/ui/separator-demo").then((mod) => ({
				default: mod.SeparatorDemoVertical,
			})),
		{ ssr: false },
	),
	"separator-demo-horizontal": dynamic(
		() =>
			import("../../demos/ui/separator-demo").then((mod) => ({
				default: mod.SeparatorDemoHorizontal,
			})),
		{ ssr: false },
	),
	"separator-demo-in-list": dynamic(
		() =>
			import("../../demos/ui/separator-demo").then((mod) => ({
				default: mod.SeparatorDemoInList,
			})),
		{ ssr: false },
	),
	"separator-demo-vertical-menu": dynamic(
		() =>
			import("../../demos/ui/separator-demo").then((mod) => ({
				default: mod.SeparatorDemoVerticalMenu,
			})),
		{ ssr: false },
	),
};
