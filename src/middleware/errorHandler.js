function errorHandler(err, req, res, next) {
  console.error(err.message);
  const msg = err.message || "";

  if (msg.includes("UNIQUE constraint failed")) {
    return res.status(409).json({ error: "A record with that value already exists." });
  }

  if (msg.includes("CHECK constraint failed")) {
    return res.status(400).json({ error: `Data failed a constraint check: ${msg.split(": ")[1] || ""}` });
  }

  if (msg.includes("NOT NULL constraint failed")) {
    return res.status(400).json({ error: "A required field was left empty." });
  }

  if (msg.includes("FOREIGN KEY constraint failed")) {
    return res.status(400).json({ error: "Referenced record does not exist." });
  }

  const status = err.status || 500;
  res.status(status).json({ error: msg || "Internal server error." });
}

module.exports = errorHandler;
