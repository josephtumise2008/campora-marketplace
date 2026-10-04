const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const routes = require("./routes");
const { attachUser } = require("./middleware/auth");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { UPLOAD_DIR } = require("./services/uploadService");

const app = express();

app.set("trust proxy", 1);

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Development: allow any localhost / 127.0.0.1 port
      if (env.nodeEnv !== "production" && LOCAL_ORIGIN.test(origin)) {
        return callback(null, true);
      }

      // Everything else must be in the explicit allowlist
      if (env.allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

// Uploaded images are public so <img> tags work from any origin.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Campora API is running",
    data: {
      service: "campora-api",
      version: "1.0.0",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api", attachUser);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
