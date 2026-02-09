# Overview

R2C (Requirements 2 Cart) by OPUS/Omnia Partners — an agentic commerce system for procurement that autonomously converts RFQs into optimized purchase orders. The AI agent acts on behalf of procurement officers to parse documents, match products against 6M+ catalog items, enforce contract compliance, optimize costs through swap recommendations, manage stock risks, and advance sustainability goals.

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
- Four-step procurement process: Upload → Match → Optimize → Finalize
- Step-based navigation with progress indicators
- Drawer/modal patterns for detailed comparisons and confirmations
- Intelligence storytelling at each step showing what the AI agent did and why

**Layout Architecture**
- Desktop: OPUS Storefront (left) + R2C Agent panel (right, 420px fixed width)
- Mobile: Full-screen assistant panel with FAB trigger button, responsive product grids
- Panel open/close with storefront margin adjustment (mr-[420px])

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

**Swap Recommendation Engine**
- Priority-based scoring: stock risks (100), bulk savings (80), supplier alternatives (70), eco options (60)
- Contextual reason generation with specific metrics (e.g., "23% cheaper per unit")
- Deduplication via usedAlternatives set to avoid recommending same product twice
- Types: pack_size, supplier, stock, sustainability

**Database Schema Design**
- Products table: catalog items with pricing, supplier, contract, and eco-friendly flags
- Orders table: tracks upload status, total amounts, and savings with JSONB for raw items data
- Order Items table: links products to orders with quantities, prices, and swap tracking
- Swap Recommendations table: stores AI-suggested alternatives with savings calculations and swap types

## Deployment

**Self-Hostable**
- Dockerfile with multi-stage build (node:20-alpine)
- docker-compose.yml with app + PostgreSQL services
- .env.example for configuration
- Demo mode possible with in-memory storage

## Key Files

- `client/src/pages/opus-integrated.tsx` — Main integrated page (storefront + assistant)
- `client/src/components/opus-storefront.tsx` — Product catalog storefront
- `client/src/components/chat-assistant-panel.tsx` — R2C Agent panel wrapper
- `client/src/components/file-upload.tsx` — File upload with progress intelligence
- `client/src/components/product-matching.tsx` — Match review with agent actions
- `client/src/components/smart-swaps.tsx` — Swap recommendations with agent intelligence
- `client/src/components/cart-summary.tsx` — Final summary with agent impact dashboard
- `server/routes.ts` — API routes and swap recommendation generation
- `server/file-parser.ts` — CSV/Excel parsing and product matching
- `server/storage.ts` — Database storage abstraction
- `shared/schema.ts` — Drizzle schema and Zod types
- `docs/PRD.md` — Product Requirements Document

## External Dependencies

**Database & Storage**
- PostgreSQL as the production database (via Drizzle configuration)
- Neon Database serverless driver (@neondatabase/serverless) for connection pooling
- Drizzle ORM for type-safe database queries and migrations

**Third-Party UI Libraries**
- Radix UI for accessible, unstyled component primitives (30+ components)
- Lucide React for consistent iconography
- embla-carousel-react for carousel/slider functionality
- cmdk for command palette patterns
- vaul for drawer components

**Utility Libraries**
- date-fns for date manipulation and formatting
- class-variance-authority (cva) for variant-based component styling
- clsx and tailwind-merge for conditional className composition
- nanoid for unique ID generation
- xlsx for Excel file parsing
- jspdf and jspdf-autotable for PDF generation

# Recent Changes

**February 2026 - Agentic Commerce Intelligence**
- Upgraded swap recommendation engine with priority-based reasoning and contextual explanations
- Enhanced workflow with intelligence storytelling: "Agent Actions", "Agent Intelligence", "Agent Impact Summary"
- File upload shows contextual progress messages (Reading document → Detecting columns → Matching to catalog)
- Added elapsed time tracking from upload through submission
- Success dialog shows 3-metric summary with manual processing comparison

**January 2026 - Mobile Responsiveness & Self-Hosting**
- Full mobile responsiveness: full-screen assistant on mobile, FAB trigger, touch-optimized interactions
- Self-hostable deployment: Dockerfile, docker-compose.yml, .env.example
- Comprehensive PRD documenting agentic commerce positioning

**January 2026 - OPUS Storefront Integration**
- Integrated OPUS storefront with R2C Agent panel layout
- OPUS visual identity: navy blue colors (#1e3a5f, #2d5a87)
- Interactive product highlighting when matched in assistant panel
- Routing: "/" serves integrated view, "/standalone" maintains original workflow

**January 2026 - Phase 2 Enhancements**
- PostgreSQL database migration for persistent data
- CSV/Excel file upload parsing with intelligent column detection
- Product filtering, sorting, and order export (PDF/CSV)
