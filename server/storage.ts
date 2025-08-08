import { 
  users, 
  serviceProviders, 
  bookings, 
  payments, 
  reviews,
  messages,
  services,
  type User, 
  type InsertUser,
  type ServiceProvider,
  type InsertServiceProvider,
  type Booking,
  type InsertBooking,
  type Payment,
  type InsertPayment,
  type Review,
  type InsertReview,
  type Message,
  type InsertMessage,
  adminSettings,
  type AdminSettings,
  type InsertAdminSettings,
  type Service,
  type InsertService
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, ne } from "drizzle-orm";

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
  updateServiceProvider(id: number, providerData: Partial<InsertServiceProvider>): Promise<ServiceProvider>;
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

  // Admin Settings
  getAdminSettings(): Promise<AdminSettings | undefined>;
  createAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings>;
  updateAdminSettings(id: number, settings: Partial<InsertAdminSettings>): Promise<AdminSettings>;
  validateAdminCredentials(email: string, password: string): Promise<AdminSettings | undefined>;

  // Services
  getAllServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, serviceData: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
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

  async updateServiceProvider(id: number, providerData: Partial<InsertServiceProvider>): Promise<ServiceProvider> {
    const [provider] = await db.update(serviceProviders).set(providerData).where(eq(serviceProviders.id, id)).returning();
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
    
    // Update provider rating and review count
    await this.updateProviderRating(insertReview.providerId);
    
    return review;
  }

  async updateProviderRating(providerId: number): Promise<void> {
    // Get all approved reviews for this provider (excluding rejected ones)
    const providerReviews = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.providerId, providerId),
        ne(reviews.status, "rejected")
      ));
    
    const reviewCount = providerReviews.length;
    let averageRating = null;
    
    if (reviewCount > 0) {
      const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviewCount).toFixed(2);
    }
    
    // Update provider with new rating and review count
    await db
      .update(serviceProviders)
      .set({ 
        rating: averageRating,
        reviewCount: reviewCount
      })
      .where(eq(serviceProviders.id, providerId));
  }

  async getProviderReviews(providerId: number): Promise<Review[]> {
    // Return all reviews except rejected ones
    return await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.providerId, providerId),
        ne(reviews.status, "rejected")
      ))
      .orderBy(desc(reviews.createdAt));
  }

  async updateReviewStatus(id: number, status: string): Promise<void> {
    // Get the review to find the provider ID
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    
    await db.update(reviews).set({ status }).where(eq(reviews.id, id));
    
    // Update provider rating whenever review status changes
    if (review) {
      await this.updateProviderRating(review.providerId);
    }
  }

  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async recalculateAllProviderRatings(): Promise<void> {
    const allProviders = await db.select().from(serviceProviders);
    
    for (const provider of allProviders) {
      await this.updateProviderRating(provider.id);
    }
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

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesForUser(userId: number, userType: 'user' | 'provider'): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        userType === 'user' 
          ? and(
              eq(messages.senderId, userId),
              eq(messages.senderType, 'user')
            )
          : and(
              eq(messages.senderId, userId),
              eq(messages.senderType, 'provider')
            )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getReceivedMessagesForUser(userId: number, userType: 'user' | 'provider'): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.receiverType, userType)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(senderId: number, receiverId: number, senderType: string, receiverType: string): Promise<Message[]> {
    // Get messages in both directions for a complete conversation
    return await db
      .select()
      .from(messages)
      .where(
        and(
          // Messages from sender to receiver OR from receiver to sender
          or(
            and(
              eq(messages.senderId, senderId),
              eq(messages.receiverId, receiverId),
              eq(messages.senderType, senderType),
              eq(messages.receiverType, receiverType)
            ),
            and(
              eq(messages.senderId, receiverId),
              eq(messages.receiverId, senderId),
              eq(messages.senderType, receiverType),
              eq(messages.receiverType, senderType)
            )
          )
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async getUnreadMessageCount(userId: number, userType: 'user' | 'provider'): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.receiverType, userType),
          eq(messages.isRead, false)
        )
      );
    return result.count;
  }

  // Admin Settings
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [admin] = await db.select().from(adminSettings).where(eq(adminSettings.isActive, true));
    return admin || undefined;
  }

  async createAdminSettings(insertAdminSettings: InsertAdminSettings): Promise<AdminSettings> {
    const [admin] = await db
      .insert(adminSettings)
      .values(insertAdminSettings)
      .returning();
    return admin;
  }

  async updateAdminSettings(id: number, settingsData: Partial<InsertAdminSettings>): Promise<AdminSettings> {
    const [admin] = await db.update(adminSettings).set({
      ...settingsData,
      updatedAt: sql`now()`
    }).where(eq(adminSettings.id, id)).returning();
    return admin;
  }

  async validateAdminCredentials(email: string, password: string): Promise<AdminSettings | undefined> {
    const [admin] = await db
      .select()
      .from(adminSettings)
      .where(and(
        eq(adminSettings.email, email),
        eq(adminSettings.password, password),
        eq(adminSettings.isActive, true)
      ));
    return admin || undefined;
  }

  // Services
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(desc(services.createdAt));
  }

  async getActiveServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(services.name);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service> {
    const [service] = await db.update(services).set({
      ...serviceData,
      updatedAt: sql`now()`
    }).where(eq(services.id, id)).returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }
}

export const storage = new DatabaseStorage();
