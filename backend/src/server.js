require("dotenv").config();

const connectDB = require("./config/db");
const env = require("./config/env");

const PORT = env.port;

const startServer = async () => {
  // Connect first: on the in-memory fallback the model factory has to be
  // installed before any model module is required.
  const mode = await connectDB();

  const app = require("./app");

  const server = app.listen(PORT, () => {
    console.log(`\nCampora backend running on http://localhost:${PORT}`);
    console.log(`Database: ${mode === "mongo" ? "MongoDB" : "in-memory demo database"}`);
    console.log(`Allowed origins: ${env.allowedOrigins.join(", ")}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, closing Campora API`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Failed to start Campora API:", error);
  process.exit(1);
});