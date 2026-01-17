export interface IPricingRule {
  dayType: "weekday" | "weekend";
  timeSlot: "day" | "night";
  pricePerHour: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPricingRuleCreate {
  dayType: "weekday" | "weekend";
  timeSlot: "day" | "night";
  pricePerHour: number;
  isActive?: boolean;
}

export interface IPricingRuleUpdate {
  dayType?: "weekday" | "weekend";
  timeSlot?: "day" | "night";
  pricePerHour?: number;
  isActive?: boolean;
}

export interface ITimeSlotPrice {
  startTime: Date;
  endTime: Date;
  hours: number;
  pricePerHour: number;
  totalPrice: number;
  dayType: "weekday" | "weekend";
  timeSlot: "day" | "night";
}

export interface IPriceCalculation {
  courtId: string;
  startTime: Date;
  endTime: Date;
  totalHours: number;
  breakdown: ITimeSlotPrice[];
  subtotal: number;
  discount: number;
  finalPrice: number;
  promoCode?: string;
}
