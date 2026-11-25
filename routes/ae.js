const path = require("path");
const createMarketRouter = require("./create-market-router");

function createDubaiRouter(rootDirectory) {
    return createMarketRouter({
        marketPath: "ae",
        serviceSuffix: "dubai",
        siteDirectory: path.join(rootDirectory, "ae")
    });
}

module.exports = createDubaiRouter;
