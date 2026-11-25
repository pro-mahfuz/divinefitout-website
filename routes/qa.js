const path = require("path");
const createMarketRouter = require("./create-market-router");

function createQatarRouter(rootDirectory) {
    return createMarketRouter({
        marketPath: "qa",
        serviceSuffix: "qatar",
        siteDirectory: path.join(rootDirectory, "qa"),
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

module.exports = createQatarRouter;
