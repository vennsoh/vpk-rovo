import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MIC_SELECTOR_DETAIL: ComponentDetail = {
	description:
		"A composable microphone selector dropdown built on Command and Popover primitives. Provides permission-aware device enumeration, real-time device detection, searchable device list, and intelligent hardware ID label parsing.",
	usage: `import {
  MicSelector,
  MicSelectorTrigger,
  MicSelectorValue,
  MicSelectorContent,
  MicSelectorInput,
  MicSelectorList,
  MicSelectorEmpty,
  MicSelectorItem,
  MicSelectorLabel,
  useAudioDevices,
} from "@/components/ui-custom/mic-selector";

<MicSelector>
  <MicSelectorTrigger className="w-[280px]">
    <MicSelectorValue />
  </MicSelectorTrigger>
  <MicSelectorContent>
    <MicSelectorInput />
    <MicSelectorList>
      {(devices) =>
        devices.length > 0 ? (
          devices.map((device) => (
            <MicSelectorItem key={device.deviceId} value={device.deviceId}>
              <MicSelectorLabel device={device} />
            </MicSelectorItem>
          ))
        ) : (
          <MicSelectorEmpty />
        )
      }
    </MicSelectorList>
  </MicSelectorContent>
</MicSelector>`,
	props: [
		{
			name: "value",
			type: "string",
			description: "Controlled selected device ID.",
		},
		{
			name: "defaultValue",
			type: "string",
			description: "Default selected device ID for uncontrolled usage.",
		},
		{
			name: "onValueChange",
			type: "(value: string | undefined) => void",
			description: "Callback fired when the selected device changes.",
		},
		{
			name: "open",
			type: "boolean",
			description: "Controlled open state of the popover.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Callback fired when the popover open state changes.",
		},
	],
	subComponents: [
		{ name: "MicSelector", description: "Root provider wrapping a Popover. Manages device enumeration, permission requests, and selection state." },
		{ name: "MicSelectorTrigger", description: "Outline button trigger with chevron icon and ResizeObserver-synced width." },
		{ name: "MicSelectorValue", description: "Displays the selected device label or a placeholder." },
		{ name: "MicSelectorContent", description: "Popover content wrapping a Command for searchable selection." },
		{ name: "MicSelectorInput", description: "Search input for filtering the device list." },
		{ name: "MicSelectorList", description: "Device list container with render-prop children receiving MediaDeviceInfo[]." },
		{ name: "MicSelectorEmpty", description: "Empty state shown when no devices match the search." },
		{ name: "MicSelectorItem", description: "Individual selectable device item." },
		{ name: "MicSelectorLabel", description: "Device label with intelligent hardware ID parsing (extracts XXXX:XXXX format)." },
	],
	examples: [
		{ title: "Controlled", description: "Controlled selector showing the selected device ID below.", demoSlug: "mic-selector-demo-controlled" },
		{ title: "With checkmark", description: "Selector with a check icon next to the active device.", demoSlug: "mic-selector-demo-with-checkmark" },
		{ title: "Compact", description: "Small-sized trigger without search input.", demoSlug: "mic-selector-demo-compact" },
	],
};
