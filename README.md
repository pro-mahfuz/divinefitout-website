# Devine Fit-out & Renovation Website

Static multi-page SEO website with separate Dubai and Qatar market architecture.

## Market architecture

- `/ae/` is the canonical Dubai site and its HTML files are edited directly inside `ae/`.
- `/qa/` is the canonical Qatar site and its HTML files are edited directly inside `qa/`.
- Each market has its own home, about, contact, service hub and service-detail URLs.
- The two content trees are independent; building the project never copies Dubai content over Qatar content.
- Dubai service slugs end in `-dubai.html`; Qatar service slugs end in `-qatar.html`.
- Images, fonts, CSS and JavaScript stay shared at the domain root.
- Reciprocal `hreflang` links and the XML sitemap connect equivalent market pages.
- Legacy root and `/services/` URLs redirect to their `/ae/` equivalents in Express and Nginx.

Run `npm run build` after editing either regional content tree, CSS or JavaScript. The build refreshes shared hashed assets, rebuilds the sitemap from the independent pages, and validates both sites.

## Included pages in each market

- Homepage
- About page
- Contact page
- Service hub
- Wooden flooring service page
- Tile fixing service page
- Marble installation service page
- Stone installation service page
- Carpet installation service page
- 404 page

## Before launch

Replace the following placeholder details everywhere they appear:

- Business name if needed
- Domain: `https://divinefitout.com`
- Phones: `+971 56 636 3850`, `+971 56 234 0231`, `+971 56 816 3016`
- Email: `service@divinefitout.com`
- Address: `299992 Duabi, United Arab Emirates`
- Testimonials and project claims

## Technical items to connect

- Connect the contact form to your inbox, CRM or form handler
- Add real project photos and optimized alt text
- Update schema with your exact business details
- Submit the sitemap after deployment

## Asset build

- Install dependencies with `npm install`
- Rebuild minified assets once with `npm run build:assets`
- Each asset rebuild emits hashed filenames like `styles.<hash>.min.css` and `site.<hash>.min.js`, then refreshes the HTML references automatically
- Watch `css/styles.css` and `js/site.js` and auto-regenerate minified files with `npm run watch:assets`
