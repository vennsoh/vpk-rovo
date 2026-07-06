import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const UTILITY_DEMOS: Record<string, ComponentType> = {
	"agent-browser": dynamic(() => import("../demos/utils/agent-browser"), {
		ssr: false,
	}),
	gui: dynamic(() => import("../demos/utils/gui-demo"), { ssr: false }),
	"image-generation": dynamic(
		() => import("../demos/utils/image-generation-demo"),
		{ ssr: false },
	),
	multiports: dynamic(() => import("../demos/utils/multiports-demo"), {
		ssr: false,
	}),
	"sound-generation": dynamic(
		() => import("../demos/utils/sound-generation-demo"),
		{ ssr: false },
	),
	streamdown: dynamic(() => import("../demos/utils/streamdown-demo"), {
		ssr: false,
	}),
	"tools-invocation": dynamic(
		() => import("../demos/utils/tools-invocation-demo"),
		{ ssr: false },
	),
	"ui-generation": dynamic(() => import("../demos/utils/ui-generation-demo"), {
		ssr: false,
	}),
	"visual-json": dynamic(() => import("../demos/utils/visual-json-demo"), {
		ssr: false,
	}),
};

export const UTILITY_VARIANT_DEMOS: Record<string, ComponentType> = {
	"gui-demo-full-config": dynamic(
		() =>
			import("../demos/utils/gui-demo").then((mod) => ({
				default: mod.GUIFullConfigDemo,
			})),
		{ ssr: false },
	),
};
