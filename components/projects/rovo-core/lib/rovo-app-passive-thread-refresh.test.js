const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS,
	startRovoAppPassiveThreadRefresh,
} = loadRovoCoreModule("lib/rovo-app-passive-thread-refresh.ts");

function createRefreshEnvironment() {
	let intervalHandler = null;
	const listeners = {
		focus: new Set(),
		visibilitychange: new Set(),
	};
	const clearedIntervals = [];
	const documentRef = {
		visibilityState: "visible",
		addEventListener(type, listener) {
			listeners[type].add(listener);
		},
		removeEventListener(type, listener) {
			listeners[type].delete(listener);
		},
	};
	const windowRef = {
		addEventListener(type, listener) {
			listeners[type].add(listener);
		},
		clearInterval(intervalId) {
			clearedIntervals.push(intervalId);
		},
		removeEventListener(type, listener) {
			listeners[type].delete(listener);
		},
		setInterval(listener) {
			intervalHandler = listener;
			return 42;
		},
	};

	return {
		clearedIntervals,
		documentRef,
		fireFocus() {
			for (const listener of listeners.focus) listener();
		},
		fireInterval() {
			intervalHandler?.();
		},
		fireVisibilityChange() {
			for (const listener of listeners.visibilitychange) listener();
		},
		listenerCount(type) {
			return listeners[type].size;
		},
		windowRef,
	};
}

test("startRovoAppPassiveThreadRefresh wires the default interval", () => {
	assert.equal(ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS, 15_000);
});

test("startRovoAppPassiveThreadRefresh refreshes on focus and visible polling", () => {
	const calls = [];
	const environment = createRefreshEnvironment();

	startRovoAppPassiveThreadRefresh({
		documentRef: environment.documentRef,
		refreshThreads: (options) => calls.push(options),
		windowRef: environment.windowRef,
	});

	environment.fireFocus();
	environment.fireInterval();

	assert.deepEqual(calls, [
		{ reportBackendUnavailable: false },
		{ reportBackendUnavailable: false },
	]);
});

test("startRovoAppPassiveThreadRefresh skips hidden visibility refreshes", () => {
	const calls = [];
	const environment = createRefreshEnvironment();

	startRovoAppPassiveThreadRefresh({
		documentRef: environment.documentRef,
		refreshThreads: (options) => calls.push(options),
		windowRef: environment.windowRef,
	});

	environment.documentRef.visibilityState = "hidden";
	environment.fireVisibilityChange();
	environment.fireInterval();
	environment.documentRef.visibilityState = "visible";
	environment.fireVisibilityChange();

	assert.deepEqual(calls, [{ reportBackendUnavailable: false }]);
});

test("startRovoAppPassiveThreadRefresh cleanup removes listeners and clears the interval", () => {
	const calls = [];
	const environment = createRefreshEnvironment();
	const cleanup = startRovoAppPassiveThreadRefresh({
		documentRef: environment.documentRef,
		refreshThreads: (options) => calls.push(options),
		windowRef: environment.windowRef,
	});

	assert.equal(environment.listenerCount("focus"), 1);
	assert.equal(environment.listenerCount("visibilitychange"), 1);

	cleanup();
	environment.fireFocus();
	environment.fireVisibilityChange();

	assert.deepEqual(calls, []);
	assert.deepEqual(environment.clearedIntervals, [42]);
	assert.equal(environment.listenerCount("focus"), 0);
	assert.equal(environment.listenerCount("visibilitychange"), 0);
});
