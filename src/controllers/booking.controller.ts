import { Request, Response } from "express";
import Booking from "../models/Booking";
import Court from "../models/Court";
import Customer from "../models/Customer";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/ApiError";
import { BookingService } from "../services/booking.service";
import { PricingService } from "../services/pricing.service";
import {
  CreateBookingDTO,
  CreateManualBookingDTO,
  CheckAvailabilityDTO,
  UpdateBookingStatusDTO,
  UpdatePaymentDTO,
  BookingFilters,
} from "../types/booking.types";

/**
 * Check availability for a time slot
 * Public endpoint
 */
export const checkAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { courtId, bookingDate, startTime, endTime } =
      req.body as CheckAvailabilityDTO;

    if (!courtId || !bookingDate || !startTime || !endTime) {
      throw new BadRequestError("All fields are required");
    }

    // Verify court exists
    const court = await Court.findById(courtId);
    if (!court) {
      throw new NotFoundError("Court");
    }

    // Check availability
    const result = await BookingService.checkAvailability({
      courtId,
      bookingDate,
      startTime,
      endTime,
    });

    res.json({
      success: true,
      data: result,
      message: "Availability checked successfully",
    });
  }
);

/**
 * Create a new booking (customer flow)
 * Public endpoint
 */
export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      courtId,
      bookingDate,
      startTime,
      endTime,
      customerPhone,
      customerName,
      customerEmail,
      notes,
    } = req.body as CreateBookingDTO;

    // Validate required fields
    if (
      !courtId ||
      !bookingDate ||
      !startTime ||
      !endTime ||
      !customerPhone ||
      !customerName
    ) {
      throw new BadRequestError("All required fields must be provided");
    }

    // Verify court exists
    const court = await Court.findById(courtId);
    if (!court) {
      throw new NotFoundError("Court");
    }

    // Check court status (active or maintenance)
    if (court.status === "inactive") {
      throw new BadRequestError("Court is not available for booking");
    }

    // Normalize booking date
    const dateObj = new Date(bookingDate);
    dateObj.setHours(0, 0, 0, 0);

    // Validate booking time
    BookingService.validateBookingTime(startTime, endTime, dateObj);

    // Check availability
    const availability = await BookingService.checkAvailability({
      courtId,
      bookingDate: dateObj,
      startTime,
      endTime,
    });

    if (!availability.available) {
      throw new ConflictError("Time slot is not available");
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: customerPhone });
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      });
    }

    // Calculate duration
    const durationHours = BookingService.calculateDuration(startTime, endTime);

    // Calculate pricing
    const pricingResult = await PricingService.calculateBookingPrice(
      bookingDate,
      startTime,
      endTime
    );

    // Create booking
    const booking = await Booking.create({
      customer: customer._id,
      court: courtId,
      bookingDate: dateObj,
      startTime,
      endTime,
      durationHours,
      totalPrice: pricingResult.finalPrice,
      pricingBreakdown: pricingResult.breakdown,
      discountAmount: 0,
      finalPrice: pricingResult.finalPrice,
      paymentStatus: "pending",
      amountPaid: 0,
      status: "pending",
      notes,
      createdBy: "customer",
    });

    // Increment customer's total bookings
    await Customer.findByIdAndUpdate(customer._id, {
      $inc: { totalBookings: 1 },
    });

    // Populate references for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: "Booking created successfully",
    });
  }
);

/**
 * Create manual booking or block time slot (admin only)
 * Protected endpoint
 */
export const createManualBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      courtId,
      bookingDate,
      startTime,
      endTime,
      customerPhone,
      customerName,
      customerEmail,
      notes,
      isBlocked,
    } = req.body as CreateManualBookingDTO;

    // Validate required fields
    if (!courtId || !bookingDate || !startTime || !endTime) {
      throw new BadRequestError("Court, date, and time fields are required");
    }

    // If not blocked, customer info is required
    if (!isBlocked && (!customerPhone || !customerName)) {
      throw new BadRequestError(
        "Customer information is required for bookings"
      );
    }

    // Verify court exists
    const court = await Court.findById(courtId);
    if (!court) {
      throw new NotFoundError("Court");
    }

    // Normalize booking date
    const dateObj = new Date(bookingDate);
    dateObj.setHours(0, 0, 0, 0);

    // Validate booking time
    BookingService.validateBookingTime(startTime, endTime, dateObj);

    // Check availability
    const availability = await BookingService.checkAvailability({
      courtId,
      bookingDate: dateObj,
      startTime,
      endTime,
    });

    if (!availability.available) {
      throw new ConflictError("Time slot is not available");
    }

    // Calculate duration
    const durationHours = BookingService.calculateDuration(startTime, endTime);

    let customerId;
    let totalPrice = 0;
    let pricingBreakdown: any[] = [];

    // If not a blocked booking, handle customer and pricing
    if (!isBlocked) {
      // Find or create customer
      let customer = await Customer.findOne({ phone: customerPhone });
      if (!customer) {
        customer = await Customer.create({
          name: customerName!,
          phone: customerPhone!,
          email: customerEmail,
        });
      }
      customerId = customer._id;

      // Calculate pricing
      const pricingResult = await PricingService.calculateBookingPrice(
        bookingDate,
        startTime,
        endTime
      );
      totalPrice = pricingResult.finalPrice;
      pricingBreakdown = pricingResult.breakdown;

      // Increment customer's total bookings
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalBookings: 1 },
      });
    }

    // Create booking
    const booking = await Booking.create({
      customer: customerId,
      court: courtId,
      bookingDate: dateObj,
      startTime,
      endTime,
      durationHours,
      totalPrice,
      pricingBreakdown,
      discountAmount: 0,
      finalPrice: totalPrice,
      paymentStatus: isBlocked ? "paid" : "pending", // Blocked bookings are marked as paid
      amountPaid: 0,
      status: isBlocked ? "blocked" : "pending",
      notes,
      createdBy: "admin",
    });

    // Populate references for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: isBlocked
        ? "Time slot blocked successfully"
        : "Manual booking created successfully",
    });
  }
);

/**
 * Get all bookings with filters (admin only)
 * Protected endpoint
 */
export const getAllBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      courtId,
      customerId,
      status,
      paymentStatus,
      startDate,
      endDate,
      createdBy,
      page = 1,
      limit = 20,
    } = req.query as any;

    const query: any = {};

    if (courtId) query.court = courtId;
    if (customerId) query.customer = customerId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (createdBy) query.createdBy = createdBy;

    // Date range filter
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        query.bookingDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.bookingDate.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("customer", "name phone email")
        .populate("court", "name description")
        .sort({ bookingDate: -1, startTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: bookings.length,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }
);

/**
 * Get single booking by ID
 * Public endpoint (for customer to check their booking)
 */
export const getBookingById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    res.json({
      success: true,
      data: booking,
    });
  }
);

/**
 * Update booking status (admin only)
 * Protected endpoint
 */
export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body as UpdateBookingStatusDTO;

    if (!status) {
      throw new BadRequestError("Status is required");
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Validate status transitions
    if (booking.status === "cancelled") {
      throw new BadRequestError("Cannot update status of cancelled booking");
    }

    if (booking.status === "completed") {
      throw new BadRequestError("Cannot update status of completed booking");
    }

    // Update booking
    booking.status = status;
    if (notes) {
      booking.notes = notes;
    }
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    res.json({
      success: true,
      data: populatedBooking,
      message: "Booking status updated successfully",
    });
  }
);

/**
 * Update payment information (admin or webhook)
 * Protected endpoint
 */
export const updatePayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amountPaid, paymentStatus, paymentMethod, paymentReference } =
      req.body as UpdatePaymentDTO;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Update payment information
    if (amountPaid !== undefined) booking.amountPaid = amountPaid;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (paymentReference) booking.paymentReference = paymentReference;

    // Auto-update booking status based on payment
    if (paymentStatus === "paid" || paymentStatus === "partial") {
      if (booking.status === "pending") {
        booking.status = "confirmed";
      }
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    res.json({
      success: true,
      data: populatedBooking,
      message: "Payment updated successfully",
    });
  }
);

/**
 * Update booking details (admin only)
 * Protected endpoint
 */
export const updateBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Only allow updating notes for now
    // Time and date changes require availability check and should be handled separately
    if (notes !== undefined) {
      booking.notes = notes;
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    res.json({
      success: true,
      data: populatedBooking,
      message: "Booking updated successfully",
    });
  }
);

/**
 * Cancel booking (soft delete)
 * Public endpoint (customer can cancel) or Admin
 */
export const cancelBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking");
    }

    if (booking.status === "cancelled") {
      throw new BadRequestError("Booking is already cancelled");
    }

    if (booking.status === "completed") {
      throw new BadRequestError("Cannot cancel completed booking");
    }

    // Soft delete - mark as cancelled
    booking.status = "cancelled";
    if (reason) {
      booking.notes = booking.notes
        ? `${booking.notes}\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name phone email")
      .populate("court", "name description");

    res.json({
      success: true,
      data: populatedBooking,
      message: "Booking cancelled successfully",
    });
  }
);
