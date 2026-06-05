import { createHash } from "node:crypto";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import * as esbuild from "esbuild";

const htmlExtension = ".html";
const hashLength = 10;
const assetCdnOrigin = "https://cdn.divinefitout.com";

const cssEntryPoint = "css/styles.css";
const cssOutputDir = "css";
const cssBaseName = "styles";
const cssExtension = ".css";

const jsEntryPoint = "js/site.js";
const jsOutputDir = "js";
const jsBaseName = "site";
const jsExtension = ".js";

const styleHrefPattern = /(?:https:\/\/cdn\.divinefitout\.com\/|(?:\.\.\/)?)(css\/)styles(?:\.[a-f0-9]{10})?\.min\.css(?:\?v=[^"'\\s>)]*)?/g;
const scriptSrcPattern = /(?:https:\/\/cdn\.divinefitout\.com\/|(?:\.\.\/)?)(js\/)site(?:\.[a-f0-9]{10})?\.min\.js(?:\?v=[^"'\\s>)]*)?/g;

export async function buildAssets() {
  const [cssAsset, jsAsset] = await Promise.all([
    buildHashedAsset({
      entryPoint: cssEntryPoint,
      outputDir: cssOutputDir,
      baseName: cssBaseName,
      extension: cssExtension
    }),
    buildHashedAsset({
      entryPoint: jsEntryPoint,
      outputDir: jsOutputDir,
      baseName: jsBaseName,
      extension: jsExtension
    })
  ]);

  const htmlFiles = await updateHtmlAssetReferences({
    cssFileName: cssAsset.fileName,
    jsFileName: jsAsset.fileName
  });

  return {
    cssFileName: cssAsset.fileName,
    jsFileName: jsAsset.fileName,
    htmlFiles
  };
}

export function formatBuildSummary({ cssFileName, jsFileName, htmlFiles }) {
  return [
    `CSS file: ${cssFileName}`,
    `JS file: ${jsFileName}`,
    `Updated HTML files: ${htmlFiles.length}`
  ].join("\n");
}

async function buildHashedAsset({ entryPoint, outputDir, baseName, extension }) {
  const stagedFileName = `${baseName}.min${extension}`;
  const stagedOutputPath = join(outputDir, stagedFileName);
  const buildResult = await esbuild.build({
    entryPoints: [entryPoint],
    minify: true,
    legalComments: "none",
    outfile: stagedOutputPath,
    write: false
  });

  const outputFile = buildResult.outputFiles?.[0];
  if (!outputFile) {
    throw new Error(`Missing build output for ${entryPoint}`);
  }

  const hash = createHash("sha256").update(outputFile.contents).digest("hex").slice(0, hashLength);
  const hashedFileName = `${baseName}.${hash}.min${extension}`;
  const hashedOutputPath = join(outputDir, hashedFileName);

  await cleanupAssetDirectory(outputDir, createAssetMatcher(baseName, extension), hashedFileName);
  await writeFile(hashedOutputPath, outputFile.contents);

  return { fileName: hashedFileName, filePath: hashedOutputPath };
}

async function updateHtmlAssetReferences({ cssFileName, jsFileName }) {
  const htmlFiles = await collectHtmlFiles(process.cwd());

  await Promise.all(
    htmlFiles.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const next = source
        .replace(styleHrefPattern, (_, assetDirectory) => `${assetCdnOrigin}/${assetDirectory}${cssFileName}`)
        .replace(scriptSrcPattern, (_, assetDirectory) => `${assetCdnOrigin}/${assetDirectory}${jsFileName}`);

      if (next !== source) {
        await writeFile(filePath, next, "utf8");
      }
    })
  );

  return htmlFiles;
}

function createAssetMatcher(baseName, extension) {
  return new RegExp(`^${baseName}(?:\\.[a-f0-9]{${hashLength}})?\\.min\\${extension}$`);
}

async function cleanupAssetDirectory(directoryPath, matcher, keepFileName) {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile() || entry.name === keepFileName || !matcher.test(entry.name)) {
        return;
      }

      await rm(join(directoryPath, entry.name), { force: true });
    })
  );
}

async function collectHtmlFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          return [];
        }

        return collectHtmlFiles(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith(htmlExtension)) {
        return [entryPath];
      }

      return [];
    })
  );

  return nestedFiles.flat().sort((left, right) =>
    relative(process.cwd(), left).localeCompare(relative(process.cwd(), right))
  );
}
