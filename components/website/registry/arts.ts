import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const ARTS_DEMOS: Record<string, ComponentType> = {
	awake: dynamic(
		() => import("../demos/arts/awake-demo"),
		{ ssr: false },
	),
	cursors: dynamic(
		() => import("../demos/arts/cursors-demo"),
		{ ssr: false },
	),
	"personal-graph": dynamic(
		() => import("../demos/arts/personal-graph-demo"),
		{ ssr: false },
	),
	"rovo-fable": dynamic(
		() => import("../demos/arts/rovo-fable-demo"),
		{ ssr: false },
	),
};
