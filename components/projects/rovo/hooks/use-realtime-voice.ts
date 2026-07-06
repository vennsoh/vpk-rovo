"use client";

import { useRealtimeVoice as useRealtimeVoiceCore } from "@/components/projects/rovo-core/hooks/use-realtime-voice";
import type {
	UseRealtimeVoiceOptions as CoreUseRealtimeVoiceOptions,
	UseRealtimeVoiceResult,
} from "@/components/projects/rovo-core/hooks/use-realtime-voice";

export type {
	DelegationRequest,
	RealtimeGenerationState,
	RealtimeVoiceConnectOptions,
	RealtimeVoiceState,
	UseRealtimeVoiceResult,
} from "@/components/projects/rovo-core/hooks/use-realtime-voice";

export type UseRealtimeVoiceOptions = Omit<
	CoreUseRealtimeVoiceOptions,
	"sessionPolicyMode"
>;

export function useRealtimeVoice(
	options: UseRealtimeVoiceOptions,
): UseRealtimeVoiceResult {
	return useRealtimeVoiceCore({
		...options,
		sessionPolicyMode: "auto",
	});
}
