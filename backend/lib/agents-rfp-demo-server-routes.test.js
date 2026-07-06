const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const JOB_OWNER_SOURCE = fs.readFileSync(path.join(__dirname, "agents-rfp-demo-job-owner.js"), "utf8");
const DEMOS_ROUTE_SOURCE = fs.readFileSync(path.join(__dirname, "..", "routes", "demos.js"), "utf8");
const JOBS_ROUTE_SOURCE = fs.readFileSync(path.join(__dirname, "..", "routes", "jobs.js"), "utf8");

test("Agents RFP demo backend routes expose persisted state, apply, event, and reset contracts", () => {
	assert.match(DEMOS_ROUTE_SOURCE, /router\.get\("\/agents\/rfp-demo\/state"/u);
	assert.match(DEMOS_ROUTE_SOURCE, /router\.post\("\/agents\/rfp-demo\/state"/u);
	assert.match(DEMOS_ROUTE_SOURCE, /router\.post\("\/agents\/rfp-demo\/agent\/apply"/u);
	assert.match(DEMOS_ROUTE_SOURCE, /router\.post\("\/agents\/rfp-demo\/events\/ticket-entered-column"/u);
	assert.match(DEMOS_ROUTE_SOURCE, /router\.post\("\/agents\/rfp-demo\/reset"/u);
	assert.match(DEMOS_ROUTE_SOURCE, /const state = await advanceAgentsRfpDemoProcessing\(\);/u);
	assert.match(DEMOS_ROUTE_SOURCE, /agentsRfpDemoStateManager\.updateState\(\(currentState\) => \(\s*moveTicketToColumnFn\(currentState, ticketCode, targetColumn\)\s*\)\)/u);
	assert.match(DEMOS_ROUTE_SOURCE, /runAgentsRfpDemoJob\(\{[\s\S]*source: "agent-apply"[\s\S]*\}\)/u);
	assert.match(DEMOS_ROUTE_SOURCE, /runAgentsRfpDemoJob\(\{[\s\S]*source: "jira-column-entered"[\s\S]*ticketCodes: \[ticketCode\]/u);
	assert.match(DEMOS_ROUTE_SOURCE, /targetColumn !== rfpDraftingEventTrigger\.column \|\| !state\.agent\?\.trigger/u);
	assert.match(JOB_OWNER_SOURCE, /createHtmlReport: async \(\{ contextDescription, fields \}\) =>/u);
});

test("Agents RFP demo reset removes the demo Hermes job and demo-created Rovo threads", () => {
	assert.match(DEMOS_ROUTE_SOURCE, /getDemoCreatedThreadIdsFn\(currentState\)/u);
	assert.match(DEMOS_ROUTE_SOURCE, /deleteAgentsRfpDemoHermesJobs\(currentState\)/u);
	assert.match(DEMOS_ROUTE_SOURCE, /deleteAgentsRfpDemoThread\(threadId\)/u);
	assert.match(JOB_OWNER_SOURCE, /hermesJobsProvider\.deleteHermesJob\(jobId\)/u);
	assert.match(JOB_OWNER_SOURCE, /hermesJobLinkManager\.removeLink\(jobId\)/u);
	assert.match(JOB_OWNER_SOURCE, /rovoAppThreadManager\.deleteThread\(threadId\)/u);
});

test("Agents RFP demo reset only closes browser workspaces for existing Rovo threads", () => {
	assert.match(
		JOB_OWNER_SOURCE,
		/if \(thread\) \{[\s\S]*deleteRovoAppThreadBrowserWorkspace\(threadId\)[\s\S]*destroyMirrorBrowser\(`mirror-\$\{threadId\}`\);[\s\S]*\}/u,
	);
	assert.doesNotMatch(
		JOB_OWNER_SOURCE,
		/await rovoAppDocumentManager\.deleteDocumentsByThread\(threadId\);\n\t+await deleteRovoAppThreadBrowserWorkspace\(threadId\)/u,
	);
});

test("Hermes run actions return merged job metadata so event jobs keep trigger state", () => {
	assert.match(JOBS_ROUTE_SOURCE, /persistHermesJobLink\(req\.params\.id, req\.body, \{\}, \{ mergeExisting: true \}\)/u);
	assert.match(JOBS_ROUTE_SOURCE, /router\.post\("\/:id\/run"[\s\S]*await hermesJobsProvider\.performHermesJobAction\(req\.params\.id, "run"\);[\s\S]*const job = await getMergedHermesJob\(req\.params\.id\);/u);
	assert.match(JOBS_ROUTE_SOURCE, /router\.post\("\/:id\/pause"[\s\S]*const job = await getMergedHermesJob\(req\.params\.id\);/u);
	assert.match(JOBS_ROUTE_SOURCE, /router\.post\("\/:id\/resume"[\s\S]*const job = await getMergedHermesJob\(req\.params\.id\);/u);
});
