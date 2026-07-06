"use strict";

function parseSseEventPayload(rawData) {
	if (typeof rawData !== "string" || !rawData.trim()) {
		return null;
	}

	try {
		const parsed = JSON.parse(rawData);
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
}

function getSseEventMessage(eventName, rawData, parsed) {
	if (parsed && typeof parsed === "object") {
		if (typeof parsed.message === "string" && parsed.message.trim()) {
			return parsed.message.trim();
		}
		if (typeof parsed.error === "string" && parsed.error.trim()) {
			return parsed.error.trim();
		}
		if (typeof parsed.title === "string" && parsed.title.trim()) {
			return parsed.title.trim();
		}
	}

	if (typeof rawData === "string" && rawData.trim()) {
		return rawData.trim();
	}

	return `Rovo ${eventName} event received`;
}

function buildSseEventError(eventName, rawData, parsed) {
	const error = new Error(getSseEventMessage(eventName, rawData, parsed));
	error.eventName = eventName;
	if (parsed && typeof parsed === "object") {
		if (typeof parsed.title === "string" && parsed.title.trim()) {
			error.title = parsed.title.trim();
		}
		if (typeof parsed.type === "string" && parsed.type.trim()) {
			error.type = parsed.type.trim();
		}
	}
	if (typeof rawData === "string" && rawData.trim()) {
		error.rawData = rawData.trim();
	}
	return error;
}

function buildWarningEvent(eventName, rawData, parsed) {
	const message = getSseEventMessage(eventName, rawData, parsed);
	const warningEvent = {
		eventName,
		message,
		rawData,
	};

	if (parsed && typeof parsed === "object") {
		if (typeof parsed.title === "string" && parsed.title.trim()) {
			warningEvent.title = parsed.title.trim();
		}
		warningEvent.payload = parsed;
	}

	return warningEvent;
}

module.exports = {
	buildSseEventError,
	buildWarningEvent,
	getSseEventMessage,
	parseSseEventPayload,
};
