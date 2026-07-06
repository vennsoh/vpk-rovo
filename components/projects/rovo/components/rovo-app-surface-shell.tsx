"use client";

import { createRovoAppSurfaceShell } from "@/components/projects/rovo-core/components/rovo-app-surface-shell";
import { RovoAppSidebar } from "@/components/projects/rovo/components/rovo-app-sidebar";
import { useRovoAppThreadList } from "@/components/projects/rovo/hooks/use-rovo-app-thread-list";
import {
	ROVO_APP_ROOT_PATH,
	buildRovoAppThreadPath,
} from "@/components/projects/rovo/lib/rovo-app-thread-route-sync";

export const RovoAppSurfaceShell = createRovoAppSurfaceShell({
	buildThreadPath: buildRovoAppThreadPath,
	rootPath: ROVO_APP_ROOT_PATH,
	product: "rovo",
	SidebarComponent: RovoAppSidebar,
	useThreadList: useRovoAppThreadList,
});
