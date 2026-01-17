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
   * @param bookingDate - Date object or string for the booking date
   * @param startTime - Time string in HH:MM format (e.g., "18:00")
   * @param endTime - Time string in HH:MM format (e.g., "20:00")
   */
  static async calculateBookingPrice(
    bookingDate: Date | string,
    startTime: string,
    endTime: string
  ): Promise<{
    totalHours: number;
    breakdown: Array<{
      hour: string;
      rate: number;
      dayType: "weekday" | "weekend";
      timeSlot: "day" | "night";
    }>;
    finalPrice: number;
  }> {
    // Parse date
    const dateObj =
      typeof bookingDate === "string" ? new Date(bookingDate) : bookingDate;
    dateObj.setHours(0, 0, 0, 0);

    // Parse times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Create full datetime objects
    const startDateTime = new Date(dateObj);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(dateObj);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Handle midnight crossing (e.g., 23:00 to 02:00)
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // Validate times
    const totalMilliseconds = endDateTime.getTime() - startDateTime.getTime();
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

    const breakdown: Array<{
      hour: string;
      rate: number;
      dayType: "weekday" | "weekend";
      timeSlot: "day" | "night";
    }> = [];
    let currentTime = new Date(startDateTime);
    let totalPrice = 0;

    // Calculate price for each hour
    while (currentTime < endDateTime) {
      const nextHour = new Date(currentTime);
      nextHour.setHours(nextHour.getHours() + 1);

      // Don't go beyond end time
      const slotEnd = nextHour > endDateTime ? endDateTime : nextHour;
      const slotDuration =
        (slotEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

      const { price, dayType, timeSlot } = await this.getPrice(
        currentTime,
        currentTime.getHours()
      );

      const slotPrice = price * slotDuration;
      totalPrice += slotPrice;

      // Format hour range for breakdown
      const startStr = `${String(currentTime.getHours()).padStart(
        2,
        "0"
      )}:${String(currentTime.getMinutes()).padStart(2, "0")}`;
      const endStr = `${String(slotEnd.getHours()).padStart(2, "0")}:${String(
        slotEnd.getMinutes()
      ).padStart(2, "0")}`;

      breakdown.push({
        hour: `${startStr}-${endStr}`,
        rate: price,
        dayType,
        timeSlot,
      });

      currentTime = slotEnd;
    }

    return {
      totalHours,
      breakdown,
      finalPrice: totalPrice,
    };
  }
}
