require("dotenv").config();

// Suppress the Node.js experimental SQLite warning (node:sqlite is stable in 24+)
const originalEmit = process.emit;
process.emit = function (name, data) {
  if (name === "warning" && data?.name === "ExperimentalWarning" && data?.message?.includes("SQLite")) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};

const app = require("./app");
const { initializeSchema } = require("./db/schema");

const PORT = process.env.PORT || 3000;

// PILLAR 2: THE BRIDGE — establish the connection, then start the server
initializeSchema();

app.listen(PORT, () => {
  console.log(`\nDecodeLabs Project 3 — Database Integration`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API overview → http://localhost:${PORT}/\n`);
});
