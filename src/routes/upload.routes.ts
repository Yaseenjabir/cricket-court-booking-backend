import express from "express";
import {
  uploadCourtImage,
  deleteCourtImage,
} from "../controllers/upload.controller";
import { upload } from "../middleware/upload";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = express.Router();

// Protected admin routes
router.post(
  "/court-image",
  authenticate,
  requireAdmin,
  upload.single("image"),
  uploadCourtImage
);

router.delete(
  "/court-image",
  authenticate,
  requireAdmin,
  deleteCourtImage
);

export default router;
