import path from "path";
import express, { Router, type IRouter } from "express";

import { logger } from "../lib/logger";

// Images live at <workspace-root>/attached_assets/beach_images/
// process.cwd() is the package root (artifacts/api-server/) when run via pnpm.
const IMAGES_DIR = path.resolve(process.cwd(), "../../attached_assets/beach_images");

logger.info({ imagesDir: IMAGES_DIR }, "Serving beach images from");

const router: IRouter = Router();

router.use(
  "/images",
  express.static(IMAGES_DIR, {
    index: false,
    dotfiles: "deny",
    extensions: ["png"],
    setHeaders(res) {
      // Cache for 1 hour in browsers; images don't change at runtime
      res.setHeader("Cache-Control", "public, max-age=3600, immutable");
    },
  }),
);

// Explicit 404 for anything under /images that wasn't found
router.use("/images", (_req, res) => {
  res.status(404).json({ error: "not_found", message: "Image not found" });
});

export default router;
