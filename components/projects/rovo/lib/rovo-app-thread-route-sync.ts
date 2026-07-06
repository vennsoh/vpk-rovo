import {
	buildRovoAppThreadPersistKey,
	shouldLoadInitialRovoAppThread,
	shouldReplacePendingRovoAppRoute,
	shouldReplaceRovoAppRouteAfterPersistence,
	shouldSkipRovoAppThreadLoad,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-route-sync";
import { rovoAppAdapter, ROVO_APP_ROOT_PATH } from "@/components/projects/rovo/rovo-app-adapter";

export { ROVO_APP_ROOT_PATH };
export const buildRovoAppThreadPath = rovoAppAdapter.buildThreadPath;
export const getRovoAppThreadIdFromPath = rovoAppAdapter.getThreadIdFromPath;

export {
	buildRovoAppThreadPersistKey,
	shouldLoadInitialRovoAppThread,
	shouldReplacePendingRovoAppRoute,
	shouldReplaceRovoAppRouteAfterPersistence,
	shouldSkipRovoAppThreadLoad,
};
