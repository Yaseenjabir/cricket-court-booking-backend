import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { BadRequestError } from "../utils/ApiError";
import cloudinary from "../config/cloudinary";

// Upload court image to Cloudinary
export const uploadCourtImage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "cricket-courts", // Store in specific folder
      resource_type: "image",
      transformation: [
        { width: 1200, height: 800, crop: "limit" }, // Max dimensions
        { quality: "auto" }, // Automatic quality optimization
        { fetch_format: "auto" }, // Automatic format (WebP for modern browsers)
      ],
    });

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  }
);

// Delete court image from Cloudinary
export const deleteCourtImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { publicId } = req.body;

    if (!publicId) {
      throw new BadRequestError("Public ID is required");
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  }
);
