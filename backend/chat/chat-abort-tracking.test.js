const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const {
	createChatAbortTracking,
	removeResponseListener,
} = require("./chat-abort-tracking");

test("createChatAbortTracking registers finish and close cleanup once", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	const abortController = { signal: { aborted: false } };
	let cleanupCount = 0;
	const abortControllerFromRequestCalls = [];

	const tracking = createChatAbortTracking({
		abortControllerFromRequest: (...args) => {
			abortControllerFromRequestCalls.push(args);
			return {
				abortController,
				cleanup: () => {
					cleanupCount += 1;
				},
			};
		},
		onAbort: () => {},
		req,
		res,
	});

	assert.equal(tracking.abortController, abortController);
	assert.equal(res.listenerCount("finish"), 1);
	assert.equal(res.listenerCount("close"), 1);
	assert.equal(abortControllerFromRequestCalls[0][0], req);
	assert.equal(abortControllerFromRequestCalls[0][1], res);
	assert.equal(typeof abortControllerFromRequestCalls[0][2].onAbort, "function");

	res.emit("finish");
	res.emit("close");
	tracking.cleanupAbortTracking();

	assert.equal(cleanupCount, 1);
	assert.equal(res.listenerCount("finish"), 0);
	assert.equal(res.listenerCount("close"), 0);
});

test("createChatAbortTracking cleanup can be called before response events", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	let cleanupCount = 0;

	const tracking = createChatAbortTracking({
		abortControllerFromRequest: () => ({
			abortController: { signal: { aborted: false } },
			cleanup: () => {
				cleanupCount += 1;
			},
		}),
		req,
		res,
	});

	tracking.cleanupAbortTracking();
	res.emit("finish");
	res.emit("close");

	assert.equal(cleanupCount, 1);
	assert.equal(res.listenerCount("finish"), 0);
	assert.equal(res.listenerCount("close"), 0);
});

test("removeResponseListener falls back to removeListener when off is unavailable", () => {
	const removed = [];
	const res = {
		removeListener(eventName, listener) {
			removed.push({ eventName, listener });
		},
	};
	const listener = () => {};

	removeResponseListener(res, "close", listener);

	assert.deepEqual(removed, [{ eventName: "close", listener }]);
});
