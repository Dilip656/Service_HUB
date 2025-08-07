import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertServiceProviderSchema, insertBookingSchema, insertPaymentSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  app.post("/api/auth/register/provider", async (req, res) => {
    try {
      console.log("Provider registration request body:", req.body);
      const providerData = insertServiceProviderSchema.parse(req.body);
      console.log("Parsed provider data:", providerData);
      
      const existingProvider = await storage.getServiceProviderByEmail(providerData.email);
      
      if (existingProvider) {
        return res.status(400).json({ message: "Provider already exists" });
      }
      
      const provider = await storage.createServiceProvider(providerData);
      res.json({ provider: { id: provider.id, businessName: provider.businessName, email: provider.email } });
    } catch (error) {
      console.error("Provider registration error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, type } = req.body;
      
      if (type === "admin") {
        // Simple admin check - in production, use proper authentication
        if (email === "admin@servicehub.com" && password === "admin123") {
          return res.json({ user: { id: 1, email, role: "admin" } });
        }
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (user && user.password === password) {
        res.json({ user: { id: user.id, name: user.name, email: user.email } });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Provider routes
  app.get("/api/providers", async (req, res) => {
    try {
      const { service, search } = req.query;
      
      let providers;
      if (service) {
        providers = await storage.getProvidersByService(service as string);
      } else if (search) {
        providers = await storage.searchProviders(search as string);
      } else {
        providers = await storage.getAllServiceProviders();
      }
      
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.get("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const provider = await storage.getServiceProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      res.json(provider);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Booking routes
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.get("/api/bookings", async (req, res) => {
    try {
      const { userId, providerId } = req.query;
      
      let bookings;
      if (userId) {
        bookings = await storage.getUserBookings(parseInt(userId as string));
      } else if (providerId) {
        bookings = await storage.getProviderBookings(parseInt(providerId as string));
      } else {
        bookings = await storage.getAllBookings();
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.put("/api/bookings/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateBookingStatus(id, status);
      res.json({ message: "Booking status updated" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update booking status" });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  app.get("/api/payments", async (req, res) => {
    try {
      const { userId } = req.query;
      
      let payments;
      if (userId) {
        payments = await storage.getUserPayments(parseInt(userId as string));
      } else {
        payments = await storage.getAllPayments();
      }
      
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Review routes
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.get("/api/reviews", async (req, res) => {
    try {
      const { providerId } = req.query;
      
      let reviews;
      if (providerId) {
        reviews = await storage.getProviderReviews(parseInt(providerId as string));
      } else {
        reviews = await storage.getAllReviews();
      }
      
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.put("/api/reviews/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateReviewStatus(id, status);
      res.json({ message: "Review status updated" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update review status" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateUserStatus(id, status);
      res.json({ message: "User status updated" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update user status" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/admin/providers/:id/kyc", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { verified, kycDocuments, status } = req.body;
      
      if (verified !== undefined) {
        // Admin approving/rejecting KYC
        await storage.updateProviderKycStatus(id, verified);
      } else if (kycDocuments && status) {
        // Provider submitting KYC documents
        await storage.updateProviderKycDocuments(id, kycDocuments, status);
      }
      
      res.json({ message: "KYC status updated" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update KYC status" });
    }
  });

  app.put("/api/admin/providers/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateProviderStatus(id, status);
      res.json({ message: "Provider status updated" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update provider status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
