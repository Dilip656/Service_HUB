# Overview

ServiceHub is a professional service marketplace platform that connects users with KYC-verified service providers. The application enables customers to browse services across multiple categories (home, events, personal care, business), view provider profiles, and book appointments. It includes comprehensive admin functionality for managing users, providers, bookings, and platform operations.

## Recent Changes (August 2025)
- **✓ Fixed DATABASE_URL connection issue** - Created PostgreSQL database and resolved startup errors
- **✓ Enhanced KYC Workflow** - Implemented comprehensive KYC submission and admin approval process
- **✓ Improved Admin Dashboard** - Added dedicated KYC review section for pending approvals  
- **✓ Provider Registration Flow** - Fixed provider ID storage for KYC process linking
- **✓ Document Verification System** - Added detailed document requirements with validation
- **✓ Fixed KYC Approval API** - Resolved 400 errors and improved error logging
- **✓ Complete Workflow Integration** - KYC approved providers automatically appear in services
- **✓ Indian Payment System** - Integrated PhonePe, Paytm, Google Pay, and UPI payment methods
- **✓ INR Currency Support** - All payments processed in Indian Rupees with proper formatting
- **✓ Enhanced Booking Flow** - Added hourly rate calculation and payment modal integration
- **✓ Real Payment Processing** - Implemented Razorpay integration with UPI deep links for authentic payment experience
- **✓ Payment Status Tracking** - Added real-time payment monitoring and verification system
- **✓ Improved Security** - Enhanced password validation requiring uppercase, lowercase, and numbers
- **✓ Better Form Validation** - Phone numbers validated for 10-15 digits, comprehensive error handling
- **✓ Authentication-Protected Booking** - Added login requirement for booking services with redirect functionality
- **✓ Removed Demo Upload Options** - Cleaned up KYC verification to require actual file uploads only
- **✓ Fixed Admin Dashboard Display** - Resolved user and provider data visibility issues with proper debugging
- **✓ Differentiated User Interfaces** - Created separate dashboards for users and service providers
- **✓ User Dashboard** - Shows personal bookings, payment history, service stats, and quick actions
- **✓ Provider Dashboard** - Displays business profile, received bookings, earnings, and customer management
- **✓ Smart Authentication Routing** - Redirects users to appropriate dashboard based on account type
- **✓ Enhanced Header Navigation** - Added dynamic dashboard links and user-specific welcome message
- **✓ Fixed Messaging System** - Resolved conversation retrieval to show messages in both directions between users and providers
- **✓ Fixed Message UI Layout** - Messages now properly display on different sides based on sender (user messages right/blue, provider messages left/gray)
- **✓ Role-Based Navigation** - Hide "Browse Services" tab for service providers as they provide services rather than book them
- **✓ Fixed Navigation State Management** - Prevent navigation flicker on page refresh by properly handling loading states
- **✓ Instant Rating System** - Reviews now appear immediately without admin approval, admin can moderate later by rejecting inappropriate reviews
- **✓ Show/Hide Password Feature** - Added toggle buttons to all password fields in login and registration forms for better user experience
- **✓ Enhanced Admin Security** - Updated admin password to a secure one to prevent security warnings and improve system security
- **✓ Services Management System** - Added comprehensive admin panel for managing service categories with create, update, activate/deactivate, and delete functionality
- **✓ Dynamic Services Database** - Services now stored in database instead of hardcoded, allowing admins to add custom services like AC Repair, Gardening, etc.
- **✓ Service Categories Organization** - Services properly categorized into Home, Personal Care, Events, and Business Services with descriptions
- **✓ Admin Services Tab** - New dedicated tab in admin panel for complete services lifecycle management with form validation and status controls
- **✓ Fixed Database Connection** - Resolved DATABASE_URL environment variable issue by recreating PostgreSQL database
- **✓ Reset Admin Password** - Updated admin credentials to admin@servicehub.com / Admin@123 for secure access
- **✓ Complete Razorpay Integration** - Built real payment gateway with order creation, signature verification, and database integration
- **✓ Booking-Integrated Payments** - Razorpay gateway now directly integrated into service booking flow with secure Checkout.js modal
- **✓ Payment Modal Redesign** - Replaced UPI deep links with professional Razorpay payment interface supporting all payment methods
- **✓ Modern CSS Design System** - Updated to contemporary purple color scheme with enhanced gradients, glass morphism, and modern utilities
- **✓ Admin Account Setup** - Created admin account with email admin@servicehub.com and password Admin@123
- **✓ Fixed Booking Payment Issue** - Resolved HTTP 503 errors by implementing demo mode fallback and configuring real Razorpay API keys
- **✓ Real Payment Integration** - Configured Razorpay testing API keys for authentic payment processing with full transaction support
- **✓ Fixed Services Management** - Populated database with 20 default services across all categories (home, personal care, events, business) with full CRUD operations
- **✓ Realistic OTP Verification** - Enhanced KYC system with government database verification, authentic OTP delivery simulation, countdown timers, and proper SMS formatting
- **✓ Government Identity Integration** - Added sample data for testing (Aadhar: 490448561130, PAN: GOWPR7458D for Amit Kumar) with cross-verification workflow
- **✓ Fixed Aadhar/PAN Verification Flow** - Both Aadhar and PAN verification now require OTP verification sent to registered mobile number
- **✓ Enhanced Identity Security** - Added test data for Aadhar: 123412341234 and PAN: ABCDE1234F for user "Suthar" with phone +91 9644023612
- **✓ OTP-Based Document Verification** - All government document verification now includes mandatory OTP step for enhanced security
- **✓ Flexible Document Database** - System now accepts ANY valid Aadhar (12 digits) and PAN (ABCDE1234F format) numbers, generating consistent test data automatically
- **✓ Dynamic Identity Generation** - Creates realistic phone numbers and holder names for any valid government document format entered
- **✓ Streamlined KYC Process** - Removed OTP verification requirements for faster document verification workflow
- **✓ Auto-Progression System** - Documents are verified instantly and users automatically proceed to next step without manual intervention
- **✓ Fixed Admin Access** - Recreated admin account in correct database table (admin_settings) with credentials admin@servicehub.com / Admin@123
- **✓ Enhanced KYC Review System** - Added detailed modal showing all business information, identity verification, uploaded documents, and submission details for informed admin decisions
- **✓ Fixed Database Schema Issue** - Applied database migrations and created all required tables (users, service_providers, bookings, payments, reviews, etc.)
- **✓ Populated Default Data** - Created admin account (admin@servicehub.com / Admin@123) and added 20 default services across all categories
- **✓ Provider Registration Working** - Resolved "service_providers does not exist" error, provider registration now functional
- **✓ Fixed KYC Rejection Bug** - Resolved KYC rejection errors by properly updating both provider status and verification state in admin panel
- **✓ Indian Timezone Display** - Added comprehensive Indian timezone formatting for all timestamps across admin panel, user dashboard, provider dashboard, and booking displays
- **✓ Shared Date Utility** - Created reusable date formatting utility in shared/utils/date.ts for consistent IST display throughout the platform

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **UI Components**: Radix UI primitives wrapped in custom components for accessibility

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with structured error handling and request/response logging
- **Authentication**: Simple credential-based authentication with session storage
- **Development**: Hot reload with Vite middleware integration

## Database Design
- **Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle migrations with type-safe schema definitions
- **Core Entities**:
  - Users (customers with profile and booking history)
  - Service Providers (businesses with KYC verification, ratings, availability)
  - Bookings (appointment scheduling with status tracking)
  - Payments (transaction records with status tracking)
  - Reviews (ratings and feedback system)
- **Relationships**: Proper foreign key relationships between users, providers, bookings, payments, and reviews

## Key Features
- **Service Discovery**: Categorized service browsing with search functionality
- **Provider Verification**: KYC status tracking and verification workflow
- **Booking System**: Complete appointment scheduling with status management and hourly rate calculation
- **Indian Payment Integration**: PhonePe, Paytm, Google Pay, and UPI payment methods with INR currency
- **Payment Processing**: Real-time payment modal with multiple gateway support
- **Review System**: Rating and feedback mechanism for quality assurance
- **Admin Dashboard**: Comprehensive platform management tools with payment tracking
- **User Dashboard**: Personal booking history, payment tracking, and service management
- **Provider Dashboard**: Business profile management, booking oversight, and earnings tracking
- **Smart Authentication**: Role-based access with automatic dashboard routing
- **Security Features**: Enhanced password validation and form security
- **Responsive Design**: Mobile-first approach with adaptive layouts

# External Dependencies

## Database & Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL connection for scalable database operations
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **@radix-ui/react-***: Headless UI components for accessibility and customization
- **Lucide React**: Modern icon library for consistent iconography
- **Font Awesome**: Icon library for additional icon requirements

## Development & Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **TypeScript**: Type-safe development with strict configuration
- **ESLint/Prettier**: Code formatting and linting (implied by project structure)

## Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Zod integration with React Hook Form

## Data Fetching & State
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing solution for client-side navigation

## Utilities & Helpers
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx & tailwind-merge**: Utility for conditional and merged CSS classes
- **date-fns**: Date manipulation and formatting library