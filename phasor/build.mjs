import { minify } from "terser"
import fs from 'fs';
import postcss from 'postcss';
import cssnano from 'cssnano';
import fsp from "fs/promises"
import path from "path"
import ts from "typescript"

const isProd = process.argv.includes("--prod");
const buildMaps = process.argv.includes("--map");

/** @type {{ "phasor-loader": boolean, "phasor-theme": boolean, "phasor-downloads": boolean, "phasor-document": boolean, "phasor-page": boolean }} */
const filesTS = {
	"phasor-loader": true,
	"phasor-theme": false,
	"phasor-downloads": false,
	"phasor-document": false,
	"phasor-page": false
};
const filesJS = {
	"easter-egg": false
}
/** @type {string[]} */
const filesCSS = [
	"phasor"
];

/** @type {string} */
const outputDir = "scripts";
/** @type {string} */
const outputDirCss = "themes";

/**
 * Wrapper to build JS files
 * @param {string} name - The base name of the file (without extension).
 * @param {boolean} module - Whether the original JS file was an ES module (`mjs`) or common JS (`js`).
 */
async function buildJS(name, module) {
	const ext = module ? "mjs" : "js";
	const inputPath = path.join("src", `${name}.${ext}`);

	try {
		const jsOutput = await fsp.readFile(inputPath, "utf-8");
		await minimizeJS(jsOutput, name, module, null);
	} catch (err) {
		console.error(`Failed to build ${name}.${ext}:`, err);
	}
}

/**
 * 
 * @param {string} jsOutput - The JavaScript code to minify.
 * @param {string} name - The base name of the file (without extension).
 * @param {boolean} module - Whether the original TS file was an ES module (`mts`) or regular TS (`ts`).
 * @param {Record<string, any> | null} tsMap - Optional source map object from TypeScript transpilation.
 */
async function minimizeJS(jsOutput, name, module, tsMap) {
	const outputPath = path.join(outputDir, `${name}.min.${module ? "mjs" : "js"}`);
	const minifyResult = await minify(jsOutput, {
		compress: isProd,
		mangle: isProd ? { toplevel: true } : false,
		sourceMap: tsMap
			? {
				content: tsMap,
				filename: `${name}.${module ? "mts" : "ts"}`,
				url: `${name}.min.${module ? "mjs" : "js"}.map`
			}: false
	});

	await fsp.mkdir(outputDir, { recursive: true });
	await fsp.writeFile(outputPath, minifyResult.code);
	if (minifyResult.map) await fsp.writeFile(`${outputPath}.map`, minifyResult.map);

	console.log(`Built ${name}.${module ? "mts" : "ts"} -> ${name}.min.${module ? "mjs" : "js"}${buildMaps ? "(.map)" : ""}`);
}

/**
 * @param {string} name - The base name of the file (without extension).
 * @param {boolean} module - Whether the original TS file was an ES module (`mts`) or regular TS (`ts`).
 */
async function buildTS(name, module) {
	const inputPath = path.join("src", `${name}.${module ? "mts" : "ts"}`);
	const tsSource = fs.readFileSync(inputPath, "utf8");

	const tsResult = ts.transpileModule(tsSource, {
		compilerOptions: {
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			sourceMap: buildMaps ? true : !isProd,
			strict: true
		},
		fileName: inputPath
	});

	const jsOutput = tsResult.outputText;
	const tsMap = tsResult.sourceMapText
		? { ...JSON.parse(tsResult.sourceMapText), sourceRoot: "/src" }
		: null;

	await minimizeJS(jsOutput, name, module, tsMap);
}

/** @param {string} name */
async function buildCss(name) {
	const inputPath = path.resolve('./src', `${name}.css`);
	const outputPath = path.resolve(outputDirCss, `${name}.min.css`);
	const cssSource = fs.readFileSync(inputPath, 'utf8');

	await fsp.mkdir(outputDirCss, { recursive: true });

	if (!isProd) {
		await fsp.writeFile(outputPath, cssSource)
		console.log(`Built ${name}.css`);
		return;
	}

	const cssResult = await postcss([cssnano]).process(cssSource, {
		from: inputPath,
		to: outputPath,
	});

    await fsp.writeFile(outputPath, cssResult.css);
    if (cssResult.map) await fsp.writeFile(`${outputPath}.map`, cssResult.map.toString());

    console.log(`Built ${name}.css -> ${name}.min.css`);
}

async function buildAll() {
	await Promise.all(Object.entries(filesTS).map(([name, isModule]) => buildTS(name, isModule)));
	await Promise.all(Object.entries(filesJS).map(([name, isModule]) => buildJS(name, isModule)));
	await Promise.all(filesCSS.map(buildCss));
}

buildAll().catch(err => {
	console.error(err);
	process.exit(1);
})
