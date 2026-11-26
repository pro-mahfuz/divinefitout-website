const express = require("express");
const createDubaiRouter = require("./routes/ae");
const createKuwaitRouter = require("./routes/kw");

function createRoutes(rootDirectory) {
    const router = express.Router();

    // Preserve legacy Dubai URLs while making /ae/ the canonical market tree.
    router.get(["/", "/index.html"], (req, res) => res.redirect(301, "/ae/"));
    router.get(["/about.html", "/contact.html"], (req, res) => res.redirect(301, `/ae${req.path}`));
    router.get(["/services", "/services/", "/services/index.html"], (req, res) => res.redirect(301, "/ae/services/"));
    router.get("/services/:service", (req, res) => res.redirect(301, `/ae/services/${req.params.service}`));

    // Normalize market roots before handing off to the independent sites.
    router.get(["/ae", "/kw", "/ae/", "/kw/"], (req, res, next) => {
        if (!req.path.endsWith("/")) {
            return res.redirect(301, `${req.path}/`);
        }
        return next();
    });

    router.use("/ae", createDubaiRouter(rootDirectory));
    router.use("/kw", createKuwaitRouter(rootDirectory));

    return router;
}

module.exports = createRoutes;
