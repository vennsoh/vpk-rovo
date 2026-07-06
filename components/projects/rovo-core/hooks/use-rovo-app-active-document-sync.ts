"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { RovoAppDocument } from "@/lib/rovo-app-types";

interface UseRovoAppActiveDocumentSyncOptions {
	activeDocument: RovoAppDocument | null;
	activeDocumentContent: string;
	setArtifactDraftContent: Dispatch<SetStateAction<string>>;
	setSelectedVersionId: Dispatch<SetStateAction<string | null>>;
}

export function useRovoAppActiveDocumentSync({
	activeDocument,
	activeDocumentContent,
	setArtifactDraftContent,
	setSelectedVersionId,
}: UseRovoAppActiveDocumentSyncOptions): void {
	useEffect(() => {
		if (!activeDocument) {
			return;
		}

		setArtifactDraftContent((previousContent) =>
			previousContent !== activeDocumentContent ? activeDocumentContent : previousContent,
		);
		setSelectedVersionId((previousVersionId) => {
			const nextVersionId = activeDocument.versions.at(-1)?.id ?? null;
			return previousVersionId !== nextVersionId ? nextVersionId : previousVersionId;
		});
	}, [
		activeDocument,
		activeDocumentContent,
		setArtifactDraftContent,
		setSelectedVersionId,
	]);
}
