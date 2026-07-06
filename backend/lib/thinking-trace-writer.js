/**
 * Generic writer for `data-thinking-status` + `data-thinking-event` parts.
 *
 * The frontend's `<AssistantThinkingTrace>` (in
 * `components/projects/shared/components/assistant-thinking-trace.tsx`)
 * populates `ChainOfThoughtStep` rows from `data-thinking-event` parts.
 * Any backend path that wants the populated chain-of-thought collapsible
 * just needs to emit start/result pairs in this shape.
 *
 * Originally extracted from the agents-rfp demo trace helpers; see
 * `backend/lib/agents-rfp-demo-chat-stream.js` for the preserved demo pattern.
 */

const DEFAULT_TOOL_CALL_DELAY_RANGE_MS = Object.freeze({
	min: 1800,
	max: 2800,
});

// Stagger between stacked narration rows within a single step so they appear
// one-by-one as believable progression instead of all at once.
const DEFAULT_NARRATION_ROW_DELAY_MS = 550;
const DEFAULT_TOOL_CALL_DELAY_MS = Math.round(
	(DEFAULT_TOOL_CALL_DELAY_RANGE_MS.min + DEFAULT_TOOL_CALL_DELAY_RANGE_MS.max) / 2,
);

function waitFor(delayMs, signal) {
	if (typeof delayMs !== "number" || !Number.isFinite(delayMs) || delayMs <= 0) {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}

		const timer = setTimeout(() => {
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		}, delayMs);

		const onAbort = () => {
			clearTimeout(timer);
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		};
		signal?.addEventListener?.("abort", onAbort, { once: true });
	});
}

function createThinkingEventPart(step, phase) {
	const timestamp = new Date().toISOString();
	const part = {
		type: "data-thinking-event",
		id: `${step.toolCallId}-${phase}`,
		data: {
			eventId: `${step.toolCallId}-${phase}`,
			phase,
			toolName: step.toolName,
			label: step.label,
			toolCallId: step.toolCallId,
			timestamp,
		},
	};

	if (phase === "start" && step.input !== undefined) {
		part.data.input = step.input;
	}
	if (phase === "result") {
		part.data.output = step.output ?? step.outputPreview ?? "Completed.";
		if (step.outputPreview) {
			part.data.outputPreview = step.outputPreview;
		}
	}

	return part;
}

/**
 * Resolve the ordered narration rows for a step as normalized
 * `{ content, input, output }` objects. Prefers `step.contentRows` (the stacked
 * multi-row form, where each row may carry its own `input`/`outputPreview`) and
 * falls back to the legacy single `step.content` string. Returns an empty array
 * when the step has no narration.
 */
function getStepNarrationRows(step) {
	if (Array.isArray(step?.contentRows)) {
		return step.contentRows
			.map((row) => {
				if (typeof row === "string") {
					return row.trim().length > 0 ? { content: row.trim() } : null;
				}
				if (row && typeof row.content === "string" && row.content.trim().length > 0) {
					return {
						content: row.content.trim(),
						input: row.input,
						output: row.output ?? row.outputPreview,
					};
				}
				return null;
			})
			.filter((row) => row !== null);
	}
	if (typeof step?.content === "string" && step.content.trim().length > 0) {
		return [{ content: step.content.trim() }];
	}
	return [];
}

function isPositiveFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function normalizeDelayRange(range) {
	if (!range || typeof range !== "object") {
		return null;
	}

	const min = Number(range.min);
	const max = Number(range.max);
	if (!isPositiveFiniteNumber(min) || !isPositiveFiniteNumber(max)) {
		return null;
	}

	return {
		min: Math.min(min, max),
		max: Math.max(min, max),
	};
}

function getRandomizedDelayMs(range, random = Math.random) {
	const normalizedRange = normalizeDelayRange(range);
	if (!normalizedRange) {
		return DEFAULT_TOOL_CALL_DELAY_MS;
	}

	if (normalizedRange.min === normalizedRange.max) {
		return Math.round(normalizedRange.min);
	}

	const randomValue = typeof random === "function" ? random() : Math.random();
	const clampedRandomValue = Math.min(1, Math.max(0, Number.isFinite(randomValue) ? randomValue : Math.random()));
	return Math.round(normalizedRange.min + (normalizedRange.max - normalizedRange.min) * clampedRandomValue);
}

function resolveToolCallDelayMs(step, options = {}) {
	if (isPositiveFiniteNumber(step?.delayMs)) {
		return step.delayMs;
	}
	if (isPositiveFiniteNumber(options.defaultDelayMs)) {
		return options.defaultDelayMs;
	}

	return getRandomizedDelayMs(
		options.defaultDelayRangeMs ?? DEFAULT_TOOL_CALL_DELAY_RANGE_MS,
		options.random,
	);
}

function resolveNarrationRowDelayMs(options = {}) {
	if (isPositiveFiniteNumber(options.narrationRowDelayMs)) {
		return options.narrationRowDelayMs;
	}
	return DEFAULT_NARRATION_ROW_DELAY_MS;
}

/**
 * Write a sequence of scripted thinking steps to a UI message stream writer.
 *
 * For each step:
 * 1. Emit the first `data-thinking-status` row (drives the collapsible trigger
 *    label) followed immediately by `data-thinking-event` phase=start (creates
 *    the ChainOfThoughtStep row in "running" state).
 * 2. Stream any remaining narration rows (`step.contentRows`) one at a time with
 *    a short stagger, so a step shows believable multi-row progression. These
 *    post-start rows associate with the active tool call (see
 *    `buildThinkingNarrationMap`).
 * 3. Wait out the remaining "running" beat.
 * 4. If the step has output, emit `data-thinking-event` phase=result
 *    (transitions the row to "completed").
 *
 * @param {object} writer        — UI message stream writer (must expose `.write()`)
 * @param {Array}  steps         — ordered list of step descriptors
 * @param {object} [options]
 * @param {number} [options.defaultDelayMs]      — exact per-step delay when step.delayMs is unset
 * @param {{min:number,max:number}} [options.defaultDelayRangeMs] — randomized per-step delay range
 * @param {number} [options.narrationRowDelayMs] — stagger between stacked narration rows
 * @param {() => number} [options.random]        — random source for tests
 * @param {AbortSignal} [options.signal]         — abort to short-circuit the loop
 */
async function writeThinkingTraceSteps(writer, steps, options = {}) {
	const { signal } = options;

	if (!Array.isArray(steps) || steps.length === 0) {
		return;
	}

	const narrationRowDelayMs = resolveNarrationRowDelayMs(options);

	for (const step of steps) {
		if (signal?.aborted) {
			return;
		}

		const narrationRows = getStepNarrationRows(step);
		const toolCallDelayMs = resolveToolCallDelayMs(step, options);
		const hasResult = step.output !== undefined || step.outputPreview;

		const writeNarrationRow = (row, rowIndex) => {
			const data = {
				label: step.label,
				content: row.content,
				// Stamp the owning tool call so the narration map groups this
				// row deterministically, even though it streams before/after
				// the step's own start event.
				toolCallId: step.toolCallId,
				activity: "data",
				source: "backend",
				timestamp: new Date().toISOString(),
			};
			// Per-row Parameters/Result so each row renders as its own sub-step.
			if (row.input !== undefined) {
				data.input = row.input;
			}
			if (row.output !== undefined) {
				data.output = row.output;
			}
			writer.write({
				type: "data-thinking-status",
				id: `${step.toolCallId}-status-${rowIndex}`,
				data,
			});
		};

		// Emit the first narration row + start event so the step row appears,
		// then stream the rest progressively.
		const [firstRow, ...restRows] = narrationRows;
		if (firstRow !== undefined) {
			writeNarrationRow(firstRow, 0);
		}
		writer.write(createThinkingEventPart(step, "start"));

		// Budget: stagger the extra rows, then spend the rest of the running beat
		// before the result. Never let the narration stagger exceed the step's
		// own running window.
		const narrationBudgetMs = Math.min(
			restRows.length * narrationRowDelayMs,
			Math.round(toolCallDelayMs * 0.6),
		);
		const perRowDelayMs = restRows.length > 0
			? Math.round(narrationBudgetMs / restRows.length)
			: 0;

		for (const [offset, row] of restRows.entries()) {
			if (signal?.aborted) {
				return;
			}
			await waitFor(perRowDelayMs, signal);
			if (signal?.aborted) {
				return;
			}
			writeNarrationRow(row, offset + 1);
		}

		const remainingRunMs = Math.max(0, toolCallDelayMs - narrationBudgetMs);
		const resultDelayMs = hasResult ? Math.round(remainingRunMs * 0.7) : remainingRunMs;
		const resultHoldDelayMs = hasResult ? Math.max(0, remainingRunMs - resultDelayMs) : 0;

		await waitFor(resultDelayMs, signal);
		if (hasResult && !signal?.aborted) {
			writer.write(createThinkingEventPart(step, "result"));
			if (resultHoldDelayMs > 0) {
				await waitFor(resultHoldDelayMs, signal);
			}
		}
	}
}

module.exports = {
	DEFAULT_TOOL_CALL_DELAY_MS,
	DEFAULT_TOOL_CALL_DELAY_RANGE_MS,
	createThinkingEventPart,
	writeThinkingTraceSteps,
	__internals: {
		getRandomizedDelayMs,
		normalizeDelayRange,
		resolveToolCallDelayMs,
		resolveNarrationRowDelayMs,
		getStepNarrationRows,
		DEFAULT_NARRATION_ROW_DELAY_MS,
	},
};
