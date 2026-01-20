import { Request, Response } from "express";
import Court from "../models/Court";
import { ICourtCreate, ICourtUpdate } from "../types/court.types";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/ApiError";
import cloudinary from "../config/cloudinary";

// Get all courts
export const getAllCourts = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.query;

    const filter: any = {};
    if (
      status &&
      ["active", "inactive", "maintenance"].includes(status as string)
    ) {
      filter.status = status;
    }

    const courts = await Court.find(filter).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: courts.length,
      data: courts,
    });
  }
);

// Get single court by ID
export const getCourtById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const court = await Court.findById(id);

    if (!court) {
      throw new NotFoundError("Court");
    }

    res.json({
      success: true,
      data: court,
    });
  }
);

// Create new court
export const createCourt = asyncHandler(async (req: Request, res: Response) => {
  const courtData: ICourtCreate = req.body;

  // Handle features parsing (comes as string from form-data)
  if (courtData.features && typeof courtData.features === "string") {
    try {
      courtData.features = JSON.parse(courtData.features);
    } catch (error) {
      throw new BadRequestError(
        "Invalid features format. Must be a valid JSON array"
      );
    }
  }

  // Validate required fields before uploading image
  if (!courtData.name || !courtData.name.trim()) {
    throw new BadRequestError("Court name is required");
  }

  if (!courtData.description || !courtData.description.trim()) {
    throw new BadRequestError("Court description is required");
  }

  // Check court count limit (max 7 courts)
  const courtCount = await Court.countDocuments();
  if (courtCount >= 7) {
    throw new BadRequestError("Maximum court limit reached (7 courts)");
  }

  // Check if court name already exists
  const existingCourt = await Court.findOne({ name: courtData.name });
  if (existingCourt) {
    throw new ConflictError("Court with this name already exists");
  }

  // Get Cloudinary URL (already uploaded via CloudinaryStorage)
  if (req.file) {
    courtData.imageUrl = (req.file as any).path;
  }

  const court = await Court.create(courtData);

  res.status(201).json({
    success: true,
    message: "Court created successfully",
    data: court,
  });
});

// Update court
export const updateCourt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: ICourtUpdate = req.body;

  // Handle features parsing (comes as string from form-data)
  if (updateData.features && typeof updateData.features === "string") {
    try {
      updateData.features = JSON.parse(updateData.features);
    } catch (error) {
      throw new BadRequestError(
        "Invalid features format. Must be a valid JSON array"
      );
    }
  }

  // If name is being updated, validate and check duplicates
  if (updateData.name) {
    if (!updateData.name.trim()) {
      throw new BadRequestError("Court name cannot be empty");
    }

    const existingCourt = await Court.findOne({
      name: updateData.name,
      _id: { $ne: id },
    });

    if (existingCourt) {
      throw new ConflictError("Court with this name already exists");
    }
  }

  // If description is being updated, validate it
  if (updateData.description !== undefined && !updateData.description.trim()) {
    throw new BadRequestError("Court description cannot be empty");
  }

  const court = await Court.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!court) {
    throw new NotFoundError("Court");
  }

  res.json({
    success: true,
    message: "Court updated successfully",
    data: court,
  });
});

// Delete court
export const deleteCourt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const court = await Court.findByIdAndDelete(id);

  if (!court) {
    throw new NotFoundError("Court");
  }

  res.json({
    success: true,
    message: "Court deleted successfully",
    data: court,
  });
});

// Toggle court status
export const toggleCourtStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "maintenance"].includes(status)) {
      throw new BadRequestError(
        "Invalid status. Must be: active, inactive, or maintenance"
      );
    }

    const court = await Court.findByIdAndUpdate(id, { status }, { new: true });

    if (!court) {
      throw new NotFoundError("Court");
    }

    res.json({
      success: true,
      message: `Court status changed to ${status}`,
      data: court,
    });
  }
);
