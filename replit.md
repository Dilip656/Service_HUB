# Overview

ServiceHub is a professional service marketplace platform that connects users with KYC-verified service providers. The application enables customers to browse services across multiple categories (home, events, personal care, business), view provider profiles, and book appointments. It includes comprehensive admin functionality for managing users, providers, bookings, and platform operations.

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
- **Booking System**: Complete appointment scheduling with status management
- **Review System**: Rating and feedback mechanism for quality assurance
- **Admin Dashboard**: Comprehensive platform management tools
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