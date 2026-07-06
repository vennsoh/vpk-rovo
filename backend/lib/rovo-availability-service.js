"use strict";

const fs = require("node:fs");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAvailabilityService requires ${name}`);
	}
	return value;
}

function createRovoAvailabilityService({
	classifyRovoHealthCheck,
	createRovoPool,
	debugLog = () => {},
	env = process.env,
	fsModule = fs,
	getBasePort,
	initPool,
	logger = console,
	maxTries = 20,
	now = () => Date.now(),
	onPortAvailable = () => {},
	portFile,
	portsFile,
	refreshIntervalMs = 60_000,
	resolveRovoPorts,
	rovoHealthCheck,
	waitForReady,
} = {}) {
	requireFunction("classifyRovoHealthCheck", classifyRovoHealthCheck);
	requireFunction("createRovoPool", createRovoPool);
	requireFunction("debugLog", debugLog);
	requireFunction("fsModule.existsSync", fsModule?.existsSync);
	requireFunction("getBasePort", getBasePort);
	requireFunction("initPool", initPool);
	requireFunction("logger.log", logger?.log);
	requireFunction("logger.warn", logger?.warn);
	requireFunction("now", now);
	requireFunction("onPortAvailable", onPortAvailable);
	requireFunction("resolveRovoPorts", resolveRovoPorts);
	requireFunction("rovoHealthCheck", rovoHealthCheck);
	requireFunction("waitForReady", waitForReady);

	let rovoAvailable = false;
	let rovoChecked = false;
	let rovoLastRefresh = 0;
	let rovoPool = null;

	function clearRovoPool() {
		if (rovoPool) {
			rovoPool.shutdown();
			rovoPool = null;
			initPool(null);
		}
	}

	function getRovoPool() {
		return rovoPool;
	}

	function shutdownRovoPool() {
		if (rovoPool) {
			rovoPool.shutdown();
		}
	}

	async function refreshRovoAvailability() {
		try {
			const { ports, source } = await resolveRovoPorts({
				portFile,
				portsFile,
				envPort: env.ROVO_PORT,
				basePort: getBasePort(),
				maxTries,
				healthCheck: rovoHealthCheck,
				classifyHealthCheck: classifyRovoHealthCheck,
				persistDiscoveredPorts: true,
			});
			if (ports.length === 0) {
				clearRovoPool();
				rovoAvailable = false;
				rovoChecked = true;
				return false;
			}

			if (source === "discovered") {
				logger.warn(
					`[ROVO] Rediscovered healthy Rovo port files from live serve instance(s): ${ports.join(", ")}`
				);
			}

			const healthyPorts = [];
			for (const port of ports) {
				try {
					const health = await rovoHealthCheck(port);
					const classifiedHealth = classifyRovoHealthCheck(health);
					if (classifiedHealth.ready) {
						healthyPorts.push(port);
						continue;
					}

					if (classifiedHealth.terminal) {
						logger.warn("[ROVO] Port health requires attention", {
							port,
							status: classifiedHealth.status,
							reason: classifiedHealth.reason,
							message: classifiedHealth.message,
						});
						continue;
					}

					debugLog("ROVO", `Port ${port} health check returned ${classifiedHealth.status || "unknown"}`, {
						status: classifiedHealth.status,
						reason: classifiedHealth.reason,
					});
				} catch (healthCheckErr) {
					debugLog("ROVO", `Port ${port} health check failed`, {
						error: healthCheckErr.message,
					});
				}
			}

			if (healthyPorts.length === 0) {
				clearRovoPool();
				rovoAvailable = false;
				rovoChecked = true;
				return false;
			}

			env.ROVO_PORT = String(healthyPorts[0]);

			if (rovoPool) {
				rovoPool.updatePorts(healthyPorts);
			} else {
				rovoPool = createRovoPool(healthyPorts, {
					waitForReady,
					onPortAvailable: () => {
						void onPortAvailable();
					},
				});
				initPool(rovoPool);
			}

			if (healthyPorts.length === 1) {
				logger.log(`[ROVO] Serve available on port ${healthyPorts[0]}`);
			} else {
				logger.log(`[ROVO] Pool initialized: ${healthyPorts.length} ports (${healthyPorts.join(", ")})`);
			}

			rovoAvailable = true;
			rovoChecked = true;
			return true;
		} catch (err) {
			rovoAvailable = false;
			rovoChecked = true;
			debugLog("ROVO", "Not available", { error: err.message });
			return false;
		}
	}

	async function isRovoAvailable() {
		const portsFileExists = typeof portsFile === "string" && fsModule.existsSync(portsFile);
		const portFileExists = typeof portFile === "string" && fsModule.existsSync(portFile);

		if (!portsFileExists && !portFileExists) {
			if (rovoAvailable) {
				logger.warn("[ROVO] Port files removed — attempting Rovo rediscovery");
			}
			rovoChecked = false;
		}

		if (!rovoChecked || !rovoAvailable) {
			return refreshRovoAvailability();
		}

		const currentTime = now();
		if (!rovoLastRefresh) {
			rovoLastRefresh = currentTime;
		}
		if (currentTime - rovoLastRefresh > refreshIntervalMs) {
			rovoLastRefresh = currentTime;
			return refreshRovoAvailability();
		}

		return rovoAvailable;
	}

	function resolveRovoAppPortAvailability() {
		const poolStatus = rovoPool?.getStatus?.();
		if (!rovoPool) {
			return null;
		}

		const poolPorts = Array.isArray(poolStatus?.ports) ? poolStatus.ports : [];
		if (poolPorts.length === 0) {
			return null;
		}
		const hasAvailable = poolPorts.some((p) => p?.status === "available");
		return hasAvailable ? { available: true } : null;
	}

	return {
		getRovoPool,
		isRovoAvailable,
		refreshRovoAvailability,
		resolveRovoAppPortAvailability,
		shutdownRovoPool,
	};
}

module.exports = {
	createRovoAvailabilityService,
};
