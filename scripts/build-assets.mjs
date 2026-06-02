import { buildAssets, formatBuildSummary } from "./assets-lib.mjs";

try {
  const result = await buildAssets();
  console.log(formatBuildSummary(result));
} catch (error) {
  console.error(error?.message ?? error);
  process.exit(1);
}
