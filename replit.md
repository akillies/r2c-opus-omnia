# Overview

This is a procurement workflow application that helps users optimize purchasing decisions through smart product matching and swap recommendations. The system allows users to upload requirements (RFQ/PO files), automatically matches products from a catalog, suggests cost-saving alternatives, and provides a guided workflow to finalize orders with optimal pricing and availability.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Tooling**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming support (light/dark modes)
- New York style variant with neutral base color scheme

**State Management Pattern**
- Server state managed through React Query with aggressive caching (staleTime: Infinity)
- Local UI state handled with React hooks (useState)
- Form state managed through react-hook-form with Zod validation
- Toast notifications for user feedback

**Multi-Step Workflow Design**
- Four-step procurement process: Select (upload) → Check (matching) → Fit (swaps) → Lock (summary)
- Step-based navigation with progress indicators
- Drawer/modal patterns for detailed comparisons and confirmations

## Backend Architecture

**Server Framework**
- Express.js as the HTTP server
- TypeScript with ESNext module system
- Middleware pipeline for JSON parsing, request logging, and raw body access

**API Structure**
- RESTful endpoints under `/api` prefix
- Product catalog endpoints (`/api/products`)
- Order management endpoints (`/api/orders`)
- Swap recommendation system integrated into order creation

**Data Layer**
- PostgreSQL database storage (DatabaseStorage class) for persistent data
- Interface-based storage abstraction (IStorage) allows different storage backends
- Drizzle ORM for type-safe PostgreSQL queries and migrations
- Schema uses UUIDs for primary keys and JSONB for flexible data structures

**File Upload & Parsing**
- CSV file parsing with intelligent column detection
- Excel file parsing via xlsx library (base64 encoding for binary transfer)
- Product matching algorithm that maps uploaded items to catalog products
- Confidence scoring for match quality

**Database Schema Design**
- Products table: catalog items with pricing, supplier, contract, and eco-friendly flags
- Orders table: tracks upload status, total amounts, and savings with JSONB for raw items data
- Order Items table: links products to orders with quantities, prices, and swap tracking
- Swap Recommendations table: stores AI-suggested alternatives with savings calculations and swap types (pack_size, supplier, stock, sustainability)

## External Dependencies

**Database & Storage**
- PostgreSQL as the production database (via Drizzle configuration)
- Neon Database serverless driver (@neondatabase/serverless) for connection pooling
- Drizzle ORM for type-safe database queries and migrations
- connect-pg-simple for session storage (configured but not actively used in current implementation)

**Third-Party UI Libraries**
- Radix UI for accessible, unstyled component primitives (30+ components)
- Lucide React for consistent iconography
- embla-carousel-react for carousel/slider functionality
- cmdk for command palette patterns
- vaul for drawer components

**Development Tools**
- Replit-specific plugins for development experience (cartographer, dev-banner, runtime-error-modal)
- esbuild for production server bundling
- tsx for TypeScript execution in development

**Form & Validation**
- react-hook-form for performant form state management
- Zod for runtime type validation and schema definition
- @hookform/resolvers for Zod integration with react-hook-form
- drizzle-zod for automatic Zod schema generation from database schema

**Utility Libraries**
- date-fns for date manipulation and formatting
- class-variance-authority (cva) for variant-based component styling
- clsx and tailwind-merge for conditional className composition
- nanoid for unique ID generation
- xlsx for Excel file parsing
- jspdf and jspdf-autotable for PDF generation

# Recent Changes

**January 2026 - Phase 2 Enhancements**
- Migrated from in-memory storage to PostgreSQL database for persistent data
- Added CSV/Excel file upload parsing with intelligent column detection and product matching
- Implemented product filtering (search, supplier, availability) and sorting (name, price, quantity, confidence)
- Added order export functionality with PDF and CSV download options