import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domain = "https://divinefitout.com";
const lastModified = new Date().toISOString().slice(0, 10);

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
  return relative.endsWith("/index.html")
    ? `/${relative.slice(0, -"index.html".length)}`
    : `/${relative}`;
};

const counterpartForRoute = (route) => route.startsWith("/ae/")
  ? route.replace(/^\/ae\//, "/qa/").replaceAll("-dubai", "-qatar")
  : route.replace(/^\/qa\//, "/ae/").replaceAll("-qatar", "-dubai");

const pageFiles = [
  ...(await collectHtmlFiles(path.join(projectRoot, "ae"))),
  ...(await collectHtmlFiles(path.join(projectRoot, "qa")))
];
const pages = await Promise.all(pageFiles.map(async (filePath) => {
  const route = routeForFile(filePath);
  const html = await readFile(filePath, "utf8");

  if (!html.includes(`${domain}${route}`)) {
    throw new Error(`Page is missing its canonical regional URL: ${route}`);
  }

  return { route };
}));

const routeSet = new Set(pages.map(({ route }) => route));
pages.sort((left, right) => left.route.localeCompare(right.route));

const entries = pages.map(({ route }) => {
  const isDubai = route.startsWith("/ae/");
  const counterpart = counterpartForRoute(route);
  const hasCounterpart = routeSet.has(counterpart);

  if (!isDubai && !hasCounterpart) {
    throw new Error(`Qatar page is missing its Dubai counterpart: ${route}`);
  }

  const aeRoute = isDubai ? route : counterpart;
  const qaRoute = isDubai ? counterpart : route;
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="en-ae" href="${domain}${aeRoute}" />`
  ];

  if (hasCounterpart) {
    alternates.push(`    <xhtml:link rel="alternate" hreflang="en-qa" href="${domain}${qaRoute}" />`);
  }

  alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}${aeRoute}" />`);

  return [
    "  <url>",
    `    <loc>${domain}${route}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    ...alternates,
    "  </url>"
  ].join("\n");
});

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries,
  "</urlset>",
  ""
].join("\n");

await writeFile(path.join(projectRoot, "sitemap.xml"), sitemap, "utf8");
console.log(`Indexed ${pages.length} independent regional pages in sitemap.xml.`);
