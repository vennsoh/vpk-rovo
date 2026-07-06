const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getReadonlyBlockedWriteToolNames,
	isReadonlyToolBlockMessage,
	isWorkspaceWriteToolName,
	looksLikeWriteBlockedTurn,
} = require("./write-block-detection");

test("isWorkspaceWriteToolName detects write-capable tool names", () => {
	for (const toolName of [
		"create_file",
		"find_and_replace_code",
		"move_file",
		"delete_file",
		"bash",
		"powershell",
		" BASH ",
	]) {
		assert.equal(isWorkspaceWriteToolName(toolName), true, toolName);
	}

	assert.equal(isWorkspaceWriteToolName("read_file"), false);
	assert.equal(isWorkspaceWriteToolName(null), false);
});

test("isReadonlyToolBlockMessage detects readonly block messages", () => {
	assert.equal(isReadonlyToolBlockMessage("blocked in readonly mode"), true);
	assert.equal(isReadonlyToolBlockMessage("This operation is currently blocked."), true);
	assert.equal(isReadonlyToolBlockMessage("regular command output"), false);
	assert.equal(isReadonlyToolBlockMessage(""), false);
});

test("getReadonlyBlockedWriteToolNames returns unique write tools with readonly blocks", () => {
	assert.deepEqual(
		getReadonlyBlockedWriteToolNames([
			{ toolName: "bash", text: "blocked in readonly mode" },
			{ toolName: "bash", text: "operation is currently blocked" },
			{ toolName: "read_file", text: "blocked in readonly mode" },
			{ toolName: "create_file", text: "created file" },
			{ toolName: "delete_file", text: "Operation is currently blocked." },
		]),
		["bash", "delete_file"],
	);
	assert.deepEqual(getReadonlyBlockedWriteToolNames(null), []);
});

test("looksLikeWriteBlockedTurn checks observations before assistant text", () => {
	assert.equal(looksLikeWriteBlockedTurn({
		assistantText: "Here are the search results.",
		toolObservationEntries: [
			{ toolName: "create_file", text: "blocked in readonly mode" },
		],
	}), true);

	assert.equal(looksLikeWriteBlockedTurn({
		assistantText:
			"The create step failed because this operation is currently blocked in readonly mode. Please retry later.",
		toolObservationEntries: [],
	}), true);

	assert.equal(looksLikeWriteBlockedTurn({
		assistantText: "The requested data is ready.",
		toolObservationEntries: [],
	}), false);
});
