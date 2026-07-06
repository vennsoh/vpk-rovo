import {
	buildRovoAppThreadPath,
	getRovoAppThreadIdFromPath,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-route-sync";

export interface RovoAppChatRequestBodyOptions {
	chatSdkSource?: "studio";
	includeCreationMode?: boolean;
}

export interface RovoAppRouteAdapter {
	buildThreadPath: (threadId: string) => string;
	chatRequestBodyOptions: RovoAppChatRequestBodyOptions;
	getThreadIdFromPath: (pathname: string) => string | null;
	rootPath: string;
}

export function createRovoAppRouteAdapter({
	chatRequestBodyOptions = {},
	rootPath,
}: {
	chatRequestBodyOptions?: RovoAppChatRequestBodyOptions;
	rootPath: string;
}): RovoAppRouteAdapter {
	return {
		buildThreadPath: (threadId) => buildRovoAppThreadPath(rootPath, threadId),
		chatRequestBodyOptions,
		getThreadIdFromPath: (pathname) => getRovoAppThreadIdFromPath(rootPath, pathname),
		rootPath,
	};
}
