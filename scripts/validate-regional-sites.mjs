import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domain = "https://divinefitout.com";
const errors = [];

const collectHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(entryPath);
    return entry.name.endsWith(".html") ? [entryPath] : [];
  }));
  return nested.flat();
};

const routeForFile = (filePath) => {
  const relative = path.relative(projectRoot, filePath).replaceAll("\\", "/");
  return relative.endsWith("/index.html") ? `/${relative.slice(0, -"index.html".length)}` : `/${relative}`;
};

const counterpartForRoute = (route) => route.startsWith("/ae/")
  ? route.replace(/^\/ae\//, "/kw/").replaceAll("-dubai", "-kuwait")
  : route.replace(/^\/kw\//, "/ae/").replaceAll("-kuwait", "-dubai");

const fileForInternalPath = (urlPath) => {
  const cleanPath = urlPath.split(/[?#]/)[0];
  if (!cleanPath || cleanPath === "/") return path.join(projectRoot, "index.html");
  const relative = cleanPath.replace(/^\//, "");
  return path.join(projectRoot, relative.endsWith("/") ? relative + "index.html" : relative);
};

const pageFiles = [
  ...(await collectHtmlFiles(path.join(projectRoot, "ae"))),
  ...(await collectHtmlFiles(path.join(projectRoot, "kw")))
];
const pageRoutes = new Set(pageFiles.map(routeForFile));

if (!pageFiles.length) errors.push("No regional HTML pages were found.");

for (const filePath of pageFiles) {
  const html = await readFile(filePath, "utf8");
  const route = routeForFile(filePath);
  const market = route.startsWith("/kw/") ? "kw" : "ae";
  const counterpart = counterpartForRoute(route);
  const hasCounterpart = pageRoutes.has(counterpart);
  const relative = path.relative(projectRoot, filePath);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  const expectedCanonical = `${domain}${route}`;

  if (canonical !== expectedCanonical) {
    errors.push(`${relative}: canonical is ${canonical || "missing"}; expected ${expectedCanonical}.`);
  }

  const requiredHreflangs = market === "kw" || hasCounterpart
    ? ["en-ae", "en-kw", "x-default"]
    : ["en-ae", "x-default"];
  for (const hreflang of requiredHreflangs) {
    if (!html.includes(`rel="alternate" hreflang="${hreflang}"`)) {
      errors.push(`${relative}: missing ${hreflang} alternate.`);
    }
  }
  if (market === "ae" && !hasCounterpart && html.includes('rel="alternate" hreflang="en-kw"')) {
    errors.push(`${relative}: links to a Kuwait alternate that does not exist.`);
  }
  if (market === "kw" && !hasCounterpart) {
    errors.push(`${relative}: Kuwait page is missing its Dubai counterpart.`);
  }

  const kuwaitContent = html
    .replace(/<link rel="alternate"[^>]+>/g, "")
    .replace(/<a href="\/ae\/[^"]*"[^>]*>Dubai<\/a>/g, "");
  if (market === "kw" && /dubai/i.test(kuwaitContent)) {
    errors.push(`${relative}: Kuwait page still contains Dubai text or a Dubai URL.`);
  }

  if (/(?:\/ae\/ae\/|\/kw\/kw\/)/.test(html)) {
    errors.push(`${relative}: contains a duplicate regional prefix.`);
  }

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, json] of jsonLdBlocks) {
    try {
      JSON.parse(json);
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message}).`);
    }
  }

  const internalReferences = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((match) => match[1]);
  for (const reference of internalReferences) {
    if (reference.startsWith("//")) continue;
    const target = fileForInternalPath(reference);
    try {
      await access(target);
    } catch {
      errors.push(`${relative}: missing internal target ${reference}.`);
    }
  }
}

const sitemap = await readFile(path.join(projectRoot, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== pageFiles.length) {
  errors.push(`Expected ${pageFiles.length} sitemap URLs, found ${sitemapUrls.length}.`);
}
for (const route of pageRoutes) {
  if (!sitemapUrls.includes(`${domain}${route}`)) errors.push(`Sitemap is missing ${route}.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${pageFiles.length} regional pages, their internal targets, SEO alternates, JSON-LD and sitemap entries.`);
