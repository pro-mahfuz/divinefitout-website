import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import * as esbuild from "esbuild";

const htmlExtension = ".html";
const cssOutputPath = "css/styles.min.css";
const jsOutputPath = "js/site.min.js";

const styleHrefPattern = /((?:\.\.\/)?css\/styles\.min\.css)\?v=[^"'\\s>)]*/g;
const scriptSrcPattern = /((?:\.\.\/)?js\/site\.min\.js)\?v=[^"'\\s>)]*/g;

export async function buildAssets() {
  await Promise.all([
    esbuild.build({
      entryPoints: ["css/styles.css"],
      minify: true,
      legalComments: "none",
      outfile: cssOutputPath
    }),
    esbuild.build({
      entryPoints: ["js/site.js"],
      minify: true,
      legalComments: "none",
      outfile: jsOutputPath
    })
  ]);

  return refreshAssetVersions();
}

export async function refreshAssetVersions() {
  const [cssVersion, jsVersion, htmlFiles] = await Promise.all([
    createFileVersion(cssOutputPath),
    createFileVersion(jsOutputPath),
    collectHtmlFiles(process.cwd())
  ]);

  await Promise.all(
    htmlFiles.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const next = source
        .replace(styleHrefPattern, `$1?v=${cssVersion}`)
        .replace(scriptSrcPattern, `$1?v=${jsVersion}`);

      if (next !== source) {
        await writeFile(filePath, next, "utf8");
      }
    })
  );

  return { cssVersion, jsVersion, htmlFiles };
}

export function formatBuildSummary({ cssVersion, jsVersion, htmlFiles }) {
  return [
    `CSS version: ${cssVersion}`,
    `JS version: ${jsVersion}`,
    `Updated HTML files: ${htmlFiles.length}`
  ].join("\n");
}

async function createFileVersion(filePath) {
  const fileBuffer = await readFile(filePath);
  return createHash("sha256").update(fileBuffer).digest("hex").slice(0, 10);
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
