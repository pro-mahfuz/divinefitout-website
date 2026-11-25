const express = require("express");
const path = require("path");

const defaultServiceRoutes = [
    "wooden-flooring",
    "spc-flooring",
    "lvt-flooring",
    "wpc-flooring",
    "tile-fixing",
    "marble-installation",
    "stone-installation",
    "carpet-installation"
];

function createMarketRouter({
    marketPath,
    serviceSuffix,
    siteDirectory,
    serviceRoutes = defaultServiceRoutes,
    retiredServiceRoutes = []
}) {
    const router = express.Router();

    router.get("/", (req, res) => {
        res.sendFile(path.join(siteDirectory, "index.html"));
    });

    router.get(["/about", "/contact"], (req, res) => {
        res.redirect(301, `/${marketPath}${req.path}.html`);
    });

    router.get(["/services", "/services/"], (req, res) => {
        if (!req.originalUrl.endsWith("/")) {
            return res.redirect(301, `/${marketPath}/services/`);
        }

        return res.sendFile(path.join(siteDirectory, "services", "index.html"));
    });

    for (const service of serviceRoutes) {
        router.get(`/services/${service}`, (req, res) => {
            res.redirect(301, `/${marketPath}/services/${service}-${serviceSuffix}.html`);
        });
    }

    for (const service of retiredServiceRoutes) {
        router.get([
            `/services/${service}`,
            `/services/${service}-${serviceSuffix}.html`
        ], (req, res) => {
            res.redirect(301, `/${marketPath}/services/`);
        });
    }

    router.use(express.static(siteDirectory, {
        index: "index.html",
        dotfiles: "deny"
    }));

    return router;
}

module.exports = createMarketRouter;
