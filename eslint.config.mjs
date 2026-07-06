import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const vpkIconRestrictedImportNames = [
	"Activity",
	"AlertCircle",
	"ArrowLeft",
	"ArrowRight",
	"Blocks",
	"Code",
	"Calendar",
	"Check",
	"ChevronDown",
	"ChevronRight",
	"ChevronsUpDown",
	"ExternalLink",
	"FileText",
	"Footprints",
	"Forward",
	"GalleryVerticalEnd",
	"Keyboard",
	"LineChart",
	"Link",
	"Maximize2",
	"Menu",
	"MessageCircleQuestion",
	"Mic",
	"MicOff",
	"MoreHorizontal",
	"MousePointerClick",
	"Pause",
	"Play",
	"RotateCw",
	"Search",
	"Settings",
	"Square",
	"Settings2",
	"Trash2",
	"TreePine",
	"TrendingDown",
	"TrendingUp",
	"VolumeX",
	"Waves",
];

const appComponentRestrictedImportPaths = [
	{
		name: "lucide-react",
		message:
			'Use "@/components/ui/vpk-icons" or direct "@atlaskit/icon" imports instead of "lucide-react".',
	},
	{
		name: "@/components/ui/vpk-icons",
		importNames: vpkIconRestrictedImportNames,
		message:
			'Use the stable "*Icon" exports from "@/components/ui/vpk-icons" instead of the Lucide-compat aliases.',
	},
];

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		".expect/**",
		".tmp/**",
		".venv/**",
		"tmp/**",
		"next-env.d.ts",
		"components/blocks/login/**",
	]),
	{
		files: ["**/*.js", "**/*.cjs"],
		rules: {
			"@typescript-eslint/no-require-imports": "off",
		},
	},
	{
		files: ["app/**/*.ts", "app/**/*.tsx", "components/**/*.ts", "components/**/*.tsx"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: appComponentRestrictedImportPaths,
				},
			],
		},
	},
	{
		files: ["components/projects/rovo/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: appComponentRestrictedImportPaths,
					patterns: [
						{
							group: ["@/components/projects/studio/**"],
							message:
								"Rovo project code must not import Studio internals. Move shared behavior to rovo-core or pass it through a route adapter.",
						},
					],
				},
			],
		},
	},
	{
		files: ["components/projects/studio/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: appComponentRestrictedImportPaths,
					patterns: [
						{
							group: ["@/components/projects/rovo/**"],
							message:
								"Studio project code must not import Rovo route internals. Move shared behavior to rovo-core or pass it through a route adapter.",
						},
					],
				},
			],
		},
	},
	{
		files: [
			"app/contexts/**/*.{js,jsx,ts,tsx}",
			"components/projects/shared/**/*.{js,jsx,ts,tsx}",
			"components/projects/sidebar-chat/**/*.{js,jsx,ts,tsx}",
		],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: appComponentRestrictedImportPaths,
					patterns: [
						{
							group: ["@/components/projects/rovo/**", "@/components/projects/studio/**"],
							message:
								"Shared app context and shared project code must not depend on route internals. Use rovo-core or a route-owned adapter.",
						},
					],
				},
			],
		},
	},
	{
		files: ["components/ui/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: appComponentRestrictedImportPaths,
					patterns: [
						{
							group: ["@/app/**", "@/components/projects/**"],
							message:
								"Shared UI primitives must stay generic and must not import app routes or project-specific surfaces.",
						},
					],
				},
			],
		},
	},
	{
		settings: {
			react: {
				version: "19.2.5",
			},
		},
		rules: {
			// Next 16 enables React compiler-style rules that the current repo is not
			// consistently written to satisfy yet; keep lint focused on the existing
			// enforced standards until that cleanup happens intentionally.
			"react-hooks/immutability": "off",
			"react-hooks/preserve-manual-memoization": "off",
			"react-hooks/purity": "off",
			"react-hooks/refs": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/static-components": "off",
		},
	},
	{
		files: ["components/blocks/dashboard/components/data-table.tsx"],
		rules: {
			"react-hooks/incompatible-library": "off",
		},
	},
]);

export default eslintConfig;
