import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

const serviceLinks = {
  ae: [
    ["Wooden Flooring", "/ae/services/wooden-flooring-dubai.html"],
    ["SPC Flooring", "/ae/services/spc-flooring-dubai.html"],
    ["LVT Flooring", "/ae/services/lvt-flooring-dubai.html"],
    ["WPC Flooring", "/ae/services/wpc-flooring-dubai.html"],
    ["Tile Fixing", "/ae/services/tile-fixing-dubai.html"],
    ["Marble Installation", "/ae/services/marble-installation-dubai.html"],
    ["Stone Installation", "/ae/services/stone-installation-dubai.html"],
    ["Carpet Installation", "/ae/services/carpet-installation-dubai.html"]
  ],
  kw: [
    ["Wooden Flooring", "/kw/services/wooden-flooring-kuwait.html"],
    ["SPC Flooring", "/kw/services/spc-flooring-kuwait.html"],
    ["LVT Flooring", "/kw/services/lvt-flooring-kuwait.html"],
    ["WPC Flooring", "/kw/services/wpc-flooring-kuwait.html"],
    ["Carpet Installation", "/kw/services/carpet-installation-kuwait.html"]
  ]
};

function renderFooter(market) {
  const isKuwait = market === "kw";
  const prefix = isKuwait ? "/kw" : "/ae";
  const region = isKuwait ? "Kuwait" : "Dubai";
  const location = isKuwait
    ? "Regional service enquiries for Kuwait City and across Kuwait"
    : "Building-X07, England Cluster, Dubai International City, Dubai, United Arab Emirates";
  const description = isKuwait
    ? "Wooden flooring, SPC, LVT, WPC and carpet installation for Kuwait homes and commercial interiors."
    : "Flooring, tile, marble, stone and carpet installation for Dubai homes and commercial interiors.";
  const links = serviceLinks[market]
    .map(([label, href]) => `              <li><a href="${href}">${label}</a></li>`)
    .join("\n");

  return `  <footer class="site-footer" id="site-footer">
    <div class="footer-wrap">
      <section class="footer-cta" aria-labelledby="footer-cta-title">
        <div class="footer-cta-copy">
          <span class="footer-kicker">Start your next project</span>
          <h2 id="footer-cta-title">Ready to improve your ${region} interior?</h2>
          <p>Tell us about the space, preferred finish and project timing. Our team can guide you toward the right installation service.</p>
        </div>
        <div class="footer-cta-actions">
          <a class="footer-action footer-action--primary" href="https://wa.me/971566363850" target="_blank" rel="noopener">Chat on WhatsApp</a>
          <a class="footer-action footer-action--secondary" href="${prefix}/contact.html">Request a site visit</a>
        </div>
      </section>

      <div class="footer-grid">
        <div class="footer-column footer-column--brand">
          <a class="brand brand--footer" href="${prefix}/" aria-label="Divine Fit-Out &amp; Renovation ${region} home">
            <img class="brand-logo-full" src="/images/divine-logo-full-160.webp" srcset="/images/divine-logo-full-96.webp 96w, /images/divine-logo-full-160.webp 160w, /images/divine-logo-full.webp 272w" sizes="112px" alt="Divine Fit-Out &amp; Renovation logo" width="272" height="272" loading="lazy" decoding="async">
          </a>
          <p>${description}</p>
          <div class="footer-markets" aria-label="Choose market">
            <span>Choose market</span>
            <div>
              <a href="/ae/"${isKuwait ? "" : ' aria-current="page"'}>Dubai</a>
              <a href="/kw/"${isKuwait ? ' aria-current="page"' : ""}>Kuwait</a>
            </div>
          </div>
        </div>

        <div class="footer-column footer-column--services">
          <span class="footer-column-label">What we do</span>
          <h3>Services</h3>
          <ul class="footer-service-links">
${links}
          </ul>
        </div>

        <div class="footer-column">
          <span class="footer-column-label">Navigate</span>
          <h3>Explore</h3>
          <ul>
            <li><a href="${prefix}/">Home</a></li>
            <li><a href="${prefix}/services/">Service Hub</a></li>
            <li><a href="${prefix}/about.html">About</a></li>
            <li><a href="${prefix}/contact.html">Contact</a></li>
          </ul>
        </div>

        <div class="footer-column footer-column--contact">
          <span class="footer-column-label">Talk to our team</span>
          <h3>Contact</h3>
          <ul class="footer-contact-list">
            <li><span>Primary</span><a href="tel:+971566363850">+971 56 636 3850</a></li>
            <li><span>Phone</span><a href="tel:+971562340231">+971 56 234 0231</a></li>
            <li><span>Phone</span><a href="tel:+971568163016">+971 56 816 3016</a></li>
            <li><span>Email</span><a href="mailto:service@divinefitout.com">service@divinefitout.com</a></li>
          </ul>
          <p class="footer-location">${location}</p>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; <span data-year></span> Divine Fit-Out &amp; Renovation. All rights reserved.</span>
        <span>Serving ${region} residential and commercial interiors.</span>
      </div>
    </div>
  </footer>`;
}

const htmlFiles = await collectHtmlFiles(projectRoot);
let updatedCount = 0;

for (const filePath of htmlFiles) {
  const relativePath = path.relative(projectRoot, filePath).replaceAll("\\", "/");
  const market = relativePath.startsWith("kw/") ? "kw" : "ae";
  const footer = renderFooter(market);
  const html = await readFile(filePath, "utf8");
  const withoutFooter = html.replace(/\s*<footer class="site-footer"[^>]*>[\s\S]*?<\/footer>/g, "");
  const updated = withoutFooter.includes("</main>")
    ? withoutFooter.replace(/\s*<\/main>/, `\n  </main>\n${footer}`)
    : withoutFooter.replace(/\s*<\/body>/, `\n${footer}\n</body>`);

  if (updated !== html) {
    await writeFile(filePath, updated, "utf8");
    updatedCount += 1;
  }
}

console.log(`Synchronized footers in ${updatedCount} HTML files.`);
