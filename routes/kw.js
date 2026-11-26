const path = require("path");
const createMarketRouter = require("./create-market-router");

function createKuwaitRouter(rootDirectory) {
    return createMarketRouter({
        marketPath: "kw",
        serviceSuffix: "kuwait",
        siteDirectory: path.join(rootDirectory, "kw"),
        serviceRoutes: [
            "wooden-flooring",
            "spc-flooring",
            "lvt-flooring",
            "wpc-flooring",
            "carpet-installation"
        ],
        retiredServiceRoutes: [
            "tile-fixing",
            "marble-installation",
            "stone-installation"
        ]
    });
}

module.exports = createKuwaitRouter;
