"use strict";

function parseOptionalBoolean(value) {
	if (value === true || value === "true" || value === 1 || value === "1") {
		return true;
	}
	if (value === false || value === "false" || value === 0 || value === "0") {
		return false;
	}
	return null;
}

// Hermes memory/skill companions run extra AI Gateway calls after every Rovo
// turn to propose memory entries and skill drafts. They are opt-in: set
// HERMES_COMPANIONS_ENABLED=true (or =1) to turn them back on. Disabled by
// default so they never run behind the scenes during local dev.
function areHermesCompanionsEnabled({ env = process.env } = {}) {
	return parseOptionalBoolean(env?.HERMES_COMPANIONS_ENABLED) === true;
}

// Hermes background jobs (the job ticker that executes scheduled jobs and the
// startup wiki-job provisioning) are opt-in: set HERMES_JOBS_ENABLED=true (or
// =1) to turn them back on. Disabled by default so no scheduled work runs
// behind the scenes during local dev. Job CRUD/run routes remain available so
// the UI keeps working; only autonomous background execution is gated.
function areHermesJobsEnabled({ env = process.env } = {}) {
	return parseOptionalBoolean(env?.HERMES_JOBS_ENABLED) === true;
}

module.exports = {
	areHermesCompanionsEnabled,
	areHermesJobsEnabled,
	parseOptionalBoolean,
};
