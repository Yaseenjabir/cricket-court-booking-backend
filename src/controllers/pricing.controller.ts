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
  },
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
  },
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
        `Pricing rule for ${ruleData.dayType} ${ruleData.timeSlot} already exists`,
      );
    }

    const pricingRule = await PricingRule.create(ruleData);

    res.status(201).json({
      success: true,
      message: "Pricing rule created successfully",
      data: pricingRule,
    });
  },
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
  },
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
  },
);

// Initialize default pricing rules
export const initializePricingRules = asyncHandler(
  async (req: Request, res: Response) => {
    // Check if rules already exist
    const existingRulesCount = await PricingRule.countDocuments();
    if (existingRulesCount > 0) {
      throw new BadRequestError("Pricing rules already initialized");
    }

    // Initialize pricing rules according to client requirements:
    // Sunday-Wednesday: Day 90 SAR, Night 110 SAR
    // Thursday-Friday (Weekend): Day 110 SAR, Night 135 SAR
    // Saturday: Day 110 SAR, Night 110 SAR (Weekday Night rate)
    const defaultRules = [
      { dayType: "weekday", timeSlot: "day", pricePerHour: 90 },
      { dayType: "weekday", timeSlot: "night", pricePerHour: 110 },
      { dayType: "weekend", timeSlot: "day", pricePerHour: 110 },
      { dayType: "weekend", timeSlot: "night", pricePerHour: 135 },
    ];

    const createdRules = await PricingRule.insertMany(defaultRules);

    res.status(201).json({
      success: true,
      message: "Default pricing rules initialized successfully",
      data: createdRules,
    });
  },
);

// Calculate price for booking (public endpoint)
export const calculatePrice = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookingDate, startTime, endTime } = req.body;

    if (!bookingDate || !startTime || !endTime) {
      throw new BadRequestError(
        "Booking date, start time, and end time are required",
      );
    }

    const result = await PricingService.calculateBookingPrice(
      bookingDate,
      startTime,
      endTime,
    );

    res.json({
      success: true,
      data: result,
    });
  },
);

// Get current pricing (public endpoint for customers)
export const getCurrentPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const pricingRules = await PricingRule.find().sort({
      dayType: 1,
      timeSlot: 1,
    });

    // Format into a simple structure for frontend
    const pricing = {
      weekdayDayRate: 0,
      weekdayNightRate: 0,
      weekendDayRate: 0,
      weekendNightRate: 0,
    };

    pricingRules.forEach((rule) => {
      if (rule.dayType === "weekday" && rule.timeSlot === "day") {
        pricing.weekdayDayRate = rule.pricePerHour;
      } else if (rule.dayType === "weekday" && rule.timeSlot === "night") {
        pricing.weekdayNightRate = rule.pricePerHour;
      } else if (rule.dayType === "weekend" && rule.timeSlot === "day") {
        pricing.weekendDayRate = rule.pricePerHour;
      } else if (rule.dayType === "weekend" && rule.timeSlot === "night") {
        pricing.weekendNightRate = rule.pricePerHour;
      }
    });

    res.json({
      success: true,
      data: pricing,
    });
  },
);
