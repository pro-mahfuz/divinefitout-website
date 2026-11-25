const express = require("express");
const createRoutes = require("./route");

const app = express();
const PORT = 9000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(createRoutes(__dirname));

// Serve website assets from root directory
app.use(express.static(__dirname, {
    index: "index.html",
    dotfiles: "deny"
}));

// Start server
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on port ${PORT}`);
});
