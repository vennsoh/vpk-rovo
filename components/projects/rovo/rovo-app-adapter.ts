import { createRovoAppRouteAdapter } from "@/components/projects/rovo-core/lib/rovo-app-route-adapter";

export const rovoAppAdapter = createRovoAppRouteAdapter({
	rootPath: "/rovo",
});

export const ROVO_APP_ROOT_PATH = rovoAppAdapter.rootPath;
