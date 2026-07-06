"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	getWildcardRouteValue,
	registerSkillsRoutes,
} = require("./skills");

async function withServer(run, overrides = {}) {
	const app = express();
	app.use(express.json());

	const calls = {
		approveDraft: [],
		browse: [],
		getBundle: [],
		getSkill: [],
		inspect: [],
		installBundle: [],
		list: [],
		search: [],
		taps: [],
		toggle: [],
	};

	registerSkillsRoutes(app, {
		archiveHermesSkill: async () => ({}),
		createHermesSkillFromBundle: async () => ({}),
		getHermesSkill: async (category, name) => {
			calls.getSkill.push({ category, name });
			return { category, name };
		},
		getHermesSkillBundle: async (category, name) => {
			calls.getBundle.push({ category, name });
			return { category, files: [], name };
		},
		hermesSkillDraftManager: {
			approveDraft: async (id) => {
				calls.approveDraft.push(id);
				return { id, sourceThreadId: "thread-1", status: "approved" };
			},
			deleteDraft: async (id) => ({ id }),
			getDraft: async (id) => ({ id }),
			listDrafts: async () => [{ id: "draft-1" }],
			rejectDraft: async (id) => ({ id }),
		},
		listHermesSkills: async ({ query }) => {
			calls.list.push(query);
			return [{ id: "skill-1", name: "Skill 1" }];
		},
		parseOptionalBoolean: (value) => {
			if (value === true || value === "true") {
				return true;
			}
			if (value === false || value === "false") {
				return false;
			}
			return null;
		},
		requireRuntimeAdmin: (req, res, next) => {
			if (req.headers["x-runtime-admin"] !== "allowed") {
				return res.status(403).json({ error: "runtime admin required" });
			}
			return next();
		},
		skillsHubClient: {
			browse: async (options) => {
				calls.browse.push(options);
				return { page: options.page, pageSize: options.pageSize, skills: [] };
			},
			checkUpdates: async (name) => [{ name }],
			inspect: async (identifier) => {
				calls.inspect.push(identifier);
				return { identifier };
			},
			installFromBundle: async (bundle) => {
				calls.installBundle.push(bundle);
				return { installed: bundle.name };
			},
			installFromIdentifier: async (identifier, options) => ({ identifier, ...options }),
			listInstalled: async () => [{ name: "installed" }],
			manageTaps: async (...args) => {
				calls.taps.push(args);
				if (args[0] === "list") {
					return { taps: ["repo/a"] };
				}
				return { success: true };
			},
			search: async (query, options) => {
				calls.search.push({ options, query });
				return [{ identifier: "skill/a" }];
			},
			uninstall: async (name) => ({ name, success: true }),
		},
		syncThreadPendingSkillDraftIds: async () => {},
		toggleHermesSkill: async (category, name, enabled) => {
			calls.toggle.push({ category, enabled, name });
			return { category, enabled, name };
		},
		updateHermesSkillFromBundle: async () => ({}),
		...overrides,
	});

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl, calls);
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

test("getWildcardRouteValue preserves Express 5 wildcard path segments", () => {
	assert.equal(getWildcardRouteValue(["owner", "repo", "skill"]), "owner/repo/skill");
	assert.equal(getWildcardRouteValue(" skill-name "), "skill-name");
	assert.equal(getWildcardRouteValue(""), null);
});

test("skills router lists skills with q/query aliases", async () => {
	await withServer(async (baseUrl, calls) => {
		const response = await fetch(`${baseUrl}/api/skills?q=agent`);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			skills: [{ id: "skill-1", name: "Skill 1" }],
		});
		assert.deepEqual(calls.list, ["agent"]);
	});
});

test("skills router keeps hub query parsing and wildcard params", async () => {
	await withServer(async (baseUrl, calls) => {
		const searchResponse = await fetch(`${baseUrl}/api/skills/hub/search?q=writer&source=trusted&limit=7`);
		assert.equal(searchResponse.status, 200);
		assert.deepEqual(calls.search, [{
			options: { limit: 7, source: "trusted" },
			query: "writer",
		}]);

		const browseResponse = await fetch(`${baseUrl}/api/skills/hub/browse?page=3&pageSize=9&source=community`);
		assert.equal(browseResponse.status, 200);
		assert.deepEqual(calls.browse, [{ page: 3, pageSize: 9, source: "community" }]);

		const inspectResponse = await fetch(`${baseUrl}/api/skills/hub/inspect/owner/repo/skill`);
		assert.equal(inspectResponse.status, 200);
		assert.deepEqual(await inspectResponse.json(), { identifier: "owner/repo/skill" });
		assert.deepEqual(calls.inspect, ["owner/repo/skill"]);
	});
});

test("skills router keeps runtime-admin protection on mutating routes and drafts", async () => {
	await withServer(async (baseUrl) => {
		for (const [method, path] of [
			["POST", "/api/skills/hub/install"],
			["POST", "/api/skills/hub/install-by-id"],
			["DELETE", "/api/skills/hub/uninstall/skill-name"],
			["POST", "/api/skills/hub/taps"],
			["DELETE", "/api/skills/hub/taps/owner/repo"],
			["POST", "/api/skills/community/skill-name/toggle"],
			["GET", "/api/skills/drafts"],
			["POST", "/api/skills/drafts/draft-1/approve"],
		]) {
			const response = await fetch(`${baseUrl}${path}`, {
				headers: method === "DELETE" || method === "GET" ? undefined : { "content-type": "application/json" },
				method,
				body: method === "DELETE" || method === "GET" ? undefined : "{}",
			});
			assert.equal(response.status, 403, `${method} ${path}`);
		}
	});
});

test("skills router installs, toggles, and serves detail routes", async () => {
	await withServer(async (baseUrl, calls) => {
		const installResponse = await fetch(`${baseUrl}/api/skills/hub/install`, {
			body: JSON.stringify({ files: [], name: "bundle-skill" }),
			headers: {
				"content-type": "application/json",
				"x-runtime-admin": "allowed",
			},
			method: "POST",
		});
		assert.equal(installResponse.status, 201);
		assert.deepEqual(await installResponse.json(), { installed: "bundle-skill" });
		assert.deepEqual(calls.installBundle, [{ files: [], name: "bundle-skill" }]);

		const toggleResponse = await fetch(`${baseUrl}/api/skills/community/skill-name/toggle?enabled=true`, {
			body: "{}",
			headers: {
				"content-type": "application/json",
				"x-runtime-admin": "allowed",
			},
			method: "POST",
		});
		assert.equal(toggleResponse.status, 200);
		assert.deepEqual(calls.toggle, [{
			category: "community",
			enabled: true,
			name: "skill-name",
		}]);

		const detailResponse = await fetch(`${baseUrl}/api/skills/community/skill-name`);
		assert.equal(detailResponse.status, 200);
		assert.deepEqual(calls.getSkill, [{ category: "community", name: "skill-name" }]);

		const bundleResponse = await fetch(`${baseUrl}/api/skills/community/skill-name/bundle`);
		assert.equal(bundleResponse.status, 200);
		assert.deepEqual(calls.getBundle, [{ category: "community", name: "skill-name" }]);
	});
});
