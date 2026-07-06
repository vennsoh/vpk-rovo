import { createRovoAppRouteAdapter } from "@/components/projects/rovo-core/lib/rovo-app-route-adapter";

export const studioAppAdapter = createRovoAppRouteAdapter({
	rootPath: "/studio",
	chatRequestBodyOptions: {
		chatSdkSource: "studio",
		includeCreationMode: true,
	},
});

export const ROVO_APP_ROOT_PATH = studioAppAdapter.rootPath;
