import {
	buildRovoAppThreadPersistKey,
	shouldLoadInitialRovoAppThread,
	shouldReplacePendingRovoAppRoute,
	shouldReplaceRovoAppRouteAfterPersistence,
	shouldSkipRovoAppThreadLoad,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-route-sync";
import { studioAppAdapter, ROVO_APP_ROOT_PATH } from "@/components/projects/studio/studio-app-adapter";

export { ROVO_APP_ROOT_PATH };
export const buildRovoAppThreadPath = studioAppAdapter.buildThreadPath;
export const getRovoAppThreadIdFromPath = studioAppAdapter.getThreadIdFromPath;

export {
	buildRovoAppThreadPersistKey,
	shouldLoadInitialRovoAppThread,
	shouldReplacePendingRovoAppRoute,
	shouldReplaceRovoAppRouteAfterPersistence,
	shouldSkipRovoAppThreadLoad,
};
