# OPUS R2C — Requirements 2 Cart
## Product Requirements Document
### Agentic Commerce for Procurement

---

## The Problem

Procurement is one of the last enterprise functions still run on spreadsheets and phone calls.

Every day, procurement teams at schools, hospitals, municipalities, and corporations receive **Requests for Quotation (RFQs)** — spreadsheets listing dozens or hundreds of items they need to purchase. Converting these into optimized **Purchase Orders (POs)** is a manual, error-prone process that looks like this:

1. **Receive RFQ** — Usually a CSV or Excel file from a department head
2. **Cross-reference catalog** — Manually search supplier portals to find matching products
3. **Check contracts** — Verify which products are on approved cooperative purchasing contracts (GPOs)
4. **Compare prices** — Look for better deals across suppliers, pack sizes, and bulk options
5. **Check availability** — Call or email suppliers to confirm stock levels
6. **Verify compliance** — Ensure purchases meet organizational policies (sustainability mandates, minority supplier requirements, budget limits)
7. **Build the PO** — Re-enter everything into a purchasing system
8. **Get approval** — Route for sign-off

**This process takes 2-5 days per RFQ.** For organizations processing hundreds of RFQs per month, that's thousands of hours spent on repetitive manual work — with no guarantee of optimal pricing, compliance, or availability.

---

## The Vision

**R2C (Requirements 2 Cart)** is an agentic commerce system that autonomously converts RFQs into optimized purchase orders in minutes, not days.

Unlike traditional e-procurement tools that are essentially search engines with shopping carts, R2C deploys an **AI agent** that acts on behalf of the procurement officer. The agent doesn't just suggest — it **executes**:

- **Reads and interprets** any RFQ format (CSV, Excel, PDF) with intelligent column detection
- **Matches products** against a catalog of 6M+ items across 300+ suppliers with confidence scoring
- **Enforces compliance** by only matching to contract-approved products
- **Optimizes cost** by analyzing pack sizes, bulk pricing, supplier alternatives, and seasonal pricing
- **Manages risk** by flagging low-stock items and suggesting available alternatives before backorders occur
- **Advances sustainability** by identifying eco-certified alternatives when available
- **Consolidates suppliers** to reduce shipping costs and simplify receiving
- **Learns from patterns** across every transaction to improve future recommendations

The result: procurement teams process RFQs **10x faster**, save **15-25% on average order value**, and maintain **100% contract compliance** — all with an audit trail.

---

## Why Now: The Agentic Commerce Shift

The procurement industry is undergoing a fundamental transformation. Three forces are converging:

### 1. AI Agents Are Ready
Large language models and intelligent automation have reached the point where they can reliably parse unstructured documents, match entities across databases, and make optimization decisions. The technology is no longer experimental — it's production-ready.

### 2. Procurement Complexity Is Exploding
Supply chain disruptions, sustainability mandates, DEI supplier requirements, and volatile pricing mean procurement teams are drowning in decisions. The old approach of "search and click" doesn't scale when every purchase requires checking 5 different compliance criteria.

### 3. Cooperative Purchasing Is Growing
Organizations like OMNIA Partners aggregate buying power across thousands of members. But members can only capture value if they can quickly find and purchase the right products on the right contracts. R2C makes that effortless.

**The competitive advantage is clear:** organizations using agentic procurement will outperform those stuck in manual processes — not by small margins, but by orders of magnitude in speed, savings, and compliance.

---

## User Personas

### Primary: Procurement Officer (Pat)
- **Role:** Processes 20-50 RFQs per month for a school district
- **Pain:** Spends 60% of time on repetitive product matching and price comparison
- **Goal:** Process RFQs faster without sacrificing compliance or missing savings
- **Behavior:** Uploads RFQ spreadsheets, reviews agent recommendations, approves orders
- **Value from R2C:** Recovers 20+ hours/month, consistently finds 15-25% savings

### Secondary: Procurement Director (Dana)
- **Role:** Oversees purchasing for a multi-site healthcare system
- **Pain:** Can't enforce compliance across decentralized purchasing; no visibility into savings opportunities
- **Goal:** Standardize purchasing, maximize contract utilization, meet sustainability targets
- **Behavior:** Reviews dashboards, sets procurement policies, audits orders
- **Value from R2C:** Organization-wide compliance enforcement, savings tracking, sustainability reporting

### Tertiary: Supplier Account Manager (Sam)
- **Role:** Manages a portfolio of GPO contracts
- **Pain:** Low contract utilization; buyers don't know their products exist
- **Goal:** Increase product visibility and order volume through cooperative contracts
- **Behavior:** Reviews how their products are being recommended and selected
- **Value from R2C:** Higher contract utilization, data on competitive positioning

---

## Core Workflow: The Four-Step Agent Loop

### Step 1: UPLOAD — "The Agent Reads Your Requirements"

**What happens:** User uploads an RFQ file (CSV, Excel, or drags-and-drops). The agent parses the document, detecting columns intelligently regardless of format variations.

**Intelligence applied:**
- Handles messy real-world spreadsheets (merged cells, inconsistent headers, multiple sheets)
- Extracts product descriptions, quantities, units of measure, and any specified constraints
- Detects anomalies: duplicate line items, unusual quantities, missing specifications

**Value displayed:**
- "Parsed 47 line items in 2.3 seconds"
- "Detected 2 duplicate entries — consolidated automatically"
- "Flagged 1 item with missing quantity — defaulted to minimum order"

**Why this matters:** Manual parsing of a 50-line RFQ takes 30-45 minutes. The agent does it in seconds, catching errors humans miss.

---

### Step 2: MATCH — "The Agent Finds Your Products"

**What happens:** Each line item is matched against the product catalog using fuzzy matching, synonym detection, and contract-awareness.

**Intelligence applied:**
- Fuzzy name matching with confidence scoring (exact match, partial match, category match)
- Contract-first matching: prioritizes products on the buyer's approved contracts
- Multi-signal ranking: price, availability, supplier reliability, past purchase history
- Flags items that can't be matched above a confidence threshold for human review

**Value displayed:**
- "42/47 items matched with 95%+ confidence"
- "All matches are on your STATE-EDU-ABC contract"
- "3 items need your review — similar products found but names differ"
- "Estimated order value: $12,450 based on current catalog pricing"

**Why this matters:** Manual catalog searching averages 3-5 minutes per item. For a 50-item RFQ, that's 2.5-4 hours. The agent matches everything in under 10 seconds and catches contract compliance issues immediately.

---

### Step 3: OPTIMIZE — "The Agent Finds You Better Deals"

**What happens:** The agent analyzes every matched item and identifies optimization opportunities across five dimensions.

**Intelligence applied:**

| Optimization Type | What the Agent Does | Example |
|---|---|---|
| **Pack Size** | Finds bulk packaging that reduces per-unit cost | "Switch from 12-pack to 48-pack, save $0.23/unit (23% savings)" |
| **Supplier Switch** | Identifies cheaper or better-rated suppliers on contract | "Alternative supplier offers same product at $2.10 vs $2.75" |
| **Stock Risk** | Flags low-stock items and suggests available alternatives | "Current selection is low stock — equivalent product from Hygiene Plus ships immediately" |
| **Sustainability** | Recommends eco-certified alternatives when price-competitive | "Eco-friendly option available at only $0.05/unit more — meets your Green Purchasing Policy" |
| **Consolidation** | Groups items to fewer suppliers for shipping efficiency | "Moving 3 items to CleanPro Supply saves $45 in shipping" |

**Value displayed:**
- "Found $847 in potential savings across 8 swap opportunities"
- "1 stock risk avoided — backorder would have delayed delivery 3 weeks"
- "2 eco-friendly alternatives found — aligns with your sustainability mandate"
- Each swap card shows: original → recommended, price change, reason, and risk level

**Why this matters:** This is where human procurement officers either miss savings (because they don't have time to compare) or make suboptimal choices (because they can't see the full picture). The agent evaluates every option simultaneously and presents only the best opportunities.

---

### Step 4: FINALIZE — "The Agent Prepares Your Order"

**What happens:** The final optimized order is assembled with full transparency into what changed and why.

**Intelligence applied:**
- Calculates total savings vs. original unoptimized order
- Generates compliance report (all items on contract, no policy violations)
- Creates audit trail (every agent decision documented with rationale)
- Produces exportable PO in PDF and CSV formats

**Value displayed:**
- "Total savings: $847 (18% vs. unoptimized order)"
- "Time saved: ~3.5 hours vs. manual processing"
- "Compliance: 100% — all items on approved contracts"
- "Sustainability: 2 eco-friendly swaps accepted"
- "0 stock risks — all items confirmed available"

**Why this matters:** The procurement officer gets a complete, optimized, compliant purchase order with a full audit trail — ready for approval in minutes instead of days.

---

## Unique Intelligence Cases

These are the moments where R2C demonstrates its competitive advantage — situations that would be impossible or impractical for a human to catch manually:

### Case 1: "The Hidden Bulk Savings"
> A school district orders 200 boxes of microfiber cloths at $2.75/box (12-pack). R2C detects that the same product is available in a 48-pack at $8.50/box — $0.177/cloth vs $0.229/cloth. **Savings: $104 on this single line item.** Across a year of similar orders, this pattern saves $2,400+.

### Case 2: "The Compliance Catch"
> A hospital procurement team uploads an RFQ with a cleaning product from a non-approved supplier. R2C flags it immediately: "This product is not on your GPO contract. An equivalent product from an approved supplier is available at a lower price." **Risk avoided: potential audit finding and contract violation.**

### Case 3: "The Stock Risk Prevention"
> R2C matches an order for industrial mop heads, but detects the selected product is flagged "Low Stock." Instead of letting the order proceed (and risk a 3-week backorder), the agent proactively suggests an equivalent in-stock alternative. **Impact: delivery on time instead of 3 weeks late.**

### Case 4: "The Sustainability Win"
> A municipality has a Green Purchasing Policy requiring 30% eco-certified products. R2C analyzes the order and identifies 2 items where eco-friendly alternatives are available at comparable prices. The agent automatically flags these. **Impact: helps meet sustainability targets without manual policy checking.**

### Case 5: "The Supplier Consolidation"
> An RFQ has items from 4 different suppliers, meaning 4 separate shipments. R2C identifies that 3 of the items are available from a single supplier at competitive prices. Consolidating reduces shipping costs by $45 and simplifies receiving. **Impact: fewer deliveries, lower logistics cost, simpler reconciliation.**

---

## Architecture & Deployment

### Self-Hosted Deployment
R2C is designed to run anywhere:

```
┌─────────────────────────────────────────┐
│           Docker Compose Stack           │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │   R2C App   │   │   PostgreSQL    │  │
│  │  (Node.js)  │──▶│   Database     │  │
│  │  Port 5000  │   │   Port 5432    │  │
│  └─────────────┘   └─────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

- **Single command deployment:** `docker compose up`
- **Environment configuration:** `.env` file for database URL, port, and feature flags
- **No vendor lock-in:** Standard Node.js + PostgreSQL stack
- **Demo mode:** Can run without a database using in-memory storage for quick demos

### Technology Stack
| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + TypeScript | Type-safe, component-driven UI |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system, rapid iteration |
| State | TanStack Query | Server state sync, caching, optimistic updates |
| Routing | Wouter | Lightweight client-side routing |
| Backend | Express.js | Battle-tested HTTP server |
| Database | PostgreSQL + Drizzle ORM | Type-safe queries, schema migrations |
| Build | Vite | Fast builds, HMR in development |
| Export | jsPDF + xlsx | PDF and CSV order export |

### Key Non-Functional Requirements
- **Portable:** Runs on any system with Docker, or directly with Node.js 20+ and PostgreSQL
- **Responsive:** Works on desktop (1200px+), tablet (768px-1199px), and mobile (320px-767px)
- **Accessible:** WCAG 2.1 AA compliant interactive elements
- **Auditable:** Every agent decision logged with reasoning
- **Performant:** Sub-second file parsing, instant product matching for catalogs up to 100K products

---

## Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| RFQ Processing Time | < 5 minutes (vs. 2-5 days manual) | Time from upload to PO submission |
| Average Savings | 15-25% per order | Compare optimized vs. unoptimized totals |
| Match Accuracy | > 95% confidence on matched items | Confidence scoring algorithm |
| Contract Compliance | 100% | All matched products on approved contracts |
| User Adoption | > 80% of RFQs processed through R2C | Usage tracking |
| Sustainability Impact | Eco-swaps accepted on > 50% of eligible items | Swap acceptance rate |

---

## Competitive Landscape

| Feature | Traditional eProcurement | R2C (Agentic) |
|---|---|---|
| RFQ Processing | Manual search & match | Autonomous AI matching |
| Optimization | User compares prices manually | Agent analyzes all dimensions simultaneously |
| Compliance | Checked after the fact | Enforced at match time |
| Time to PO | 2-5 days | 5 minutes |
| Savings Discovery | Ad hoc, inconsistent | Systematic, every order |
| Sustainability | Manual policy checking | Automatic eco-alternative flagging |
| Scalability | Linear with headcount | Handles unlimited volume |

---

## Roadmap

### Phase 1: Intelligent Matching (Current)
- RFQ upload and parsing (CSV, Excel)
- Product catalog matching with confidence scoring
- Swap recommendations (price, pack size, stock, sustainability)
- Order export (PDF, CSV)
- Self-hosted deployment

### Phase 2: Deep Intelligence
- Natural language RFQ processing ("I need 200 boxes of cleaning supplies for 3 buildings")
- Historical purchase pattern analysis
- Predictive reorder recommendations
- Multi-contract optimization
- Supplier performance scoring

### Phase 3: Full Autonomy
- Automated PO submission to supplier portals
- Real-time price monitoring and re-optimization
- Budget tracking and spend analytics
- Multi-stakeholder approval workflows
- Integration with ERP systems (SAP, Oracle, Coupa)

### Phase 4: Network Intelligence
- Cross-organization benchmarking ("You're paying 20% more than similar districts")
- Demand aggregation across cooperative members
- Supplier negotiation insights
- Market trend analysis and forward buying recommendations

---

*R2C by OPUS (Omnia Partners) — The future of procurement is autonomous.*
