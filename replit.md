# Overview

R2C (Requirements 2 Cart) by EIS × OPUS/OMNIA Partners — an agentic commerce system for procurement that autonomously converts RFQs into optimized purchase orders. Built on EIS's VIA platform (data ingestion, schema governance, taxonomy optimization, content enrichment, compliance checks, search tuning), R2C acts on behalf of procurement officers to parse documents, match products against 7.5M+ enriched catalog items across 630+ cooperative suppliers, enforce cooperative contract compliance, optimize costs through intelligent swap recommendations, manage stock risks, and advance sustainability goals. VIA is the enrichment layer that prepares the data — R2C works without it, but performs dramatically better with VIA-enriched data.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## EIS VIA Platform (Data Foundation Layer)

R2C is powered by EIS's VIA platform — the data processing and enrichment technology for OMNIA's OPUS platform. VIA ingests all types of documents and data feeds, enriches them, and prepares the data that makes R2C's intelligent matching possible:
- **Document Ingestion Pipeline**: Ingests any format (JSON, XML, flat files, PDFs, spreadsheets, spec sheets, compliance certificates) from 630+ supplier feeds; multi-source reconciliation; continuous pipeline for feed updates and new supplier onboarding
- **Schema Detection & Attribute Mapping**: Unified product model using industry standards (Schema.org, GS1, eCl@ss)
- **Taxonomy Optimization**: UNSPSC classification, category path hierarchy, variant product modeling
- **Content Enrichment**: Title/description normalization, missing attribute fill, keyword/synonym generation
- **Search Enhancement**: Elastic config tuning, field weighting, synonym enrichment, faceting optimization
- **Compliance Checks**: Automated contract verification, policy rule enforcement (budget limits, sustainability mandates, approved vendor lists), regulatory compliance flagging, audit trail generation
- **Sustainability Data**: CO₂ per unit, recycled content, certification capture (Green Seal, EPA Safer Choice, etc.)

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
- Value metrics endpoint (`/api/orders/:id/value-metrics`) — multi-dimensional value computation
- Swap recommendation system integrated into order creation

**Data Layer**
- PostgreSQL database storage (DatabaseStorage class) for persistent data
- Interface-based storage abstraction (IStorage) allows different storage backends
- Drizzle ORM for type-safe PostgreSQL queries and migrations
- Schema uses UUIDs for primary keys and JSONB for flexible data structures

**Product Matching Engine (server/matching.ts)**
- BM25-style scoring with TF-IDF term frequency/inverse document frequency weighting
- Trigram fuzzy matching for typo tolerance
- Synonym expansion for common procurement terms
- UNSPSC-aware category matching using enriched taxonomy hierarchy
- Name field boost (2x weight) for precision
- Configurable confidence thresholds

**File Upload & Parsing**
- CSV file parsing with intelligent column detection
- Excel file parsing via xlsx library (base64 encoding for binary transfer)
- Product matching maps uploaded items to enriched catalog products
- Confidence scoring for match quality

**Swap Recommendation Engine**
- Priority-based scoring: stock risks (100), bulk savings (80), supplier alternatives (70), eco options (60)
- Enriched attribute-aware: uses packSize, certifications, co2PerUnit, contractTier, UNSPSC for matching
- Contextual reason generation with specific metrics and certification details
- Deduplication via usedAlternatives set to avoid recommending same product twice
- Types: pack_size, supplier, stock, sustainability

**Value Metrics Engine**
- Direct cost savings from swap recommendations
- Maverick spend prevention (estimated 15% off-contract premium avoided)
- Stockout cost avoidance (rush shipping + downtime estimates)
- Sustainability metrics: CO₂ reduction, eco items, recycled content, certified products
- Spend consolidation: supplier count, category count, preferred supplier utilization
- Total value created aggregation

**Database Schema Design**
- Products table: enriched catalog items with UNSPSC, categoryPath, brand, MPN, packSize, certifications, contractTier, preferredSupplier, co2PerUnit, recycledContent
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
- `client/src/components/opus-storefront.tsx` — Product catalog storefront with real OPUS suppliers
- `client/src/components/chat-assistant-panel.tsx` — R2C Agent panel wrapper
- `client/src/components/file-upload.tsx` — File upload with progress intelligence
- `client/src/components/product-matching.tsx` — Match review with agent actions and enriched data display
- `client/src/components/smart-swaps.tsx` — Swap recommendations with agent intelligence
- `client/src/components/cart-summary.tsx` — Final summary with multi-dimensional value dashboard
- `server/routes.ts` — API routes, swap recommendation generation, value metrics endpoint
- `server/matching.ts` — BM25-style product matching engine with TF-IDF and synonym expansion
- `server/seed.ts` — 50-product enriched seed catalog across 6 categories with real OPUS suppliers
- `server/file-parser.ts` — CSV/Excel parsing and product matching
- `server/storage.ts` — Database storage abstraction
- `shared/schema.ts` — Drizzle schema with enriched taxonomy fields and Zod types
- `docs/PRD.md` — Product Requirements Document with EIS VIA platform narrative

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

**February 2026 - EIS VIA Platform & Multi-Dimensional Value**
- Added EIS VIA platform narrative to PRD documenting document ingestion pipeline, schema governance, taxonomy optimization, content enrichment, compliance checks, and search tuning as the foundation enabling R2C
- VIA branded as EIS's proprietary data processing and enrichment technology; R2C works without it but performs dramatically better with VIA-enriched data
- Enhanced product schema with enriched taxonomy fields: UNSPSC codes, categoryPath hierarchy, brand, MPN, packSize, certifications, contractTier, preferredSupplier, co2PerUnit, recycledContent
- Expanded seed catalog to 50 products across 6 categories using real OPUS cooperative suppliers (Grainger, ODP Business Solutions, Quill, Global Industrial, MSC Industrial, Medline, Lawson Products, Network Distribution, Safeware)
- Built BM25-style matching engine (server/matching.ts) with TF-IDF scoring, trigram fuzzy matching, and synonym expansion for procurement terms
- Upgraded swap engine to use enriched product attributes: UNSPSC matching, packSize-aware bulk comparisons, certification-rich sustainability reasons, contract tier notes
- Added value metrics API endpoint computing direct savings, maverick spend prevention, stockout cost avoidance, sustainability impact (CO₂ reduction), and spend consolidation
- Enhanced cart summary with multi-dimensional value dashboard showing all value dimensions
- Updated all messaging to reference "cooperative master agreements", "630+ cooperative suppliers", "7.5M+ enriched catalog items"
- Updated stats, suppliers, contract formats (OMNIA R-XXXXX), and target user messaging to align with real OPUS platform

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
