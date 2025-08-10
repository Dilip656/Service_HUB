# Overview

ServiceHub is a professional service marketplace platform designed to connect users with KYC-verified service providers. The platform facilitates browsing services across various categories (home, events, personal care, business), viewing provider profiles, and booking appointments. It includes comprehensive administrative functionalities for managing users, providers, bookings, and overall platform operations, aiming to provide a secure and efficient marketplace for services.

## Recent Changes

**August 10, 2025** - Fixed database connection issue and Enhanced KYC Security:
- Resolved environment variable loading problem where DATABASE_URL was not available during app initialization
- Added dotenv configuration to server/db.ts to ensure environment variables are loaded before database connection
- Created PostgreSQL database and pushed schema using Drizzle migrations
- Application now starts successfully with all agents initialized (KYC verification, service quality, fraud detection, user support, quality assurance)
- Server running on port 5000 with both frontend and backend operational
- **ADMIN ACCOUNT SETUP**: Created admin account with credentials admin@servicehub.com / Admin@123
- Admin panel fully operational with access to user management, provider oversight, and KYC review capabilities
- **KYC VERIFICATION ENHANCEMENT**: Implemented document parsing-based verification system
- KYC agents now extract Aadhar and PAN numbers directly from uploaded documents using OCR parsing
- Auto-approval only when extracted document numbers exactly match entered registration data
- Provider 2 (Lakhan's Photography): Approved - document numbers match entered data (490448561139, GOWPR7458D)
- Provider 1 (Suthar Electricals): Rejected - document shows different numbers than entered (498765432101 vs 123412341234)
- System performs real document-to-data matching verification instead of pattern-based detection

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite for building.
- **Styling**: Tailwind CSS with shadcn/ui for UI components.
- **Routing**: Wouter for client-side navigation.
- **State Management**: TanStack Query for server state management and caching.
- **Form Handling**: React Hook Form with Zod for type-safe validation.
- **UI Components**: Radix UI primitives integrated into custom components.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM for type-safe database operations.
- **API Design**: RESTful API with structured error handling.
- **Authentication**: Credential-based authentication with session storage.

## Database Design
- **Database**: PostgreSQL with Neon serverless connection.
- **Schema Management**: Drizzle migrations for schema definition.
- **Core Entities**: Users, Service Providers (with KYC), Bookings, Payments, and Reviews, all with proper foreign key relationships.

## Key Features
- **Service Discovery**: Categorized browsing and search.
- **Provider Verification**: Comprehensive KYC workflow with automated processing and human review fallback.
- **Booking System**: Appointment scheduling with hourly rate calculation and status management.
- **Indian Payment Integration**: Support for PhonePe, Paytm, Google Pay, UPI, and Razorpay for INR transactions.
- **Review System**: User rating and feedback mechanism.
- **Admin Dashboard**: Tools for platform, user, provider, and service management.
- **User Dashboard**: Personal booking history and payment tracking.
- **Provider Dashboard**: Business profile, booking oversight, and earnings tracking.
- **Authentication**: Role-based access and dynamic dashboard routing.
- **Security**: Enhanced password validation and form security.
- **Responsiveness**: Mobile-first design with adaptive layouts.
- **Messaging System**: Two-way communication between users and providers.
- **Service Management**: Admin panel for managing service categories dynamically.

# External Dependencies

## Database & Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL.
- **connect-pg-simple**: PostgreSQL session store.

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **@radix-ui/react-***: Headless UI components.
- **Lucide React**: Icon library.
- **Font Awesome**: Icon library.

## Development & Build Tools
- **Vite**: Fast build tool and development server.
- **TypeScript**: For type-safe development.

## Form & Validation
- **React Hook Form**: Performant form library.
- **Zod**: Runtime type validation.
- **@hookform/resolvers**: Zod integration for React Hook Form.

## Data Fetching & State
- **TanStack Query**: Server state management.
- **Wouter**: Lightweight routing solution.

## Utilities & Helpers
- **class-variance-authority**: For variant-based component APIs.
- **clsx & tailwind-merge**: For conditional and merged CSS classes.
- **date-fns**: Date manipulation and formatting.