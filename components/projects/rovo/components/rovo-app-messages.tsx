"use client";

import {
	ROVO_APP_DEFAULT_EMPTY_STATE,
	RovoAppMessages as RovoCoreAppMessages,
	type RovoAppMessagesProps,
} from "@/components/projects/rovo-core/components/rovo-app-messages";

export function RovoAppMessages(props: Readonly<RovoAppMessagesProps>) {
	return (
		<RovoCoreAppMessages
			{...props}
			emptyStateConfig={ROVO_APP_DEFAULT_EMPTY_STATE}
			unavailableProductName="Rovo"
		/>
	);
}
