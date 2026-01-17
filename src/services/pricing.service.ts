import PricingRule from "../models/PricingRule";
import { ITimeSlotPrice, IPriceCalculation } from "../types/pricing.types";
import { BadRequestError } from "../utils/ApiError";

export class PricingService {
  /**
   * Get day of week (0 = Sunday, 6 = Saturday)
   */
  private static getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * Check if date is weekend (Friday or Saturday in Saudi Arabia)
   */
  private static isWeekend(date: Date): boolean {
    const day = this.getDayOfWeek(date);
    return day === 5 || day === 6; // Friday = 5, Saturday = 6
  }

  /**
   * Check if time is night slot (6 PM to 9 AM)
   * Night: 18:00 (6 PM) to 09:00 (9 AM) next day
   */
  private static isNightTime(hour: number): boolean {
    return hour >= 18 || hour < 9;
  }

  /**
   * Get day type for a specific date
   */
  private static getDayType(date: Date): "weekday" | "weekend" {
    return this.isWeekend(date) ? "weekend" : "weekday";
  }

  /**
   * Get time slot for a specific hour
   */
  private static getTimeSlot(hour: number): "day" | "night" {
    return this.isNightTime(hour) ? "night" : "day";
  }

  /**
   * Handle midnight boundary (12 AM - 4 AM belongs to previous day)
   * If time is between 00:00 and 04:00, treat as previous day
   */
  private static getEffectiveDate(date: Date): Date {
    const hour = date.getHours();
    if (hour >= 0 && hour < 4) {
      // Belongs to previous day
      const effectiveDate = new Date(date);
      effectiveDate.setDate(effectiveDate.getDate() - 1);
      return effectiveDate;
    }
    return date;
  }

  /**
   * Check if it's Saturday night (special pricing: 110 SAR instead of 135 SAR)
   */
  private static isSaturdayNight(date: Date, hour: number): boolean {
    const effectiveDate = this.getEffectiveDate(date);
    return this.getDayOfWeek(effectiveDate) === 6 && this.isNightTime(hour);
  }

  /**
   * Get price for a specific time slot
   */
  private static async getPrice(
    date: Date,
    hour: number
  ): Promise<{
    price: number;
    dayType: "weekday" | "weekend";
    timeSlot: "day" | "night";
  }> {
    // Check for Saturday night special pricing
    if (this.isSaturdayNight(date, hour)) {
      return {
        price: 110,
        dayType: "weekend",
        timeSlot: "night",
      };
    }

    const effectiveDate = this.getEffectiveDate(date);
    const dayType = this.getDayType(effectiveDate);
    const timeSlot = this.getTimeSlot(hour);

    // Fetch pricing rule from database
    const pricingRule = await PricingRule.findOne({
      dayType,
      timeSlot,
      isActive: true,
    });

    if (!pricingRule) {
      throw new BadRequestError(
        `Pricing rule not found for ${dayType} ${timeSlot}`
      );
    }

    return {
      price: pricingRule.pricePerHour,
      dayType,
      timeSlot,
    };
  }

  /**
   * Calculate booking price with detailed breakdown
   */
  static async calculateBookingPrice(
    courtId: string,
    startTime: Date,
    endTime: Date
  ): Promise<IPriceCalculation> {
    // Validate times
    if (startTime >= endTime) {
      throw new BadRequestError("End time must be after start time");
    }

    const totalMilliseconds = endTime.getTime() - startTime.getTime();
    const totalHours = totalMilliseconds / (1000 * 60 * 60);

    // Check minimum 1 hour
    if (totalHours < 1) {
      throw new BadRequestError("Minimum booking duration is 1 hour");
    }

    // Check 30-minute increments
    const minutes = (totalMilliseconds / (1000 * 60)) % 60;
    if (minutes !== 0 && minutes !== 30) {
      throw new BadRequestError(
        "Bookings must be in 30-minute increments (e.g., 1.0h, 1.5h, 2.0h)"
      );
    }

    const breakdown: ITimeSlotPrice[] = [];
    let currentTime = new Date(startTime);
    let subtotal = 0;

    // Calculate price for each hour
    while (currentTime < endTime) {
      const nextHour = new Date(currentTime);
      nextHour.setHours(nextHour.getHours() + 1);

      // Don't go beyond end time
      const slotEnd = nextHour > endTime ? endTime : nextHour;
      const slotDuration =
        (slotEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

      const { price, dayType, timeSlot } = await this.getPrice(
        currentTime,
        currentTime.getHours()
      );

      const slotPrice = price * slotDuration;
      subtotal += slotPrice;

      breakdown.push({
        startTime: new Date(currentTime),
        endTime: new Date(slotEnd),
        hours: slotDuration,
        pricePerHour: price,
        totalPrice: slotPrice,
        dayType,
        timeSlot,
      });

      currentTime = slotEnd;
    }

    return {
      courtId,
      startTime,
      endTime,
      totalHours,
      breakdown,
      subtotal,
      discount: 0, // Will be calculated with promo code later
      finalPrice: subtotal,
    };
  }

  /**
   * Get price preview for frontend (without saving)
   */
  static async getPricePreview(
    startTime: Date,
    endTime: Date
  ): Promise<{
    totalHours: number;
    estimatedPrice: number;
    breakdown: ITimeSlotPrice[];
  }> {
    const calculation = await this.calculateBookingPrice(
      "preview",
      startTime,
      endTime
    );

    return {
      totalHours: calculation.totalHours,
      estimatedPrice: calculation.finalPrice,
      breakdown: calculation.breakdown,
    };
  }
}
