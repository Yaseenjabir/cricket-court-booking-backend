import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import authRoutes from "./routes/auth.routes";
import courtRoutes from "./routes/court.routes";
import customerRoutes from "./routes/customer.routes";
import pricingRoutes from "./routes/pricing.routes";
import { errorHandler, notFound } from "./middleware/errorHandler";
// Load environment variables
dotenv.config();

// Debug: Log Cloudinary credentials
console.log("🔧 Environment Variables Check:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log(
  "CLOUDINARY_API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "***set***" : "undefined"
);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "🏏 Cricket Booking API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    status: "healthy",
    database: "connected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Simple test endpoint
app.get("/api/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Backend is working perfectly! 🎉",
    data: {
      server: "Express + TypeScript",
      database: "MongoDB + Mongoose",
      status: "operational",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pricing", pricingRoutes);

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log("");
      console.log("🚀 =================================");
      console.log(`🏏 Cricket Booking API Server`);
      console.log(`📡 Running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("🚀 =================================");
      console.log("");
      console.log("Available endpoints:");
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/api/health`);
      console.log(`   GET  http://localhost:${PORT}/api/test`);
      console.log("");
      console.log("Authentication:");
      console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
      console.log(
        `   GET    http://localhost:${PORT}/api/auth/profile (Protected)`
      );
      console.log(
        `   GET    http://localhost:${PORT}/api/auth/verify (Protected)`
      );
      console.log("");
      console.log("Court Management:");
      console.log(`   GET    http://localhost:${PORT}/api/courts (Public)`);
      console.log(`   GET    http://localhost:${PORT}/api/courts/:id (Public)`);
      console.log(`   POST   http://localhost:${PORT}/api/courts (Protected)`);
      console.log(
        `   PUT    http://localhost:${PORT}/api/courts/:id (Protected)`
      );
      console.log(
        `   DELETE http://localhost:${PORT}/api/courts/:id (Protected)`
      );
      console.log(
        `   PATCH  http://localhost:${PORT}/api/courts/:id/status (Protected)`
      );
      console.log("");
      console.log("Customer Management:");
      console.log(
        `   GET    http://localhost:${PORT}/api/customers/phone/:phone (Public)`
      );
      console.log(
        `   POST   http://localhost:${PORT}/api/customers/find-or-create (Public)`
      );
      console.log(
        `   GET    http://localhost:${PORT}/api/customers (Protected)`
      );
      console.log(
        `   GET    http://localhost:${PORT}/api/customers/:id (Protected)`
      );
      console.log(
        `   POST   http://localhost:${PORT}/api/customers (Protected)`
      );
      console.log(
        `   PUT    http://localhost:${PORT}/api/customers/:id (Protected)`
      );
      console.log(
        `   DELETE http://localhost:${PORT}/api/customers/:id (Protected)`
      );
      console.log("");
      console.log("Pricing & Calculation:");
      console.log(
        `   POST   http://localhost:${PORT}/api/pricing/calculate (Public)`
      );
      console.log(`   GET    http://localhost:${PORT}/api/pricing (Protected)`);
      console.log(
        `   POST   http://localhost:${PORT}/api/pricing/initialize (Protected)`
      );
      console.log(
        `   GET    http://localhost:${PORT}/api/pricing/:id (Protected)`
      );
      console.log(`   POST   http://localhost:${PORT}/api/pricing (Protected)`);
      console.log(
        `   PUT    http://localhost:${PORT}/api/pricing/:id (Protected)`
      );
      console.log(
        `   DELETE http://localhost:${PORT}/api/pricing/:id (Protected)`
      );
      console.log("");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
