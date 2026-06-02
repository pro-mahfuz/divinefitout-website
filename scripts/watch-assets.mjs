import * as esbuild from "esbuild";
import { formatBuildSummary, refreshAssetVersions } from "./assets-lib.mjs";

let isShuttingDown = false;
let refreshTimer = null;

const contexts = await Promise.all([
  esbuild.context({
    entryPoints: ["css/styles.css"],
    minify: true,
    legalComments: "none",
    outfile: "css/styles.min.css",
    plugins: [createVersionRefreshPlugin()]
  }),
  esbuild.context({
    entryPoints: ["js/site.js"],
    minify: true,
    legalComments: "none",
    outfile: "js/site.min.js",
    plugins: [createVersionRefreshPlugin()]
  })
]);

await Promise.all(contexts.map((context) => context.watch()));
queueVersionRefresh();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Watching css/styles.css and js/site.js for minified rebuilds...");

function queueVersionRefresh() {
  if (isShuttingDown) return;

  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  refreshTimer = setTimeout(async () => {
    refreshTimer = null;

    try {
      const result = await refreshAssetVersions();
      console.log(formatBuildSummary(result));
    } catch (error) {
      console.error("[watch:version] failed:", error?.message ?? error);
    }
  }, 80);
}

function createVersionRefreshPlugin() {
  return {
    name: "refresh-asset-versions",
    setup(build) {
      build.onEnd(() => {
        queueVersionRefresh();
      });
    }
  };
}

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  await Promise.all(contexts.map((context) => context.dispose()));
  process.exit(0);
}
