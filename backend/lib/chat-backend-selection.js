"use strict";

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createPreferredBackendResolver requires ${name}`);
	}
	return value;
}

function createPreferredBackendResolver({ isRovoAvailable } = {}) {
	requireFunction("isRovoAvailable", isRovoAvailable);

	return async function resolvePreferredBackend({ backendPreference = "rovo" } = {}) {
		if (backendPreference === "ai-gateway") {
			return {
				backend: "ai-gateway",
				rovoAvailable: false,
			};
		}

		const rovoAvailable = await isRovoAvailable();

		if (rovoAvailable) {
			return {
				backend: "rovo",
				rovoAvailable,
			};
		}

		return {
			backend: null,
			rovoAvailable,
		};
	};
}

module.exports = {
	createPreferredBackendResolver,
};
