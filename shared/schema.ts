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
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  lastBooking: timestamp("last_booking"),
});

export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  providerId: integer("provider_id").notNull(),
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
  bookingId: integer("booking_id").notNull(),
  userId: integer("user_id").notNull(),
  providerId: integer("provider_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
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
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone: z.string().optional(),
  location: z.string().optional(),
  status: z.string().default("Active"),
});

export const insertServiceProviderSchema = z.object({
  businessName: z.string(),
  ownerName: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone: z.string(),
  serviceName: z.string(),
  serviceCategory: z.string(),
  experience: z.number(),
  description: z.string(),
  hourlyRate: z.string(), // Using string for decimal compatibility
  availability: z.array(z.string()).optional(),
  location: z.string(),
  kycVerified: z.boolean().default(false),
  kycDocuments: z.any().optional(),
  status: z.string().default("Pending"),
});

export const insertBookingSchema = z.object({
  userId: z.number(),
  providerId: z.number(),
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
  bookingId: z.number(),
  userId: z.number(),
  providerId: z.number(),
  rating: z.number(),
  comment: z.string(),
  status: z.string().default("pending"),
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
