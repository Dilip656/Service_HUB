import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  location: text("location"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const serviceProviders = pgTable("service_providers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  serviceName: text("service_name").notNull(),
  serviceCategory: text("service_category").notNull(),
  experience: integer("experience").notNull(),
  description: text("description").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  availability: text("availability").array(),
  location: text("location").notNull(),
  kycVerified: boolean("kyc_verified").default(false),
  kycDocuments: jsonb("kyc_documents"),
  aadharNumber: text("aadhar_number"),
  panNumber: text("pan_number"),
  phoneVerified: boolean("phone_verified").default(false),
  otpVerified: boolean("otp_verified").default(false),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  lastBooking: timestamp("last_booking"),
});

export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  providerId: integer("provider_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  serviceName: text("service_name").notNull(),
  bookingDate: text("booking_date").notNull(),
  bookingTime: text("booking_time").notNull(),
  serviceAddress: text("service_address").notNull(),
  requirements: text("requirements"),
  status: text("status").notNull().default("Pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  userId: integer("user_id").notNull(),
  providerId: integer("provider_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  paymentMethod: text("payment_method").notNull(), // PhonePe, Paytm, GooglePay, UPI, etc.
  paymentGateway: text("payment_gateway").notNull(), // For storing gateway provider
  transactionId: text("transaction_id"), // Gateway transaction ID
  gatewayPaymentId: text("gateway_payment_id"), // Gateway specific payment ID
  status: text("status").notNull().default("Pending"),
  failureReason: text("failure_reason"), // Reason for failed payments
  transactionDate: timestamp("transaction_date").default(sql`now()`).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookingId: integer("booking_id"), // Made optional for direct reviews
  userId: integer("user_id").notNull(),
  providerId: integer("provider_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  senderType: text("sender_type").notNull(), // 'user' or 'provider'
  receiverType: text("receiver_type").notNull(), // 'user' or 'provider'
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default("Admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const services = pgTable("services", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  payments: many(payments),
  reviews: many(reviews),
}));

export const serviceProvidersRelations = relations(serviceProviders, ({ many }) => ({
  bookings: many(bookings),
  payments: many(payments),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  provider: one(serviceProviders, {
    fields: [bookings.providerId],
    references: [serviceProviders.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  provider: one(serviceProviders, {
    fields: [payments.providerId],
    references: [serviceProviders.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  provider: one(serviceProviders, {
    fields: [reviews.providerId],
    references: [serviceProviders.id],
  }),
}));

// Insert schemas - Manual definitions to avoid drizzle-zod version issues
export const insertUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number (10 digits starting with 6-9 or with +91)'),
  location: z.string().min(2, 'Location is required'),
  status: z.string().default("Active"),
});

export const insertServiceProviderSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number (10 digits starting with 6-9 or with +91)'),
  serviceName: z.string().min(1, 'Please select a service'),
  serviceCategory: z.string().min(1, 'Service category is required'),
  experience: z.number().min(0).max(50),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  hourlyRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 50000, 'Hourly rate must be between ₹1 and ₹50,000'), // Using string for decimal compatibility
  availability: z.array(z.string()).optional(),
  location: z.string().min(2, 'Location is required'),
  kycVerified: z.boolean().default(false),
  kycDocuments: z.any().optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be 12 digits').optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN number must be in format: ABCDE1234F').optional(),
  phoneVerified: z.boolean().default(false),
  otpVerified: z.boolean().default(false),
  status: z.string().default("Pending"),
});

// OTP verification table for phone number verification
export const otpVerifications = pgTable("otp_verifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Type definitions for OTP verification
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = typeof otpVerifications.$inferInsert;

// Insert schema for OTP verification
export const insertOtpVerificationSchema = z.object({
  phone: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(6, 'OTP must be at most 6 digits'),
});

export const insertBookingSchema = z.object({
  userId: z.number(),
  providerId: z.number(),
  customerName: z.string(),
  customerPhone: z.string(),
  serviceName: z.string(),
  bookingDate: z.string(),
  bookingTime: z.string(),
  serviceAddress: z.string(),
  requirements: z.string().optional(),
  status: z.string().default("Pending"),
  amount: z.string().optional(), // Using string for decimal compatibility
});

export const insertPaymentSchema = z.object({
  id: z.string(),
  bookingId: z.number(),
  userId: z.number(),
  providerId: z.number(),
  amount: z.string(), // Using string for decimal compatibility
  currency: z.string().default("INR"),
  paymentMethod: z.string(), // PhonePe, Paytm, GooglePay, UPI, etc.
  paymentGateway: z.string(), // Gateway provider
  transactionId: z.string().optional(),
  gatewayPaymentId: z.string().optional(),
  status: z.string().default("Pending"),
  failureReason: z.string().optional(),
  transactionDate: z.date().optional(),
});

export const insertReviewSchema = z.object({
  bookingId: z.number().optional(), // Made optional for direct reviews
  userId: z.number(),
  providerId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  status: z.string().default("pending"),
});

export const insertMessageSchema = z.object({
  senderId: z.number(),
  receiverId: z.number(),
  senderType: z.enum(["user", "provider"]),
  receiverType: z.enum(["user", "provider"]),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  isRead: z.boolean().default(false),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const insertAdminSettingsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().default("Admin"),
  isActive: z.boolean().default(true),
});

export const insertServiceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
