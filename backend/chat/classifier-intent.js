"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

const CLASSIFIER_JSON_ALLOWED_KEYS = new Set(["intent", "confidence", "reason"]);
const CLASSIFIER_INTENTS = new Set(["normal", "genui", "audio", "image", "both"]);

function safeJsonParse(rawValue) {
	if (typeof rawValue !== "string") {
		return null;
	}

	try {
		return JSON.parse(rawValue);
	} catch {
		return null;
	}
}

function extractClassifierJsonCandidate(rawText) {
	const text = getNonEmptyString(rawText);
	if (!text) {
		return null;
	}

	const fencedMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	if (fencedMatch && fencedMatch[1]) {
		return fencedMatch[1].trim();
	}

	if (text.startsWith("{") && text.endsWith("}")) {
		return text;
	}

	return null;
}

function parseClassifierIntentPayload(rawText) {
	const jsonCandidate = extractClassifierJsonCandidate(rawText);
	if (!jsonCandidate) {
		return null;
	}

	const parsed = safeJsonParse(jsonCandidate);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const keys = Object.keys(parsed);
	if (!keys.includes("intent")) {
		return null;
	}
	if (!keys.every((key) => CLASSIFIER_JSON_ALLOWED_KEYS.has(key))) {
		return null;
	}

	const intent = getNonEmptyString(parsed.intent)?.toLowerCase();
	if (!intent || !CLASSIFIER_INTENTS.has(intent)) {
		return null;
	}

	if (Object.prototype.hasOwnProperty.call(parsed, "confidence")) {
		if (typeof parsed.confidence !== "number" || !Number.isFinite(parsed.confidence)) {
			return null;
		}
		if (parsed.confidence < 0 || parsed.confidence > 1) {
			return null;
		}
	}

	if (Object.prototype.hasOwnProperty.call(parsed, "reason")) {
		if (getNonEmptyString(parsed.reason) === null) {
			return null;
		}
	}

	return {
		intent,
		confidence:
			typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
				? parsed.confidence
				: null,
		reason: getNonEmptyString(parsed.reason),
	};
}

function isClassifierIntentLeakCandidate(value) {
	if (typeof value !== "string") {
		return false;
	}

	const trimmed = value.trimStart();
	return trimmed.startsWith("{") || trimmed.startsWith("```");
}

module.exports = {
	extractClassifierJsonCandidate,
	isClassifierIntentLeakCandidate,
	parseClassifierIntentPayload,
	safeJsonParse,
};
