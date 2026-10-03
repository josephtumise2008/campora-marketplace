const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ApiError = require("../utils/ApiError");
const { protect, authorize } = require("../middleware/auth");
const { UPLOAD_DIR, MAX_UPLOAD_BYTES, extensionFor, isAllowedImage } = require("../services/uploadService");

const router = express.Router();

/**
 * Image uploads. Sellers (and admins) post raw image bytes with the file name
 * in the `X-File-Name` header; the frontend downsizes pictures before sending
 * them, so the payload is normally well under the limit.
 */
router.post(
  "/",
  protect,
  authorize("seller", "admin"),
  express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES }),
  async (req, res, next) => {
    try {
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw ApiError.badRequest("Send the image file as the request body");
      }

      const original = String(req.get("X-File-Name") || "upload");
      const extension = extensionFor(original);
      if (!isAllowedImage(extension)) {
        throw ApiError.badRequest("Only JPG, PNG, WEBP, GIF, AVIF or SVG images are supported");
      }

      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const name = `${stamp}-${crypto.randomBytes(8).toString("hex")}${extension}`;
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);

      const url = `/uploads/${name}`;
      res.status(201).json({
        success: true,
        message: "Image uploaded",
        data: {
          url,
          name,
          size: buffer.length,
          contentType: req.get("Content-Type") || "application/octet-stream",
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/:name",
  protect,
  authorize("seller", "admin"),
  async (req, res, next) => {
    try {
      const safe = path.basename(String(req.params.name || ""));
      if (!safe || safe.includes("..")) throw ApiError.badRequest("That file name is not valid");
      await fs.rm(path.join(UPLOAD_DIR, safe), { force: true });
      res.json({ success: true, message: "Image removed" });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;