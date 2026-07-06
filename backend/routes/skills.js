"use strict";

const express = require("express");

const { getNonEmptyString } = require("../lib/shared-utils");
const { registerHermesSkillDraftRoutes } = require("../lib/hermes-skill-draft-routes");

function getFirstQueryValue(value) {
	return Array.isArray(value) ? value[0] : value;
}

function parseIntegerQuery(value, fallbackValue) {
	const rawValue = getFirstQueryValue(value);
	return rawValue ? parseInt(rawValue, 10) : fallbackValue;
}

function getWildcardRouteValue(value) {
	if (Array.isArray(value)) {
		return getNonEmptyString(value.join("/"));
	}

	return getNonEmptyString(value);
}

function createSkillsRouter({
	getHermesSkill,
	getHermesSkillBundle,
	listHermesSkills,
	parseOptionalBoolean,
	requireRuntimeAdmin,
	skillsHubClient,
	toggleHermesSkill,
} = {}) {
	if (typeof getHermesSkill !== "function") {
		throw new Error("createSkillsRouter requires getHermesSkill");
	}
	if (typeof getHermesSkillBundle !== "function") {
		throw new Error("createSkillsRouter requires getHermesSkillBundle");
	}
	if (typeof listHermesSkills !== "function") {
		throw new Error("createSkillsRouter requires listHermesSkills");
	}
	if (typeof parseOptionalBoolean !== "function") {
		throw new Error("createSkillsRouter requires parseOptionalBoolean");
	}
	if (typeof requireRuntimeAdmin !== "function") {
		throw new Error("createSkillsRouter requires requireRuntimeAdmin");
	}
	if (!skillsHubClient || typeof skillsHubClient !== "object") {
		throw new Error("createSkillsRouter requires skillsHubClient");
	}
	if (typeof toggleHermesSkill !== "function") {
		throw new Error("createSkillsRouter requires toggleHermesSkill");
	}

	const router = express.Router();

	router.get("/", async (req, res) => {
		try {
			const skills = await listHermesSkills({
				query: getFirstQueryValue(req.query.q) ?? getFirstQueryValue(req.query.query),
			});
			return res.json({ skills });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to list Hermes skills",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/hub/search", async (req, res) => {
		try {
			const query = getFirstQueryValue(req.query.q);
			const source = getFirstQueryValue(req.query.source);
			const limit = getFirstQueryValue(req.query.limit);
			const results = await skillsHubClient.search(query || "", {
				source: source || "all",
				limit: limit ? parseInt(limit, 10) : 10,
			});
			return res.status(200).json({ results });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to search skills hub",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/hub/browse", async (req, res) => {
		try {
			const page = parseIntegerQuery(req.query.page, 1);
			const pageSize = parseIntegerQuery(req.query.pageSize, 20);
			const source = getFirstQueryValue(req.query.source);
			const result = await skillsHubClient.browse({ page, pageSize, source: source || "all" });
			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({
				error: "Failed to browse skills hub",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/hub/inspect/*identifier", async (req, res) => {
		try {
			const identifier = getWildcardRouteValue(req.params.identifier);
			if (!identifier) {
				return res.status(400).json({ error: "Identifier required" });
			}
			const result = await skillsHubClient.inspect(identifier);
			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({
				error: "Failed to inspect skill",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/hub/installed", async (_req, res) => {
		try {
			const installed = await skillsHubClient.listInstalled();
			return res.status(200).json({ skills: installed });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to list installed hub skills",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.post("/hub/install", requireRuntimeAdmin, async (req, res) => {
		try {
			const bundle = req.body;
			if (!bundle || typeof bundle !== "object" || !bundle.name) {
				return res.status(400).json({ error: "Invalid skill bundle: name and files required" });
			}
			const result = await skillsHubClient.installFromBundle(bundle);
			return res.status(201).json(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const statusCode = /traversal|absolute/iu.test(message) ? 400 : 500;
			return res.status(statusCode).json({
				error: "Failed to install skill",
				details: message,
			});
		}
	});

	router.post("/hub/install-by-id", requireRuntimeAdmin, async (req, res) => {
		try {
			const { identifier, category, force } = req.body || {};
			if (!identifier || typeof identifier !== "string") {
				return res.status(400).json({ error: "Identifier required" });
			}
			const result = await skillsHubClient.installFromIdentifier(identifier, { category, force });
			return res.status(201).json(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const statusCode = /already installed/iu.test(message) ? 409 : 500;
			return res.status(statusCode).json({
				error: "Failed to install skill",
				details: message,
			});
		}
	});

	router.delete("/hub/uninstall/*name", requireRuntimeAdmin, async (req, res) => {
		try {
			const name = getWildcardRouteValue(req.params.name);
			if (!name) {
				return res.status(400).json({ error: "Skill name required" });
			}
			const result = await skillsHubClient.uninstall(name);
			if (!result.success) {
				return res.status(404).json({ error: result.message });
			}
			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({
				error: "Failed to uninstall skill",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/hub/check", async (req, res) => {
		try {
			const name = getFirstQueryValue(req.query.name);
			const results = await skillsHubClient.checkUpdates(name || undefined);
			return res.status(200).json({ results });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to check for updates",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/hub/taps", async (_req, res) => {
		try {
			const result = await skillsHubClient.manageTaps("list");
			return res.status(200).json({ taps: result.taps || [] });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to list taps",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.post("/hub/taps", requireRuntimeAdmin, async (req, res) => {
		try {
			const { repo, path: repoPath } = req.body || {};
			if (!repo || typeof repo !== "string") {
				return res.status(400).json({ error: "Repo required" });
			}
			const result = await skillsHubClient.manageTaps("add", repo, repoPath);
			return res.status(result.success ? 201 : 200).json(result);
		} catch (error) {
			return res.status(500).json({
				error: "Failed to add tap",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.delete("/hub/taps/*repo", requireRuntimeAdmin, async (req, res) => {
		try {
			const repo = getWildcardRouteValue(req.params.repo);
			if (!repo) {
				return res.status(400).json({ error: "Repo required" });
			}
			const result = await skillsHubClient.manageTaps("remove", repo);
			if (!result.success) {
				return res.status(404).json(result);
			}
			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({
				error: "Failed to remove tap",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/:category/:name", async (req, res) => {
		try {
			const skill = await getHermesSkill(req.params.category, req.params.name);
			return res.json({ skill });
		} catch (error) {
			if (error?.code === "ENOENT") {
				return res.status(404).json({
					error: "Hermes skill not found",
				});
			}
			return res.status(500).json({
				error: "Failed to load Hermes skill",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.get("/:category/:name/bundle", async (req, res) => {
		try {
			const skill = await getHermesSkillBundle(req.params.category, req.params.name);
			return res.json({ skill });
		} catch (error) {
			if (error?.code === "ENOENT") {
				return res.status(404).json({
					error: "Hermes skill not found",
				});
			}
			return res.status(500).json({
				error: "Failed to load Hermes skill bundle",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	router.post("/:category/:name/toggle", requireRuntimeAdmin, async (req, res) => {
		try {
			const enabled = parseOptionalBoolean(
				getFirstQueryValue(req.query.enabled) ?? req.body?.enabled,
			);
			const skill = await toggleHermesSkill(req.params.category, req.params.name, enabled);
			return res.json({ skill });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const statusCode = /not found/i.test(message) ? 404 : 400;
			return res.status(statusCode).json({
				error: "Failed to toggle Hermes skill",
				details: message,
			});
		}
	});

	return router;
}

function registerSkillsRoutes(app, dependencies) {
	const {
		archiveHermesSkill,
		createHermesSkillFromBundle,
		hermesSkillDraftManager,
		requireRuntimeAdmin,
		syncThreadPendingSkillDraftIds,
		updateHermesSkillFromBundle,
	} = dependencies ?? {};

	app.use("/api/skills/drafts", requireRuntimeAdmin);
	registerHermesSkillDraftRoutes(app, {
		archiveSkillImpl: archiveHermesSkill,
		createSkillFromBundleImpl: createHermesSkillFromBundle,
		draftManager: hermesSkillDraftManager,
		syncThreadPendingSkillDraftIdsImpl: syncThreadPendingSkillDraftIds,
		updateSkillFromBundleImpl: updateHermesSkillFromBundle,
	});
	app.use("/api/skills", createSkillsRouter(dependencies));
}

module.exports = {
	createSkillsRouter,
	getWildcardRouteValue,
	registerSkillsRoutes,
};
