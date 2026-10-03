const path = require("path");

/** Where uploaded images live. Kept outside `public` so the API controls access. */
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "..", "..", "uploads");

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024;

const EXTENSIONS = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const extensionFor = (fileName = "") => {
  const match = /\.([a-z0-9]+)$/i.exec(String(fileName).trim());
  return match ? `.${match[1].toLowerCase()}` : "";
};

const isAllowedImage = (extension) => Boolean(EXTENSIONS[extension]);

module.exports = {
  EXTENSIONS,
  MAX_UPLOAD_BYTES,
  UPLOAD_DIR,
  extensionFor,
  isAllowedImage,
};