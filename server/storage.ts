import { 
  users, 
  serviceProviders, 
  bookings, 
  payments, 
  reviews,
  type User, 
  type InsertUser,
  type ServiceProvider,
  type InsertServiceProvider,
  type Booking,
  type InsertBooking,
  type Payment,
  type InsertPayment,
  type Review,
  type InsertReview
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  updateUserStatus(id: number, status: string): Promise<void>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Service Providers
  getServiceProvider(id: number): Promise<ServiceProvider | undefined>;
  getServiceProviderByEmail(email: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  updateProviderKycStatus(id: number, verified: boolean): Promise<void>;
  updateProviderKycDocuments(id: number, kycDocuments: any, status: string): Promise<void>;
  updateProviderStatus(id: number, status: string): Promise<void>;
  getProvidersByService(serviceName: string): Promise<ServiceProvider[]>;
  getAllServiceProviders(): Promise<ServiceProvider[]>;
  searchProviders(query: string): Promise<ServiceProvider[]>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getProviderBookings(providerId: number): Promise<Booking[]>;
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getBookingsByProviderId(providerId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  getAllBookings(): Promise<Booking[]>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  getPaymentsByProviderId(providerId: number): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getProviderReviews(providerId: number): Promise<Review[]>;
  updateReviewStatus(id: number, status: string): Promise<void>;
  getAllReviews(): Promise<Review[]>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalProviders: number;
    totalBookings: number;
    totalRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<void> {
    await db.update(users).set({ status }).where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Service Providers
  async getServiceProvider(id: number): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
    return provider || undefined;
  }

  async getServiceProviderByEmail(email: string): Promise<ServiceProvider | undefined> {
    const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.email, email));
    return provider || undefined;
  }

  async createServiceProvider(insertProvider: InsertServiceProvider): Promise<ServiceProvider> {
    const [provider] = await db
      .insert(serviceProviders)
      .values(insertProvider)
      .returning();
    return provider;
  }

  async updateProviderKycStatus(id: number, verified: boolean): Promise<void> {
    console.log(`Updating KYC status for provider ${id} to ${verified ? 'verified' : 'rejected'}`);
    
    try {
      if (verified) {
        // Get current KYC documents and add verified timestamp
        const [provider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
        const currentKyc = provider?.kycDocuments || {};
        const updatedKyc = { ...currentKyc, verified_at: new Date().toISOString() };
        
        await db.update(serviceProviders).set({ 
          kycVerified: true, 
          status: "Active",
          kycDocuments: updatedKyc
        }).where(eq(serviceProviders.id, id));
      } else {
        await db.update(serviceProviders).set({ 
          kycVerified: false, 
          status: "Rejected" 
        }).where(eq(serviceProviders.id, id));
      }
      
      console.log(`Successfully updated provider ${id} KYC status to ${verified ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error(`Error updating KYC status for provider ${id}:`, error);
      throw error;
    }
  }

  async updateProviderKycDocuments(id: number, kycDocuments: any, status: string): Promise<void> {
    await db.update(serviceProviders).set({ 
      kycDocuments, 
      status 
    }).where(eq(serviceProviders.id, id));
  }

  async updateProviderStatus(id: number, status: string): Promise<void> {
    await db.update(serviceProviders).set({ status }).where(eq(serviceProviders.id, id));
  }

  async getProvidersByService(serviceName: string): Promise<ServiceProvider[]> {
    return await db
      .select()
      .from(serviceProviders)
      .where(and(
        eq(serviceProviders.serviceName, serviceName),
        eq(serviceProviders.kycVerified, true),
        eq(serviceProviders.status, "Active")
      ))
      .orderBy(desc(serviceProviders.rating));
  }

  async getAllServiceProviders(): Promise<ServiceProvider[]> {
    return await db.select().from(serviceProviders).orderBy(desc(serviceProviders.createdAt));
  }

  async searchProviders(query: string): Promise<ServiceProvider[]> {
    return await db
      .select()
      .from(serviceProviders)
      .where(and(
        ilike(serviceProviders.serviceName, `%${query}%`),
        eq(serviceProviders.kycVerified, true),
        eq(serviceProviders.status, "Active")
      ));
  }

  // Bookings
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getProviderBookings(providerId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.providerId, providerId))
      .orderBy(desc(bookings.createdAt));
  }

  async updateBookingStatus(id: number, status: string): Promise<void> {
    const updateData: any = { status };
    if (status === "Completed") {
      updateData.completedAt = new Date();
    } else if (status === "Cancelled") {
      updateData.cancelledAt = new Date();
    }
    await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByProviderId(providerId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.providerId, providerId))
      .orderBy(desc(bookings.createdAt));
  }

  // Payments
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByProviderId(providerId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.providerId, providerId))
      .orderBy(desc(payments.createdAt));
  }

  // Reviews
  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async getProviderReviews(providerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));
  }

  async updateReviewStatus(id: number, status: string): Promise<void> {
    await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  }

  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalProviders: number;
    totalBookings: number;
    totalRevenue: number;
  }> {
    const [userCount] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users);
    const [providerCount] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(serviceProviders);
    const [bookingCount] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(bookings);
    const [revenueSum] = await db.select({ 
      sum: sql<number>`cast(coalesce(sum(amount), 0) as decimal)` 
    }).from(payments).where(eq(payments.status, "Successful"));

    return {
      totalUsers: userCount.count,
      totalProviders: providerCount.count,
      totalBookings: bookingCount.count,
      totalRevenue: Number(revenueSum.sum) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
