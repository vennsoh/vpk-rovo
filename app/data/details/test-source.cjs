const { existsSync, readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..", "..");
const DETAIL_FILE_OVERRIDES = {
	ui: {
		icon: "icon-detail",
	},
};

function toObjectKey(slug) {
	return /^[A-Za-z_$][\w$]*$/.test(slug) ? slug : JSON.stringify(slug);
}

function getCategorySlugs(barrelSource, categoryDir) {
	const slugs = [];
	const entryPattern = /^\t(?:"([^"]+)"|([A-Za-z_$][\w$]*)): [A-Z0-9_]+_DETAIL,$/gmu;
	let match = entryPattern.exec(barrelSource);
	while (match) {
		slugs.push(match[1] ?? match[2]);
		match = entryPattern.exec(barrelSource);
	}

	if (slugs.length > 0) {
		return slugs;
	}

	return readdirSync(categoryDir)
		.filter((fileName) => fileName.endsWith(".ts"))
		.map((fileName) => fileName.replace(/\.ts$/u, ""))
		.sort();
}

function readSplitDetailSource(category, slug) {
	const fileSlug = DETAIL_FILE_OVERRIDES[category]?.[slug] ?? slug;
	const filePath = path.join(ROOT, "app", "data", "details", category, `${fileSlug}.ts`);
	return readFileSync(filePath, "utf8")
		.replace(/^import type \{ ComponentDetail \} from "@\/app\/data\/component-detail-types";\n\n/u, "")
		.replace(/^export const [A-Z0-9_]+_DETAIL: ComponentDetail = /u, `${toObjectKey(slug)}: `)
		.replace(/;\s*$/u, ",");
}

function readDetailCategorySource(category) {
	const barrelPath = path.join(ROOT, "app", "data", "details", `${category}.ts`);
	const barrelSource = readFileSync(barrelPath, "utf8");
	const categoryDir = path.join(ROOT, "app", "data", "details", category);

	if (!existsSync(categoryDir)) {
		return barrelSource;
	}

	const splitSources = getCategorySlugs(barrelSource, categoryDir).map((slug) =>
		readSplitDetailSource(category, slug)
	);
	return [barrelSource, ...splitSources].join("\n\n");
}

module.exports = {
	readDetailCategorySource,
};
