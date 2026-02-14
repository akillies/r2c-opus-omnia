# Overview

R2C (Requirements 2 Cart) by EIS × OPUS/OMNIA Partners is an agentic commerce system designed for procurement. Its primary purpose is to autonomously convert Requests for Quotation (RFQs) into optimized purchase orders. R2C acts on behalf of procurement officers to parse various documents, match products against a vast catalog of over 7.5 million enriched items from 630+ cooperative suppliers, and ensure compliance with cooperative contracts. The system also optimizes costs through intelligent swap recommendations, manages stock risks, and supports sustainability goals. Leveraging the EIS VIA platform for data enrichment, R2C significantly enhances data quality and matching accuracy, though it can function independently.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## EIS VIA Platform (Data Foundation Layer)

The EIS VIA platform serves as the data processing and enrichment layer, preparing data for R2C's intelligent matching capabilities. It includes:
-   **Document Ingestion Pipeline**: Handles diverse document formats from numerous supplier feeds, performing multi-source reconciliation and continuous updates.
-   **Schema Detection & Attribute Mapping**: Unifies product data using industry standards like Schema.org and GS1.
-   **Taxonomy Optimization**: Classifies products using UNSPSC and optimizes category hierarchies.
-   **Content Enrichment**: Normalizes titles and descriptions, fills missing attributes, and generates keywords.
-   **Compliance Checks**: Automates contract verification, enforces policy rules, and generates audit trails.
-   **Sustainability Data**: Captures CO₂ per unit, recycled content, and certifications.

## Frontend Architecture

**Framework & Tooling**: Utilizes React 18 with TypeScript, Vite for fast development, Wouter for routing, and TanStack Query for server state management.

**UI Component System**: Built with shadcn/ui on Radix UI primitives, styled using Tailwind CSS with custom design tokens and CSS variables for theming (light/dark modes). Features a New York style variant with a neutral base color scheme.

**State Management**: Server state is managed by React Query with aggressive caching. Local UI state uses React hooks, and form state is handled by react-hook-form with Zod validation.

**Multi-Step Workflow**: Implements a four-step procurement process (Upload → Match → Optimize → Finalize) with step-based navigation and progress indicators. Uses drawer/modal patterns for detailed interactions and provides "intelligence storytelling" at each stage.

**Layout Architecture**: For desktop, it features an OPUS Storefront (left) alongside a fixed-width R2C Agent panel (right). Mobile displays a full-screen assistant panel triggered by a Floating Action Button (FAB).

## Backend Architecture

**Server Framework**: Uses Express.js with TypeScript and ESNext modules, featuring a middleware pipeline for request processing.

**API Structure**: Provides RESTful endpoints for product catalog, order management, and multi-dimensional value metrics, including integrated swap recommendations.

**Data Layer**: Employs PostgreSQL for persistent storage, abstracted via an `IStorage` interface, and utilizes Drizzle ORM for type-safe queries and migrations. Primary keys use UUIDs, and JSONB is used for flexible data structures.

**Product Matching Engine**: Implements BM25-style scoring with TF-IDF weighting, trigram fuzzy matching, synonym expansion, and UNSPSC-aware category matching. It prioritizes name field matches and uses configurable confidence thresholds.

**File Upload & Parsing**: Supports CSV and Excel file parsing with intelligent column detection, mapping uploaded items to enriched catalog products with confidence scoring.

**Swap Recommendation Engine**: Offers priority-based scoring for stock risks, bulk savings, supplier alternatives, and eco-options. It uses enriched attributes like `packSize`, certifications, and `co2PerUnit` to generate contextual reasons for recommendations.

**Value Metrics Engine**: Computes direct cost savings, maverick spend prevention, stockout cost avoidance, sustainability impact (CO₂ reduction), and spend consolidation metrics.

**Database Schema Design**: Includes tables for `Products` (enriched catalog items), `Orders` (tracking status and savings), `Order Items` (linking products to orders), and `Swap Recommendations` (storing AI-suggested alternatives).

## Deployment

The system is designed to be self-hostable with a Dockerfile and `docker-compose.yml` setup, supporting a demo mode with in-memory storage.

# External Dependencies

**Database & Storage**
-   PostgreSQL (production database)
-   Neon Database serverless driver
-   Drizzle ORM

**Third-Party UI Libraries**
-   Radix UI
-   Lucide React
-   embla-carousel-react
-   cmdk
-   vaul

**Utility Libraries**
-   date-fns
-   class-variance-authority (cva)
-   clsx and tailwind-merge
-   nanoid
-   xlsx
-   jspdf and jspdf-autotable