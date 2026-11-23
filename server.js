const express = require("express");
const path = require("path");

const app = express();
const PORT = 9000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve website assets from root directory
app.use(express.static(__dirname, {
    index: false,
    dotfiles: "deny"
}));

// Home page from root directory
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on port ${PORT}`);
});