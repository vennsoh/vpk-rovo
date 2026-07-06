import type { ComponentDetail } from "@/app/data/component-detail-types";

export const GLASS_TABS_DETAIL: ComponentDetail = {
		description: "Shared liquid-glass segmented control extracted from the Awake theme switcher. Uses the same elastic committed pill, hover ghost pill, and magnetic hover label drift as the Awake scene.",
		importStatement: `import { GlassTabs } from "@/components/visual/glass-tabs";`,
		usage: `const options = [
	{ value: "location", label: "Location" },
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

type ThemeMode = (typeof options)[number]["value"];

const [value, setValue] = React.useState<ThemeMode>("location");

<GlassTabs
	aria-label="Theme"
	options={options}
	value={value}
	onChange={setValue}
/>`,
		props: [
			{ name: "options", type: "ReadonlyArray<{ value: string; label: string }>", description: "Controlled list of tabs to render. Each option provides the string value and visible label." },
			{ name: "value", type: "string", description: "Currently selected option value." },
			{ name: "onChange", type: "(value: string) => void", description: "Called when the user commits a different tab via pointer or keyboard." },
			{ name: "keyboardSelectionPulseKey", type: "number", description: "Optional external pulse used when parent-level keyboard shortcuts change `value`, so the pill uses the tighter keyboard animation path." },
			{ name: "aria-label", type: "string", description: "Accessible name applied to the radiogroup wrapper." },
			{ name: "className", type: "string", description: "Additional class names merged onto the outer glass shell." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the outer glass shell." },
		],
	};
