import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { IdentityVerificationService } from "./aadhar-pan-service";
import { insertUserSchema, insertServiceProviderSchema, insertBookingSchema, insertPaymentSchema, insertReviewSchema, insertServiceSchema, insertKycDocumentSchema, type KycDocument } from "@shared/schema";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";
import { upload, getFileUrl } from "./fileUpload";
import path from "path";
import fs from "fs";
import agentRoutes from "./routes/agents";

// Initialize Razorpay only if keys are available
let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('🔧 Razorpay initialized with Key ID:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
} else {
  console.log('⚠️  Razorpay not initialized - missing credentials. Running in demo mode.');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register/user", async (req, res) => {
    try {
      console.log("User registration request body:", req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", userData);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error("User registration error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Invalid data provided", error: (error as Error).message });
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
      res.status(400).json({ message: "Invalid data provided", error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, type } = req.body;
      console.log("Login attempt:", { email, type, passwordLength: password?.length });
      
      if (type === "admin") {
        const admin = await storage.validateAdminCredentials(email, password);
        if (admin) {
          return res.json({ user: { id: admin.id, email: admin.email, name: admin.name, role: "admin" } });
        }
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      if (type === "provider") {
        const provider = await storage.getServiceProviderByEmail(email);
        console.log("Provider found:", provider ? { id: provider.id, email: provider.email, hasPassword: !!provider.password } : "not found");
        if (provider && provider.password === password) {
          res.json({ user: { id: provider.id, name: provider.businessName, email: provider.email, type: "provider" } });
        } else {
          console.log("Provider login failed - password match:", provider ? provider.password === password : "no provider");
          res.status(401).json({ message: "Invalid credentials" });
        }
      } else {
        const user = await storage.getUserByEmail(email);
        console.log("User found:", user ? { id: user.id, email: user.email, hasPassword: !!user.password } : "not found");
        if (user && user.password === password) {
          res.json({ user: { id: user.id, name: user.name, email: user.email, type: "user" } });
        } else {
          console.log("User login failed - password match:", user ? user.password === password : "no user");
          res.status(401).json({ message: "Invalid credentials" });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
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

  // Utility route to recalculate all provider ratings
  app.post("/api/admin/recalculate-ratings", async (req, res) => {
    try {
      await storage.recalculateAllProviderRatings();
      res.json({ message: "All provider ratings recalculated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to recalculate ratings" });
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = req.body;
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/user/:userId/:userType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userType = req.params.userType as 'user' | 'provider';
      
      const messages = await storage.getMessagesForUser(userId, userType);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/received/:userId/:userType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userType = req.params.userType as 'user' | 'provider';
      
      const messages = await storage.getReceivedMessagesForUser(userId, userType);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch received messages" });
    }
  });

  app.get("/api/messages/conversation/:senderId/:receiverId/:senderType/:receiverType", async (req, res) => {
    try {
      const senderId = parseInt(req.params.senderId);
      const receiverId = parseInt(req.params.receiverId);
      const senderType = req.params.senderType;
      const receiverType = req.params.receiverType;
      
      const conversation = await storage.getConversation(senderId, receiverId, senderType, receiverType);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ message: "Message marked as read" });
    } catch (error) {
      res.status(400).json({ message: "Failed to mark message as read" });
    }
  });

  app.get("/api/messages/unread/:userId/:userType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userType = req.params.userType as 'user' | 'provider';
      
      const count = await storage.getUnreadMessageCount(userId, userType);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread message count" });
    }
  });

  // User profile routes
  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = {
        name: req.body.name,
        phone: req.body.phone,
        location: req.body.location
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      const updatedUser = await storage.updateUser(id, updateData);
      res.json({ 
        user: { 
          id: updatedUser.id, 
          name: updatedUser.name, 
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          type: "user"
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to update user profile" });
    }
  });

  // Provider profile routes
  app.put("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = {
        businessName: req.body.businessName,
        ownerName: req.body.ownerName,
        phone: req.body.phone,
        location: req.body.location,
        description: req.body.description,
        hourlyRate: req.body.hourlyRate
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      const updatedProvider = await storage.updateServiceProvider(id, updateData);
      res.json({ 
        provider: { 
          id: updatedProvider.id, 
          businessName: updatedProvider.businessName, 
          email: updatedProvider.email,
          phone: updatedProvider.phone,
          location: updatedProvider.location,
          type: "provider"
        } 
      });
    } catch (error) {
      console.error("Provider update error:", error);
      res.status(400).json({ message: "Failed to update provider profile" });
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

  // Admin Settings Management
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const adminSettings = await storage.getAdminSettings();
      if (!adminSettings) {
        return res.status(404).json({ message: "Admin settings not found" });
      }
      // Don't send password back to client
      const { password, ...safeSettings } = adminSettings;
      res.json(safeSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if admin settings already exist
      const existingAdmin = await storage.getAdminSettings();
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin settings already exist. Use PUT to update." });
      }

      const adminSettings = await storage.createAdminSettings({
        email,
        password,
        name: name || "Admin",
        isActive: true,
      });

      const { password: _, ...safeSettings } = adminSettings;
      res.json(safeSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create admin settings" });
    }
  });

  app.put("/api/admin/settings/:id", async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const { email, password, name, currentPassword } = req.body;
      
      // Verify current password before allowing changes
      if (currentPassword) {
        const existingAdmin = await storage.getAdminSettings();
        if (!existingAdmin || existingAdmin.password !== currentPassword) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      if (name) updateData.name = name;

      const updatedAdmin = await storage.updateAdminSettings(adminId, updateData);
      const { password: _, ...safeSettings } = updatedAdmin;
      res.json(safeSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin settings" });
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
      const { 
        verified, 
        kycDocuments, 
        status, 
        aadharNumber, 
        panNumber, 
        phoneVerified, 
        otpVerified 
      } = req.body;
      
      console.log("KYC update request:", { 
        id, 
        verified, 
        kycDocuments, 
        status, 
        aadharNumber, 
        panNumber, 
        phoneVerified, 
        otpVerified 
      });
      
      if (verified !== undefined) {
        // Admin approving/rejecting KYC
        console.log(`Admin ${verified ? 'approving' : 'rejecting'} KYC for provider ${id}`);
        await storage.updateProviderKycStatus(id, verified);
      } else if (kycDocuments && status) {
        // Provider submitting KYC documents
        console.log(`Provider ${id} submitting KYC documents with enhanced verification`);
        await storage.updateProviderKycDocuments(id, kycDocuments, status, {
          aadharNumber,
          panNumber,
          phoneVerified,
          otpVerified
        });
      } else {
        console.log("Invalid KYC update request - missing required fields");
        return res.status(400).json({ message: "Missing required fields for KYC update" });
      }
      
      res.json({ message: "KYC status updated" });
    } catch (error) {
      console.error("KYC update error:", error);
      res.status(400).json({ message: "Failed to update KYC status", error: (error as Error).message });
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

  app.delete("/api/admin/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Admin deleting provider ${id}`);
      
      await storage.deleteProvider(id);
      res.json({ message: "Provider deleted successfully" });
    } catch (error) {
      console.error("Provider deletion error:", error);
      res.status(400).json({ message: "Failed to delete provider", error: (error as Error).message });
    }
  });

  // Get bookings for a specific user
  app.get("/api/bookings/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const bookings = await storage.getBookingsByUserId(parseInt(userId));
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(400).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get bookings for a specific provider
  app.get("/api/bookings/provider/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const bookings = await storage.getBookingsByProviderId(parseInt(providerId));
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching provider bookings:', error);
      res.status(400).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get payments for a specific user
  app.get("/api/payments/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const payments = await storage.getPaymentsByUserId(parseInt(userId));
      res.json(payments);
    } catch (error) {
      console.error('Error fetching user payments:', error);
      res.status(400).json({ message: "Failed to fetch payments" });
    }
  });

  // Get payments for a specific provider
  app.get("/api/payments/provider/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const payments = await storage.getPaymentsByProviderId(parseInt(providerId));
      res.json(payments);
    } catch (error) {
      console.error('Error fetching provider payments:', error);
      res.status(400).json({ message: "Failed to fetch payments" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const { active } = req.query;
      let services;
      if (active === 'true') {
        services = await storage.getActiveServices();
      } else {
        services = await storage.getAllServices();
      }
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid service data",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, serviceData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid service data",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete service" });
    }
  });

  // Razorpay Payment Routes
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      if (!razorpay) {
        // Development mode fallback - simulate successful order creation
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        if (!amount) {
          return res.status(400).json({ 
            error: "Amount is required" 
          });
        }

        console.log('Creating demo order for development (Razorpay not configured)');
        const demoOrderId = `demo_order_${Date.now()}`;
        
        return res.json({
          success: true,
          order_id: demoOrderId,
          amount: Math.round(amount * 100),
          currency: currency,
          key: 'demo_key_for_development',
          isDemoMode: true
        });
      }

      const { amount, currency = 'INR', receipt, notes } = req.body;
      
      // Validate required fields
      if (!amount) {
        return res.status(400).json({ 
          error: "Amount is required" 
        });
      }

      // Create order with Razorpay
      const options = {
        amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {},
        payment_capture: 1 // Auto capture payment
      };

      console.log('Creating Razorpay order with options:', options);
      const order = await razorpay.orders.create(options);
      
      console.log('Razorpay order created:', order);
      res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ 
        error: "Failed to create order",
        details: (error as Error).message 
      });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      if (!razorpay) {
        // Development mode fallback - simulate successful payment verification
        const { 
          razorpay_order_id, 
          razorpay_payment_id, 
          razorpay_signature,
          bookingId,
          userId,
          providerId
        } = req.body;

        console.log('Demo payment verification for development (Razorpay not configured)');
        
        // Create demo payment record if booking details are provided
        if (bookingId && userId && providerId) {
          const demoPaymentId = `demo_pay_${Date.now()}`;
          
          try {
            // Get the booking to retrieve the actual amount
            const booking = await storage.getBooking(parseInt(bookingId));
            const paymentAmount = booking?.amount || '200.00';
            
            const paymentRecord = await storage.createPayment({
              id: demoPaymentId,
              bookingId: parseInt(bookingId),
              userId: parseInt(userId),
              providerId: parseInt(providerId),
              amount: paymentAmount,
              currency: 'INR',
              paymentMethod: 'Demo Payment',
              paymentGateway: 'Demo Mode',
              transactionId: razorpay_order_id || `demo_txn_${Date.now()}`,
              gatewayPaymentId: demoPaymentId,
              status: 'Successful'
            });

            // Update booking status to confirmed
            await storage.updateBookingStatus(parseInt(bookingId), 'Confirmed');

            return res.json({
              success: true,
              payment_id: demoPaymentId,
              order_id: razorpay_order_id,
              signature: 'demo_signature',
              isDemoMode: true,
              message: 'Demo payment completed successfully'
            });
          } catch (error) {
            console.error('Error creating demo payment record:', error);
            return res.status(500).json({
              success: false,
              error: 'Failed to process demo payment'
            });
          }
        }

        return res.json({
          success: true,
          payment_id: `demo_pay_${Date.now()}`,
          order_id: razorpay_order_id,
          signature: 'demo_signature',
          isDemoMode: true,
          message: 'Demo payment completed successfully'
        });
      }

      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        bookingId,
        userId,
        providerId
      } = req.body;

      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ 
          error: "Missing required payment verification data" 
        });
      }

      // Create signature for verification
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      console.log('Payment verification:', {
        razorpay_order_id,
        razorpay_payment_id,
        provided_signature: razorpay_signature,
        expected_signature: expectedSignature
      });

      // Verify signature
      if (expectedSignature === razorpay_signature) {
        // Payment is authentic
        try {
          // Get payment details from Razorpay
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          
          console.log('Razorpay payment details:', payment);

          // Save payment to database if bookingId is provided
          if (bookingId && userId && providerId) {
            const paymentRecord = await storage.createPayment({
              id: razorpay_payment_id,
              bookingId: parseInt(bookingId),
              userId: parseInt(userId),
              providerId: parseInt(providerId),
              amount: (Number(payment.amount) / 100).toString(), // Convert back from paise
              currency: payment.currency.toUpperCase(),
              paymentMethod: payment.method || 'Unknown',
              paymentGateway: 'Razorpay',
              transactionId: razorpay_order_id,
              gatewayPaymentId: razorpay_payment_id,
              status: payment.status === 'captured' ? 'Successful' : 'Pending'
            });

            // Update booking status if payment is successful
            if (payment.status === 'captured') {
              await storage.updateBookingStatus(parseInt(bookingId), 'Confirmed');
            }

            console.log('Payment record saved:', paymentRecord);
          }

          res.json({
            success: true,
            message: "Payment verified successfully",
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            amount: Number(payment.amount) / 100,
            currency: payment.currency,
            status: payment.status
          });
        } catch (fetchError) {
          console.error('Error fetching payment details:', fetchError);
          // Even if we can't fetch details, signature is valid
          res.json({
            success: true,
            message: "Payment verified successfully",
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
          });
        }
      } else {
        // Payment verification failed
        console.error('Payment verification failed - signature mismatch');
        res.status(400).json({
          success: false,
          error: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        error: "Failed to verify payment",
        details: (error as Error).message
      });
    }
  });

  // Get Razorpay Key for frontend
  app.get("/api/razorpay/key", async (req, res) => {
    try {
      res.json({
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get Razorpay key"
      });
    }
  });

  // Identity Verification Routes
  app.post("/api/verify/aadhar", async (req, res) => {
    try {
      const { aadharNumber, ownerName, providerId } = req.body;
      
      if (!aadharNumber) {
        return res.status(400).json({ message: "Aadhar number is required" });
      }

      console.log(`Verifying Aadhar number: ${aadharNumber}${ownerName ? ` for ${ownerName}` : ''}`);
      
      // Get provider's actual phone number if providerId is provided
      let registeredPhone = null;
      if (providerId) {
        try {
          const provider = await storage.getServiceProvider(parseInt(providerId));
          if (provider) {
            registeredPhone = provider.phone;
          }
        } catch (error) {
          console.error("Error fetching provider phone:", error);
        }
      }
      
      const result = await IdentityVerificationService.verifyAadhar(aadharNumber, ownerName, registeredPhone || undefined);
      
      if (!result.isValid) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        isValid: true,
        registeredPhone: result.registeredPhone,
        holderName: result.holderName,
        verified: true,
        message: "Aadhar verified successfully with government database"
      });
    } catch (error) {
      console.error("Aadhar verification error:", error);
      res.status(500).json({ message: "Failed to verify Aadhar number" });
    }
  });

  app.post("/api/verify/pan", async (req, res) => {
    try {
      const { panNumber, ownerName, providerId } = req.body;
      
      if (!panNumber) {
        return res.status(400).json({ message: "PAN number is required" });
      }

      console.log(`Verifying PAN number: ${panNumber}${ownerName ? ` for ${ownerName}` : ''}`);
      
      // Get provider's actual phone number if providerId is provided
      let registeredPhone = null;
      if (providerId) {
        try {
          const provider = await storage.getServiceProvider(parseInt(providerId));
          if (provider) {
            registeredPhone = provider.phone;
          }
        } catch (error) {
          console.error("Error fetching provider phone:", error);
        }
      }
      
      const result = await IdentityVerificationService.verifyPan(panNumber, ownerName, registeredPhone || undefined);
      
      if (!result.isValid) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        isValid: true,
        registeredPhone: result.registeredPhone,
        holderName: result.holderName,
        verified: true,
        message: "PAN verified successfully with government database"
      });
    } catch (error) {
      console.error("PAN verification error:", error);
      res.status(500).json({ message: "Failed to verify PAN number" });
    }
  });

  app.post("/api/verify/cross-verify", async (req, res) => {
    try {
      const { aadharNumber, panNumber, ownerName } = req.body;
      
      if (!aadharNumber || !panNumber || !ownerName) {
        return res.status(400).json({ 
          message: "Aadhar number, PAN number, and owner name are required" 
        });
      }

      console.log(`Cross-verifying identity for: ${ownerName}`);
      const result = await IdentityVerificationService.crossVerifyIdentity(
        aadharNumber, 
        panNumber, 
        ownerName
      );
      
      if (!result.isMatched) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        isMatched: true,
        verifiedPhone: result.verifiedPhone,
        message: "Identity cross-verification successful"
      });
    } catch (error) {
      console.error("Cross-verification error:", error);
      res.status(500).json({ message: "Failed to cross-verify identity" });
    }
  });

  // Aadhar OTP Verification
  app.post("/api/verify/aadhar/otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      const otpRecord = await storage.getLatestOtpVerification(phone);
      
      if (!otpRecord) {
        return res.status(400).json({ message: "No OTP found for this phone number" });
      }

      if (otpRecord.verified) {
        return res.status(400).json({ message: "OTP already verified" });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ message: "OTP expired. Please request a new one" });
      }

      if ((otpRecord.attempts || 0) >= 3) {
        return res.status(400).json({ message: "Maximum attempts reached. Please request a new OTP" });
      }

      if (otpRecord.otp !== otp) {
        // Increment attempts
        await storage.incrementOtpAttempts(otpRecord.id);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Mark OTP as verified
      await storage.markOtpVerified(otpRecord.id);
      
      res.json({ 
        message: "Aadhar OTP verified successfully", 
        verified: true,
        documentType: "aadhar"
      });
    } catch (error) {
      console.error("Aadhar OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify Aadhar OTP" });
    }
  });

  // PAN OTP Verification
  app.post("/api/verify/pan/otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      const otpRecord = await storage.getLatestOtpVerification(phone);
      
      if (!otpRecord) {
        return res.status(400).json({ message: "No OTP found for this phone number" });
      }

      if (otpRecord.verified) {
        return res.status(400).json({ message: "OTP already verified" });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ message: "OTP expired. Please request a new one" });
      }

      if ((otpRecord.attempts || 0) >= 3) {
        return res.status(400).json({ message: "Maximum attempts reached. Please request a new OTP" });
      }

      if (otpRecord.otp !== otp) {
        // Increment attempts
        await storage.incrementOtpAttempts(otpRecord.id);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Mark OTP as verified
      await storage.markOtpVerified(otpRecord.id);
      
      res.json({ 
        message: "PAN OTP verified successfully", 
        verified: true,
        documentType: "pan"
      });
    } catch (error) {
      console.error("PAN OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify PAN OTP" });
    }
  });

  // OTP Verification Routes
  app.post("/api/otp/send", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Store OTP in database
      await storage.createOtpVerification({
        phone,
        otp,
        expiresAt,
        verified: false,
        attempts: 0
      });

      // In production, send actual SMS using providers like Twilio, MSG91, etc.
      console.log(`OTP for ${phone}: ${otp} (expires at ${expiresAt})`);
      
      // Simulate realistic SMS delivery with Indian carrier format
      const maskedPhone = phone.replace(/(\+91)(\d{4})(\d{6})/, '$1****$3');
      
      res.json({ 
        message: `OTP sent successfully to ${maskedPhone}`,
        // Realistic response format similar to Indian SMS gateways
        reference_id: `SMS${Date.now()}`,
        status: "SENT",
        delivery_time: "30-60 seconds",
        // Only for testing - remove in production
        debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      const otpRecord = await storage.getLatestOtpVerification(phone);
      
      if (!otpRecord) {
        return res.status(400).json({ message: "No OTP found for this phone number" });
      }

      if (otpRecord.verified) {
        return res.status(400).json({ message: "OTP already verified" });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      if ((otpRecord.attempts || 0) >= 3) {
        return res.status(400).json({ message: "Maximum attempts reached" });
      }

      if (otpRecord.otp !== otp) {
        // Increment attempts
        await storage.incrementOtpAttempts(otpRecord.id);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Mark OTP as verified
      await storage.markOtpVerified(otpRecord.id);
      
      res.json({ message: "OTP verified successfully", verified: true });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // File Upload Routes for KYC Documents
  app.post("/api/upload/kyc-document", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { providerId, documentType } = req.body;
      
      if (!providerId || !documentType) {
        return res.status(400).json({ message: "Provider ID and document type are required" });
      }

      // Save file information to database
      const kycDocument = await storage.createKycDocument({
        providerId: parseInt(providerId),
        documentType,
        originalName: req.file.originalname,
        filename: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json({
        success: true,
        message: "Document uploaded successfully",
        document: {
          id: kycDocument.id,
          originalName: req.file.originalname,
          documentType,
          fileUrl: getFileUrl(req.file.filename)
        }
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Serve uploaded files
  app.get("/api/files/kyc-documents/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', 'kyc-documents', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set appropriate headers based on file type
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.doc') contentType = 'application/msword';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("File serving error:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Get KYC documents for a provider
  app.get("/api/providers/:id/kyc-documents", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const documents = await storage.getKycDocuments(providerId);
      
      // Add file URLs to documents
      const documentsWithUrls = documents.map((doc: KycDocument) => ({
        ...doc,
        fileUrl: getFileUrl(doc.filename)
      }));
      
      res.json({ documents: documentsWithUrls });
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  // AI Agent Management Routes
  app.use("/api/admin", agentRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
