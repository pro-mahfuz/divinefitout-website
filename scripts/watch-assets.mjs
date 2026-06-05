import { watch } from "node:fs";
import { buildAssets, formatBuildSummary } from "./assets-lib.mjs";

let isBuilding = false;
let isShuttingDown = false;
let rebuildQueued = false;
let rebuildTimer = null;

const watchers = [
  watch("css/styles.css", queueBuild),
  watch("js/site.js", queueBuild)
];

await runBuild();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Watching css/styles.css and js/site.js for hashed asset rebuilds...");

function queueBuild() {
  if (isShuttingDown) return;

  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
  }

  rebuildTimer = setTimeout(() => {
    rebuildTimer = null;
    runBuild();
  }, 80);
}

async function runBuild() {
  if (isShuttingDown) return;

  if (isBuilding) {
    rebuildQueued = true;
    return;
  }

  isBuilding = true;

  do {
    rebuildQueued = false;

    try {
      const result = await buildAssets();
      console.log(formatBuildSummary(result));
    } catch (error) {
      console.error("[watch:assets] failed:", error?.message ?? error);
    }
  } while (rebuildQueued && !isShuttingDown);

  isBuilding = false;
}

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
    rebuildTimer = null;
  }

  await Promise.all(watchers.map((watcher) => watcher.close?.()));
  process.exit(0);
}
