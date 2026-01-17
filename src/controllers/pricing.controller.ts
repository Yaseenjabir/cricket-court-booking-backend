import { Request, Response } from "express";
import PricingRule from "../models/PricingRule";
import { IPricingRuleCreate, IPricingRuleUpdate } from "../types/pricing.types";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/ApiError";
import { PricingService } from "../services/pricing.service";

// Get all pricing rules
export const getAllPricingRules = asyncHandler(
  async (req: Request, res: Response) => {
    const pricingRules = await PricingRule.find().sort({
      dayType: 1,
      timeSlot: 1,
    });

    res.json({
      success: true,
      count: pricingRules.length,
      data: pricingRules,
    });
  }
);

// Get single pricing rule by ID
export const getPricingRuleById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricingRule = await PricingRule.findById(id);

    if (!pricingRule) {
      throw new NotFoundError("Pricing rule");
    }

    res.json({
      success: true,
      data: pricingRule,
    });
  }
);

// Create new pricing rule
export const createPricingRule = asyncHandler(
  async (req: Request, res: Response) => {
    const ruleData: IPricingRuleCreate = req.body;

    // Validate required fields
    if (!ruleData.dayType) {
      throw new BadRequestError("Day type is required");
    }

    if (!ruleData.timeSlot) {
      throw new BadRequestError("Time slot is required");
    }

    if (!ruleData.pricePerHour || ruleData.pricePerHour <= 0) {
      throw new BadRequestError("Valid price per hour is required");
    }

    // Check if rule already exists
    const existingRule = await PricingRule.findOne({
      dayType: ruleData.dayType,
      timeSlot: ruleData.timeSlot,
    });

    if (existingRule) {
      throw new ConflictError(
        `Pricing rule for ${ruleData.dayType} ${ruleData.timeSlot} already exists`
      );
    }

    const pricingRule = await PricingRule.create(ruleData);

    res.status(201).json({
      success: true,
      message: "Pricing rule created successfully",
      data: pricingRule,
    });
  }
);

// Update pricing rule
export const updatePricingRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: IPricingRuleUpdate = req.body;

    // If price is being updated, validate it
    if (updateData.pricePerHour !== undefined && updateData.pricePerHour <= 0) {
      throw new BadRequestError("Price per hour must be greater than 0");
    }

    const pricingRule = await PricingRule.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!pricingRule) {
      throw new NotFoundError("Pricing rule");
    }

    res.json({
      success: true,
      message: "Pricing rule updated successfully",
      data: pricingRule,
    });
  }
);

// Delete pricing rule
export const deletePricingRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricingRule = await PricingRule.findByIdAndDelete(id);

    if (!pricingRule) {
      throw new NotFoundError("Pricing rule");
    }

    res.json({
      success: true,
      message: "Pricing rule deleted successfully",
      data: pricingRule,
    });
  }
);

// Initialize default pricing rules
export const initializePricingRules = asyncHandler(
  async (req: Request, res: Response) => {
    // Check if rules already exist
    const existingRulesCount = await PricingRule.countDocuments();
    if (existingRulesCount > 0) {
      throw new BadRequestError("Pricing rules already initialized");
    }

    const defaultRules = [
      { dayType: "weekday", timeSlot: "day", pricePerHour: 80 },
      { dayType: "weekday", timeSlot: "night", pricePerHour: 100 },
      { dayType: "weekend", timeSlot: "day", pricePerHour: 100 },
      { dayType: "weekend", timeSlot: "night", pricePerHour: 135 },
    ];

    const createdRules = await PricingRule.insertMany(defaultRules);

    res.status(201).json({
      success: true,
      message: "Default pricing rules initialized successfully",
      data: createdRules,
    });
  }
);

// Calculate price for booking (public endpoint)
export const calculatePrice = asyncHandler(
  async (req: Request, res: Response) => {
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      throw new BadRequestError("Start time and end time are required");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError("Invalid date format");
    }

    const pricePreview = await PricingService.getPricePreview(start, end);

    res.json({
      success: true,
      data: pricePreview,
    });
  }
);
