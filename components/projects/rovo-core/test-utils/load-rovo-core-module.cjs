const path = require("node:path");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadRovoCoreModule(relativePath) {
	const entryPoint = path.join(process.cwd(), "components/projects/rovo-core", relativePath);
	const result = esbuild.buildSync({
		entryPoints: [entryPoint],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, `${relativePath}.cjs`);
}

module.exports = { loadRovoCoreModule };
