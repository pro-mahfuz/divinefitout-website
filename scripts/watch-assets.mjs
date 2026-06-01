import { spawn } from "node:child_process";
import { resolve } from "node:path";

const esbuildBin = process.platform === "win32"
  ? resolve("node_modules", ".bin", "esbuild.cmd")
  : resolve("node_modules", ".bin", "esbuild");

const tasks = [
  {
    label: "css",
    args: [
      "css/styles.css",
      "--minify",
      "--legal-comments=none",
      "--outfile=css/styles.min.css",
      "--watch"
    ]
  },
  {
    label: "js",
    args: [
      "js/site.js",
      "--minify",
      "--legal-comments=none",
      "--outfile=js/site.min.js",
      "--watch"
    ]
  }
];

const children = tasks.map(({ label, args }) => {
  const child = spawn(esbuildBin, args, {
    cwd: process.cwd(),
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    const details = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[watch:${label}] exited with ${details}`);
    shutdown(typeof code === "number" ? code : 0);
  });

  child.on("error", (error) => {
    console.error(`[watch:${label}] failed to start:`, error.message);
    shutdown(1);
  });

  return child;
});

let closed = false;

function shutdown(exitCode = 0) {
  if (closed) return;
  closed = true;

  children.forEach((child) => {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  });

  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Watching css/styles.css and js/site.js for minified rebuilds...");
