"use strict";

const crypto = require("node:crypto");

const {
	appendRuntimeSocketToken: appendRuntimeSocketTokenWithOptions,
	createRuntimeSocketToken: createRuntimeSocketTokenWithOptions,
	isAllowedRuntimeSocketOrigin: isRuntimeSocketOriginAllowed,
	isRuntimeSocketTokenValid: isRuntimeSocketTokenValidWithOptions,
} = require("../lib/runtime-socket-security");
const { getNonEmptyString } = require("../lib/shared-utils");
const { resolveAllowedOrigins } = require("./security");

const RUNTIME_SOCKET_TOKEN_TTL_MS = 60_000;

function resolveRuntimeAdminConfig(env = process.env) {
	return {
		runtimeAdminRequired:
			env.NODE_ENV === "production" ||
			env.VPK_REQUIRE_RUNTIME_ADMIN === "true",
		runtimeAdminToken: getNonEmptyString(env.VPK_RUNTIME_ADMIN_TOKEN),
		runtimeSocketTokenTtlMs: RUNTIME_SOCKET_TOKEN_TTL_MS,
	};
}

function assertRuntimeAdminConfig({
	runtimeAdminRequired,
	runtimeAdminToken,
}, {
	consoleImpl = console,
	exit = process.exit,
} = {}) {
	if (runtimeAdminRequired && !runtimeAdminToken) {
		consoleImpl.error(
			"[STARTUP] VPK_RUNTIME_ADMIN_TOKEN is required when runtime admin protection is enabled."
		);
		exit(1);
		return false;
	}
	return true;
}

function getRuntimeAdminTokenFromRequest(req) {
	const headerToken = getNonEmptyString(req.get?.("x-vpk-runtime-admin-token"));
	if (headerToken) {
		return headerToken;
	}

	const authorization = getNonEmptyString(req.get?.("authorization"));
	const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i);
	if (bearerMatch) {
		return bearerMatch[1].trim();
	}

	return getNonEmptyString(req.query?.runtimeToken ?? req.query?.token);
}

function isRuntimeAdminTokenValid(token, runtimeAdminToken) {
	if (!runtimeAdminToken || !token) {
		return false;
	}

	const tokenBuffer = Buffer.from(token);
	const expectedBuffer = Buffer.from(runtimeAdminToken);
	if (tokenBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return Boolean(
		crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
	);
}

function createRuntimeAdminControls({
	allowedOrigins,
	consoleImpl = console,
	env = process.env,
	exit = process.exit,
} = {}) {
	const {
		runtimeAdminRequired,
		runtimeAdminToken,
		runtimeSocketTokenTtlMs,
	} = resolveRuntimeAdminConfig(env);
	const resolvedAllowedOrigins = allowedOrigins ?? resolveAllowedOrigins(env);

	assertRuntimeAdminConfig({
		runtimeAdminRequired,
		runtimeAdminToken,
	}, {
		consoleImpl,
		exit,
	});

	function requireRuntimeAdmin(req, res, next) {
		if (!runtimeAdminToken && !runtimeAdminRequired) {
			return next();
		}

		if (isRuntimeAdminTokenValid(getRuntimeAdminTokenFromRequest(req), runtimeAdminToken)) {
			return next();
		}

		return res.status(runtimeAdminToken ? 403 : 503).json({
			error: "Runtime admin authorization required",
		});
	}

	function createRuntimeSocketToken(scope) {
		return createRuntimeSocketTokenWithOptions(scope, {
			runtimeAdminToken,
			ttlMs: runtimeSocketTokenTtlMs,
		});
	}

	function isRuntimeSocketTokenValid(token, expectedScope) {
		return isRuntimeSocketTokenValidWithOptions(token, expectedScope, {
			runtimeAdminToken,
		});
	}

	function appendRuntimeSocketToken(wsUrl, scope, paramName) {
		return appendRuntimeSocketTokenWithOptions(wsUrl, scope, paramName, {
			runtimeAdminToken,
			ttlMs: runtimeSocketTokenTtlMs,
		});
	}

	function isAllowedRuntimeSocketOrigin(origin, request) {
		return isRuntimeSocketOriginAllowed(
			origin,
			request.headers.host,
			resolvedAllowedOrigins,
		);
	}

	function requireRuntimeSocketTokenRequester(req, res, next) {
		if (isAllowedRuntimeSocketOrigin(req.get?.("origin"), req)) {
			return next();
		}

		return res.status(403).json({
			error: "Runtime socket token origin is not allowed",
		});
	}

	return {
		appendRuntimeSocketToken,
		createRuntimeSocketToken,
		isAllowedRuntimeSocketOrigin,
		isRuntimeSocketTokenValid,
		requireRuntimeAdmin,
		requireRuntimeSocketTokenRequester,
		runtimeAdminRequired,
		runtimeAdminToken,
		runtimeSocketTokenTtlMs,
	};
}

module.exports = {
	RUNTIME_SOCKET_TOKEN_TTL_MS,
	assertRuntimeAdminConfig,
	createRuntimeAdminControls,
	getRuntimeAdminTokenFromRequest,
	isRuntimeAdminTokenValid,
	resolveRuntimeAdminConfig,
};
