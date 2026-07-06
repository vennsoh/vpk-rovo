"use strict";

const {
	createAbortControllerFromRequest,
} = require("../lib/http-request-abort");

function removeResponseListener(res, eventName, listener) {
	if (typeof res.off === "function") {
		res.off(eventName, listener);
		return;
	}
	if (typeof res.removeListener === "function") {
		res.removeListener(eventName, listener);
	}
}

function createChatAbortTracking({
	abortControllerFromRequest = createAbortControllerFromRequest,
	onAbort,
	req,
	res,
} = {}) {
	const { abortController, cleanup } = abortControllerFromRequest(req, res, {
		onAbort,
	});
	let didCleanupAbortTracking = false;
	const cleanupAbortTracking = () => {
		if (didCleanupAbortTracking) {
			return;
		}

		didCleanupAbortTracking = true;
		removeResponseListener(res, "finish", cleanupAbortTracking);
		removeResponseListener(res, "close", cleanupAbortTracking);
		cleanup();
	};

	res.once("finish", cleanupAbortTracking);
	res.once("close", cleanupAbortTracking);

	return {
		abortController,
		cleanupAbortTracking,
	};
}

module.exports = {
	createChatAbortTracking,
	removeResponseListener,
};
