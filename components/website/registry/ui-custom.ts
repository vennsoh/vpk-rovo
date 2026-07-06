import type { ComponentType } from "react";

import { UI_CUSTOM_PRIMARY_DEMOS } from "./ui-custom/primary";
import { UI_CUSTOM_AGENT_VARIANT_DEMOS } from "./ui-custom/variants-agent";
import { UI_CUSTOM_CODE_VARIANT_DEMOS } from "./ui-custom/variants-code";
import { UI_CUSTOM_FOUNDATION_VARIANT_DEMOS } from "./ui-custom/variants-foundation";
import { UI_CUSTOM_MEDIA_VARIANT_DEMOS } from "./ui-custom/variants-media";
import { UI_CUSTOM_RUNTIME_VARIANT_DEMOS } from "./ui-custom/variants-runtime";

export const UI_CUSTOM_DEMO: Record<string, ComponentType> = {
	...UI_CUSTOM_PRIMARY_DEMOS,
};

export const UI_CUSTOM_VARIANT_DEMOS: Record<string, ComponentType> = {
	...UI_CUSTOM_FOUNDATION_VARIANT_DEMOS,
	...UI_CUSTOM_MEDIA_VARIANT_DEMOS,
	...UI_CUSTOM_CODE_VARIANT_DEMOS,
	...UI_CUSTOM_AGENT_VARIANT_DEMOS,
	...UI_CUSTOM_RUNTIME_VARIANT_DEMOS,
};
