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