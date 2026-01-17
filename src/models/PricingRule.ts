import mongoose, { Schema, Document } from "mongoose";
import { IPricingRule } from "../types/pricing.types";

interface IPricingRuleDocument extends IPricingRule, Document {}

const pricingRuleSchema = new Schema<IPricingRuleDocument>(
  {
    dayType: {
      type: String,
      enum: ["weekday", "weekend"],
      required: [true, "Day type is required"],
    },
    timeSlot: {
      type: String,
      enum: ["day", "night"],
      required: [true, "Time slot is required"],
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: [0, "Price cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index to prevent duplicate rules
pricingRuleSchema.index({ dayType: 1, timeSlot: 1 }, { unique: true });

const PricingRule = mongoose.model<IPricingRuleDocument>(
  "PricingRule",
  pricingRuleSchema
);

export default PricingRule;
