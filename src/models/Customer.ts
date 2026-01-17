import mongoose, { Schema, Document } from "mongoose";
import { ICustomer } from "../types/customer.types";

interface ICustomerDocument extends ICustomer, Document {}

const customerSchema = new Schema<ICustomerDocument>(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Saudi phone number validation (05xxxxxxxx or +9665xxxxxxxx)
          return /^(05\d{8}|(\+9665)\d{8})$/.test(v);
        },
        message: "Please enter a valid Saudi phone number",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Email is optional
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
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

// Index for faster phone lookups
customerSchema.index({ phone: 1 });

const Customer = mongoose.model<ICustomerDocument>("Customer", customerSchema);

export default Customer;
