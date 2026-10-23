# 📦 InventoryX — Full-Stack HBase Inventory Management System
### Complete Codebase Analysis · Backend + Frontend · BDA Project

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Infrastructure & Docker](#3-infrastructure--docker)
4. [Backend Analysis](#4-backend-analysis)
   - [Technology Stack](#41-technology-stack)
   - [Dependency Map](#42-backend-dependency-map)
   - [Directory Structure](#43-backend-directory-structure)
   - [Entry Point — index.js](#44-entry-point--indexjs)
   - [HBase Client](#45-hbase-client--hbaseclientjs)
   - [HBase Initializer & Seeder](#46-hbase-initializer--seeder--initializehbasejs)
   - [HBase Schema & Table Design](#47-hbase-schema--table-design)
   - [API Routes — Deep Dive](#48-api-routes--deep-dive)
   - [Backend Data Flow Diagram](#49-backend-data-flow-diagram)
5. [Frontend Analysis](#5-frontend-analysis)
   - [Technology Stack](#51-technology-stack)
   - [Dependency Map](#52-frontend-dependency-map)
   - [Directory Structure](#53-frontend-directory-structure)
   - [Entry Point — main.jsx](#54-entry-point--mainjsx)
   - [Routing — App.jsx](#55-routing--appjsx)
   - [API Layer](#56-api-layer--srcapiindexjs)
   - [Pages Analysis](#57-pages-analysis)
   - [Reusable Components Analysis](#58-reusable-components-analysis)
   - [Frontend Data Flow Diagram](#59-frontend-data-flow-diagram)
6. [Full-Stack Integration Flow](#6-full-stack-integration-flow)
7. [Key BDA Concepts Demonstrated](#7-key-bda-concepts-demonstrated)
8. [Environment Configuration](#8-environment-configuration)
9. [Setup & Running Guide](#9-setup--running-guide)

---

## 1. Project Overview

**InventoryX** is a full-stack real-time inventory management system built to demonstrate **Big Data Architecture (BDA)** concepts using **Apache HBase** as the storage engine.

| Layer    | Technology        | Purpose                                     |
|----------|-------------------|---------------------------------------------|
| Database | Apache HBase      | NoSQL wide-column store (via Docker)        |
| Backend  | Node.js + Express | REST API bridging HBase and the frontend    |
| Frontend | React + Vite      | Real-time SPA dashboard with 7 modules      |
| Styling  | Tailwind CSS      | Utility-first responsive UI                 |
| DevOps   | Docker Compose    | One-command HBase environment spin-up       |

### Core BDA Concepts Illustrated

- **HBase Time-Travel** — multi-version cell storage (VERSIONS=10) for historical state restoration
- **Sparse Column Model** — dynamic per-product attributes stored without schema migration
- **Wide-Column NoSQL** — raw cell-level data visualization via the Raw Explorer page
- **Real-time Polling** — TanStack Query auto-refetching every 5 seconds for live dashboard feel
- **CQRS-style Routing** — separate routes for reading vs. writing operations

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite · Port 3000)                   │   │
│  │  Dashboard │ Products │ Stock Mgr │ Time Travel │ ...       │   │
│  │  TanStack Query (cache + 5s polling)                        │   │
│  │  axios → /api/* (proxied by Vite dev server)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │  HTTP /api/*
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Express.js REST API (Node.js · Port 5000)             │
│  /api/products   /api/stock   /api/transactions                     │
│  /api/alerts     /api/history  /api/raw                             │
│  hbase npm client ───────────────────────────────────────────────┐  │
└──────────────────────────────────────────────────────────────────│──┘
                                                                   │  HBase REST (Stargate) :8080
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│           Apache HBase (Docker · harisekhon/hbase image)            │
│  Table: inventory_products      (column families: info, stock)      │
│  Table: inventory_transactions  (column families: meta, qty)        │
│  Table: inventory_alerts        (column family:  data)              │
│  Ports: 8080 (REST), 16010 (UI), 2181 (ZooKeeper), 9090 (Thrift)  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Infrastructure & Docker

**File:** `docker-compose.yml`

```yaml
version: '3.8'
services:
  hbase:
    image: harisekhon/hbase
    container_name: hbase_inventory
    ports:
      - "8080:8080"   # HBase REST API (Stargate) — backend connects here
      - "16010:16010" # HBase Master Web UI
      - "2181:2181"   # ZooKeeper internal coordination
      - "9090:9090"   # Thrift API (unused in this project)
    volumes:
      - hbase_data:/hbase   # persistent named volume
    restart: always
```

| Port  | Service             | Consumer          |
|-------|---------------------|-------------------|
| 8080  | HBase Stargate REST | Express backend   |
| 16010 | HBase Master UI     | Manual inspection |
| 2181  | ZooKeeper           | HBase internals   |
| 9090  | Thrift Server       | Not used          |

**Why `harisekhon/hbase`?** It is a widely-used all-in-one HBase Docker image that bundles ZooKeeper, HMaster, RegionServer, and the Stargate REST interface in a single container — ideal for development and demos.

---

## 4. Backend Analysis

### 4.1 Technology Stack

| Package    | Version  | Role                                               |
|------------|----------|----------------------------------------------------|
| `express`  | ^4.19.2  | HTTP framework — routes, middleware, JSON parsing  |
| `cors`     | ^2.8.5   | Cross-Origin Resource Sharing headers              |
| `dotenv`   | ^16.4.5  | Loads `.env` variables into `process.env`          |
| `hbase`    | ^0.6.1   | HBase Stargate REST client (callback-based)        |
| `nodemon`  | ^3.1.0   | Dev: auto-restarts server on file changes          |

### 4.2 Backend Dependency Map

```
src/index.js  (entry point)
    │
    ├── express          — HTTP server & middleware stack
    ├── cors             — Cross-origin preflight handling
    ├── dotenv           — Environment variable loading
    │
    ├── ./routes/products.js
    │       └── ../hbaseClient.js  → hbase npm → HBase REST :8080
    │
    ├── ./routes/stock.js
    │       └── ../hbaseClient.js
    │
    ├── ./routes/transactions.js
    │       └── ../hbaseClient.js
    │
    ├── ./routes/alerts.js
    │       └── ../hbaseClient.js
    │
    ├── ./routes/history.js
    │       └── ../hbaseClient.js
    │
    └── ./routes/raw.js
            └── ../hbaseClient.js

src/initializeHBase.js  (standalone seed script)
    └── ./hbaseClient.js  → creates tables + seeds 5 products
```

### 4.3 Backend Directory Structure

```
backend/
├── .env                    ← Environment config (PORT, HBASE_HOST, HBASE_PORT)
├── .gitignore
├── package.json            ← Dependencies + scripts
├── bun.lock
└── src/
    ├── index.js            ← Express app bootstrap + route mounting
    ├── hbaseClient.js      ← Singleton HBase client instance
    ├── initializeHBase.js  ← One-time DB setup + seed script
    └── routes/
        ├── products.js     ← CRUD for inventory_products table
        ├── stock.js        ← Stock IN/OUT + auto transaction logging
        ├── transactions.js ← Read-only transaction history
        ├── alerts.js       ← Low-stock detection (in-memory scan filter)
        ├── history.js      ← Multi-version cell history + restore (Time Travel)
        └── raw.js          ← Raw HBase cell dump for any table
```

### 4.4 Entry Point — `index.js`

```js
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products',     productRoutes);
app.use('/api/stock',        stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/alerts',       alertRoutes);
app.use('/api/history',      historyRoutes);
app.use('/api/raw',          rawRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.listen(PORT);   // Default: 5000
```

**Middleware chain per request:**
```
Request → cors() → express.json() → route handler → HBase client → Response
```

### 4.5 HBase Client — `hbaseClient.js`

```js
const hbase = require('hbase');
const client = hbase({
  host: process.env.HBASE_HOST || 'localhost',
  port: process.env.HBASE_PORT || 8080
});
module.exports = client;  // Singleton shared across all routes
```

- Uses the `hbase` npm package which communicates via the **HBase Stargate REST API**.
- Exported as a **module-level singleton** — all routes import the same instance.
- All operations are **callback-based** (not Promise-native), so routes wrap them in `new Promise()` where needed.

### 4.6 HBase Initializer & Seeder — `initializeHBase.js`

Run via: `npm run seed`

**Execution flow:**

```
1. Verify HBase REST reachability (retries every 5s on failure)
2. DROP all 3 tables (to reset VERSIONS schema)
3. CREATE tables with VERSIONS=10 (enables 10-version time-travel)
4. SEED 5 initial products into inventory_products:
   - PROD001: Standard Widget   (Hardware,    qty:150, threshold:50,  price:$49.99)
   - PROD002: Premium Sprocket  (Hardware,    qty:25,  threshold:30,  price:$129.50)
   - PROD003: Gasket Seal       (Accessories, qty:500, threshold:100, price:$5.25)
   - PROD004: Lithium Battery   (Electronics, qty:12,  threshold:20,  price:$89.00)
   - PROD005: Copper Wire 5m    (Electronics, qty:80,  threshold:25,  price:$15.00)
5. process.exit(0)
```

**Schema definition per table:**
```js
{ name: 'inventory_products',
  ColumnSchema: [{name:'info', VERSIONS:10}, {name:'stock', VERSIONS:10}] }

{ name: 'inventory_transactions',
  ColumnSchema: [{name:'meta', VERSIONS:10}, {name:'qty', VERSIONS:10}] }

{ name: 'inventory_alerts',
  ColumnSchema: [{name:'data', VERSIONS:10}] }
```

> **Why VERSIONS=10?** This is the core BDA Time-Travel feature. HBase stores each cell write with a unique millisecond timestamp instead of overwriting. With VERSIONS=10, up to 10 historical values per cell are retained, enabling full temporal queries.

### 4.7 HBase Schema & Table Design

#### Table: `inventory_products`

| Row Key | `info:name`      | `info:category` | `info:price` | `stock:quantity` | `stock:threshold` | `info:<dynamic>` |
|---------|------------------|-----------------|--------------|------------------|-------------------|------------------|
| PROD001 | Standard Widget  | Hardware        | 49.99        | 150              | 50                | (sparse/optional)|
| PROD002 | Premium Sprocket | Hardware        | 129.50       | 25               | 30                | —                |

- **Row Key:** Product ID (e.g., `PROD001`) — used for O(1) point lookups.
- **Column Family `info`:** Descriptive metadata (name, category, price, unit, dynamic attributes).
- **Column Family `stock`:** Quantitative, frequently-changing data (quantity, threshold, lastUpdated).
- **Dynamic Attributes:** Extra columns like `info:color`, `info:weight` per-product without schema changes — HBase's **sparse column model**.

#### Table: `inventory_transactions`

| Row Key             | `meta:type` | `meta:note` | `qty:quantity` | `qty:before` | `qty:after` |
|---------------------|-------------|-------------|----------------|--------------|-------------|
| PROD001_1714000000  | IN          | Restock     | 50             | 150          | 200         |

- **Row Key:** `{productId}_{epochMs}` — composite key ensures chronological ordering within a product.
- Transactions are **write-only** (append pattern) — never updated.

#### Table: `inventory_alerts` *(pre-provisioned)*

- Created in schema but alert generation happens in-memory via scan of `inventory_products`.
- Reserved for future server-side pre-computed alert caching.

### 4.8 API Routes — Deep Dive

---

#### `GET /api/products` — List All Products

```
1. client.table('inventory_products').scan({ batch: 1000 })
2. Receive flat array of HBase cells: [{key, column, $, timestamp}, ...]
3. Group cells by row key → build product objects
4. Per-cell timestamp comparison → keep only latest version of each cell
5. Return array of product objects
```

> **Why timestamp tracking?** HBase scan may return multiple versions of the same cell. The route picks the highest timestamp (latest value) to return current state.

---

#### `POST /api/products` — Create Product

```
Body: { id, name, category, unit, quantity, threshold, price, attributes: {} }

1. Build columns array: ['info:name', 'info:category', ..., 'stock:quantity', ...]
2. Append dynamic attribute columns: ['info:color', 'info:weight', ...]  (BDA Sparsity)
3. row.put(columns, values) → HBase multi-column write
4. Return 201 { message, id }
```

---

#### `PUT /api/products/:id` — Update Product Metadata

```
1. Same column/value put as POST but targets existing row key
2. stock:quantity is NOT updated here — use /api/stock for that
3. Supports dynamic attribute updates
```

---

#### `DELETE /api/products/:id` — Delete Product

```
1. client.table('inventory_products').row(id).delete()
2. Removes all cells for that row key
```

---

#### `PUT /api/stock/:id` — Stock Movement (IN/OUT)

**The most complex route — implements a mini-transaction:**

```
1. GET current stock:quantity for the product
2. Calculate newQty:
   changeType === 'IN'  → currentQty + quantity
   changeType === 'OUT' → currentQty - quantity
3. UPDATE stock:quantity + stock:lastUpdated on inventory_products
4. LOG transaction to inventory_transactions:
   Row Key = "{productId}_{Date.now()}"
   Columns: meta:type, meta:note, meta:createdBy, qty:quantity, qty:before, qty:after
5. Return { message, newQty }
```

> **Side effect by design:** Every stock movement automatically generates a transaction record, creating a full immutable audit trail in HBase.

---

#### `GET /api/transactions` — Transaction History

```
1. client.table('inventory_transactions').scan({ batch: 1000 })
2. Parse row key: "{productId}_{timestamp}" → extract productId and date
3. Group cells into transaction objects
4. Sort by timestamp descending (newest first)
5. Return sorted array
```

---

#### `GET /api/alerts` — Low-Stock Detection

```
1. Scan full inventory_products table
2. De-duplicate cells by timestamp (same as products route)
3. Filter: products where parseInt(quantity) <= parseInt(threshold)
4. Map to alert shape: { productId, name, currentQty, threshold, status }
   status = 'CRITICAL' if qty === 0, else 'LOW'
5. Return filtered array
```

> **Design note:** This is a full-table scan filtered in memory. In production, server-side HBase Filters or a pre-computed alerts table would be used for efficiency.

---

#### `GET /api/history/:id` — Time-Travel Cell History

**The BDA showpiece route:**

```
1. Request columns ['stock:quantity', 'info:price', 'info:name'] with { v: 10 }
   → HBase returns up to 10 versions of each cell
2. Collect all unique timestamps across all cells
3. Sort timestamps ascending (oldest → newest)
4. Build rolling timeline:
   - For each timestamp, update a currentState object with changed cells
   - Push snapshot { timestamp, date, ...currentState } to timeline
5. Reverse timeline (newest first)
6. Return timeline — each entry = product state at a specific moment in time
```

---

#### `POST /api/history/:id/restore` — Time-Travel Restore

```
Body: { quantity, price }   ← from a historical version the user selected

1. GET current state for fallback
2. PUT target quantity + price + new lastUpdated timestamp
   → HBase creates a NEW version (doesn't overwrite old ones)
3. LOG 'RESTORE' transaction with note "Travelled back to Price: $X"
4. Return { message: 'Time travel successful!' }
```

> After restore, the product appears "rolled back" — but all old versions remain intact in HBase. The history now shows the restore event as the newest entry.

---

#### `GET /api/raw/:table` — Raw HBase Cell Dump

```
1. Accept table name as URL param
2. Scan full table with batch: 1000
3. Return { tableName, rawCells: [...], count }
   rawCells is the unprocessed array exactly as HBase REST returns it
```

This endpoint exists purely for the educational **Raw Data Explorer** page.

### 4.9 Backend Data Flow Diagram

```
Client Request
     │
     ▼
Express Router
     │
     ├─── GET /api/products ───► scan(inventory_products) ──► group by key ──► []
     │
     ├─── POST /api/products ──► row.put(columns, values) ──► 201 created
     │
     ├─── PUT /api/stock/:id ──► row.get(stock:quantity)
     │                                   │
     │                            compute newQty
     │                                   │
     │                       row.put(stock:quantity, newQty)
     │                                   │
     │                       txnRow.put(meta:*, qty:*) ──► 200 { newQty }
     │
     ├─── GET /api/alerts ─────► scan(inventory_products) ──► filter qty<=threshold ──► []
     │
     ├─── GET /api/history/:id ► row.get(cols, {v:10}) ──► build timeline ──► []
     │
     ├─── POST /api/history/restore ► row.put(qty, price) + txnRow.put(RESTORE) ──► 200
     │
     └─── GET /api/raw/:table ──► table.scan() ──► raw cells ──► { rawCells, count }
```

---

## 5. Frontend Analysis

### 5.1 Technology Stack

| Package                 | Version   | Role                                                  |
|-------------------------|-----------|-------------------------------------------------------|
| `react`                 | ^18.2.0   | UI component framework                                |
| `react-dom`             | ^18.2.0   | React DOM renderer                                    |
| `react-router-dom`      | ^6.22.3   | Client-side routing (BrowserRouter, nested routes)   |
| `@tanstack/react-query` | ^5.28.14  | Server state management + 5s polling cache           |
| `axios`                 | ^1.6.8    | HTTP client (configured with `/api` base URL)        |
| `react-hook-form`       | ^7.72.1   | Performant form state management                     |
| `@hookform/resolvers`   | ^5.2.2    | Zod schema adapter for react-hook-form               |
| `zod`                   | ^4.3.6    | Runtime schema validation                            |
| `recharts`              | ^2.12.3   | Composable charting library (BarChart on dashboard)  |
| `sonner`                | ^1.4.41   | Toast notification system                            |
| `lucide-react`          | ^0.363.0  | SVG icon library (tree-shakable)                     |
| `clsx`                  | ^2.1.0    | Conditional class name utility                       |
| `tailwind-merge`        | ^2.2.2    | Safely merge Tailwind classes without conflicts      |
| `tailwindcss`           | ^3.4.3    | Utility-first CSS framework                          |
| `vite`                  | ^5.2.2    | Build tool + dev server with `/api` proxy            |
| `@vitejs/plugin-react`  | ^4.2.1    | React Fast Refresh for Vite                          |

### 5.2 Frontend Dependency Map

```
main.jsx  (entry point)
    │
    ├── React + ReactDOM
    ├── QueryClientProvider (@tanstack/react-query)
    │       └── QueryClient { refetchInterval: 5000ms }
    ├── Toaster (sonner)  ← global toast notification portal
    └── <App />
            │
            └── BrowserRouter (react-router-dom)
                    │
                    └── Layout.jsx  ← persistent shell (sidebar + header)
                            │
                            ├── /               → Dashboard.jsx
                            ├── /products       → Products.jsx
                            ├── /stock-manager  → ManageStock.jsx
                            ├── /time-travel    → TimeTravel.jsx
                            ├── /transactions   → Transactions.jsx
                            ├── /alerts         → Alerts.jsx
                            └── /raw            → RawExplorer.jsx

src/api/index.js  (API layer — shared by all pages)
    └── axios.create({ baseURL: '/api' })
            │
            ├── getProducts()             → GET    /api/products
            ├── addProduct(data)          → POST   /api/products
            ├── updateProduct(id, data)   → PUT    /api/products/:id
            ├── deleteProduct(id)         → DELETE /api/products/:id
            ├── updateStock(id, data)     → PUT    /api/stock/:id
            ├── getTransactions()         → GET    /api/transactions
            ├── getAlerts()               → GET    /api/alerts
            ├── getProductHistory(id)     → GET    /api/history/:id
            ├── restoreProductVersion()   → POST   /api/history/:id/restore
            └── getRawData(table)         → GET    /api/raw/:table
```

### 5.3 Frontend Directory Structure

```
frontend/
├── index.html              ← Vite HTML template (root div#root)
├── vite.config.js          ← Vite config: React plugin, port 3000, /api proxy
├── tailwind.config.js      ← Tailwind content paths
├── postcss.config.js       ← PostCSS plugins (tailwindcss, autoprefixer)
├── package.json
└── src/
    ├── main.jsx            ← ReactDOM.createRoot + providers + Toaster
    ├── App.jsx             ← BrowserRouter + route tree
    ├── index.css           ← Global CSS (glass utility class, animations)
    │
    ├── api/
    │   └── index.js        ← All API functions (axios instance)
    │
    ├── pages/
    │   ├── Dashboard.jsx   ← KPIs + StockChart + recent alerts
    │   ├── Products.jsx    ← Full inventory table + CRUD + search
    │   ├── ManageStock.jsx ← Grid view for quick stock adjustments
    │   ├── TimeTravel.jsx  ← HBase version history + restore UI
    │   ├── Transactions.jsx← Transaction log table
    │   ├── Alerts.jsx      ← Low-stock alert cards + quick restock
    │   └── RawExplorer.jsx ← Raw HBase cell viewer + JSON inspector
    │
    └── components/
        ├── Layout.jsx          ← Sidebar nav + header shell (Outlet)
        ├── KPICards.jsx        ← 4 stat cards (products, alerts, qty, txns)
        ├── StockChart.jsx      ← Recharts BarChart (stock vs threshold)
        ├── StockModal.jsx      ← Stock IN/OUT modal dialog
        ├── ProductDialog.jsx   ← Add/Edit product form (Zod + RHF)
        ├── ProductHistory.jsx  ← Quick cell history popup
        └── LoadingSpinner.jsx  ← Centered spinner component
```

### 5.4 Entry Point — `main.jsx`

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,  // All queries auto-refetch every 5 seconds
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </React.StrictMode>
)
```

**Key decisions:**
- `refetchInterval: 5000` applies globally to ALL `useQuery` hooks — live dashboard feel without WebSockets.
- `Toaster` is mounted once at root so any page can call `toast.success()` / `toast.error()`.

### 5.5 Routing — `App.jsx`

Uses **nested routing** pattern from React Router v6. All pages render inside `<Outlet />` in `Layout.jsx`, keeping sidebar and header persistent across navigation.

```
Route "/"  →  Layout (persistent shell)
  ├── index  →  Dashboard
  ├── products  →  Products
  ├── transactions  →  Transactions
  ├── alerts  →  Alerts
  ├── raw  →  RawExplorer
  ├── stock-manager  →  ManageStock
  └── time-travel  →  TimeTravel
```

### 5.6 API Layer — `src/api/index.js`

Single `axios` instance with base URL `/api`. Vite dev server proxies `/api/*` → `http://localhost:5000`, eliminating CORS issues during development.

| Function                          | HTTP     | Endpoint                    |
|-----------------------------------|----------|-----------------------------|
| `getProducts()`                   | GET      | `/api/products`             |
| `addProduct(data)`                | POST     | `/api/products`             |
| `updateProduct(id, data)`         | PUT      | `/api/products/:id`         |
| `deleteProduct(id)`               | DELETE   | `/api/products/:id`         |
| `updateStock(prodId, data)`       | PUT      | `/api/stock/:id`            |
| `getTransactions()`               | GET      | `/api/transactions`         |
| `getAlerts()`                     | GET      | `/api/alerts`               |
| `getProductHistory(id)`           | GET      | `/api/history/:id`          |
| `restoreProductVersion(id, data)` | POST     | `/api/history/:id/restore`  |
| `getRawData(table)`               | GET      | `/api/raw/:table`           |

### 5.7 Pages Analysis

---

#### `Dashboard.jsx` — Overview Hub

**Queries:** `['products']`, `['alerts']`, `['transactions']` (all auto-refresh every 5s)

**Renders:**
- `<KPICards>` — 4 metric cards fed with all three data sets
- `<StockChart>` — bar chart for product quantity visualization
- Recent alerts panel — top 5 alerts from the alerts query

---

#### `Products.jsx` — Inventory Table

**State:** `searchTerm`, `selectedProduct`, `isStockModalOpen`, `isProductModalOpen`, `historyTarget`

**Mutations:**
- `deleteMutation` — calls `deleteProduct(id)`, invalidates `['products']` and `['alerts']`
- `productSubmitMutation` — calls `addProduct(data)` or `updateProduct(id, data)` based on context

**Features:**
- Live search filtering by name, category, or ID
- **Sparsity column** — displays dynamic HBase attributes as indigo badges
- Per-row actions: Stock Transfer (StockModal), Edit (ProductDialog), Delete, History (ProductHistory)
- Stock level color coding: amber if qty <= threshold, blue otherwise

---

#### `ManageStock.jsx` — Dedicated Stock Manager

Card-based view of all products. Each card shows:
- Current stock level + safety threshold
- Animated amber pulse dot when stock is low
- "Process Movement" button → opens `StockModal`

Shares `useQuery(['products'])` cache with Products page via TanStack Query.

---

#### `TimeTravel.jsx` — HBase Version History Explorer

**The flagship BDA feature page.** Two-stage UI:

**Stage 1 — Product Grid:** All products shown as cards. Clicking one transitions to Stage 2.

**Stage 2 — Version Timeline:**
- Calls `getProductHistory(product.id)` → fetches up to 10 HBase versions
- Vertical timeline: each node = one HBase version (quantity + price)
- Trend arrows computed: qtyDiff and priceDiff vs. previous version
- First entry = "Current Version (Live)" — green, no restore button
- Prior entries show "Restore This State" button

**Restore Flow:**
```
Click "Restore This State"
→ setRestoringId(version.timestamp)     [spinner on that row]
→ restoreProductVersion(id, { quantity, price })
→ queryClient.invalidateQueries(['products', 'alerts', 'transactions'])
→ toast.success("Successfully travelled back in time!")
→ Refresh history → restored version becomes new "Current"
```

---

#### `Transactions.jsx` — Audit Log

Simple table rendering all transactions sorted newest-first. Green "IN" badge or red "OUT" badge. "Before → After" column shows quantity delta at a glance.

---

#### `Alerts.jsx` — Low-Stock Command Center

- Card grid with one card per alert
- Red left border + AlertCircle icon for CRITICAL (qty = 0)
- Amber left border + AlertTriangle icon for LOW (qty <= threshold)
- Visual progress bar showing stock vs threshold ratio
- "Set Restock Quantity" button → opens StockModal
- Empty state: bouncing green checkmark "Zero Criticals"

---

#### `RawExplorer.jsx` — HBase Raw Data Viewer

- Table selector toggle: `inventory_products` | `inventory_transactions` | `inventory_alerts`
- Left panel: styled cell cards — column, timestamp, key, value for first 50 cells
- Right panel: dark terminal JSON viewer — `JSON.stringify` of first 5 cells
- Educational info box explaining HBase's cell-based storage vs SQL rows

---

### 5.8 Reusable Components Analysis

---

#### `Layout.jsx` — Application Shell

```
Sidebar (fixed, dark slate-900):
  - Logo "InventoryX" (gradient text, hidden when collapsed)
  - Toggle button (X / Menu icon)
  - Nav items with active state (blue-600 background)
  - Tooltip on collapsed sidebar

Header (sticky, white, z-40):
  - Page title from navItems lookup
  - "HBase Connected" green animated pulse badge

Main area:
  - <Outlet /> renders child route pages
  - ml margin adjusts with sidebar: 64px expanded / 16px collapsed
```

---

#### `KPICards.jsx` — 4 Metric Cards

| Card           | Value Source                                      |
|----------------|---------------------------------------------------|
| Total Products | `products.length`                                 |
| Stock Movements| `transactions.length`                             |
| Low Stock      | `alerts.length`                                   |
| Total Qty      | `products.reduce((acc, p) => acc + p.quantity, 0)`|

---

#### `StockChart.jsx` — Bar Chart

- Recharts `BarChart` component
- Bar color: amber if `qty <= threshold`, blue otherwise
- Rounded bar tops, clean gridlines, custom tooltip

---

#### `StockModal.jsx` — Stock IN/OUT Dialog

```
Props: { isOpen, onClose, product }
State: qtyChange (number input)

Mutation: updateStock(product.id, { quantity: qtyChange, changeType: 'IN' | 'OUT' })
  onSuccess:
    - invalidateQueries(['products', 'alerts', 'transactions'])
    - toast.success(...)
    - reset + close

Validation: OUT button disabled if qtyChange > product.quantity
```

---

#### `ProductDialog.jsx` — Create / Edit Product Form

Uses: `react-hook-form` + `@hookform/resolvers/zod` + `zod`

```
Zod Schema:
  id:         string (min 3, max 20)
  name:       string (min 2)
  category:   string (min 2)
  unit:       string (default 'pcs')
  price:      string (regex: decimal format)
  quantity:   number (min 0, preprocessed from string)
  threshold:  number (min 0, preprocessed from string)
  attributes: [{key, value}][]   (dynamic — BDA sparsity demo)

useEffect: When initialData changes → reset form + extract dynamic attributes
onFormSubmit: Convert attributes array back to {key: value} object for HBase API

ID field: disabled on edit (immutable HBase row key)
Quantity: disabled on edit (use StockModal for qty changes)
```

---

#### `ProductHistory.jsx` — Cell History Popup

```
Props: { productId, productName, column, onClose }
Query: ['history', productId, column] → enabled only when both are set

Renders:
  - Ordered list of { value, date } per version
  - Version number badge (newest = highest number)
  - BDA insight callout: explains HBase multi-version storage
```

---

#### `LoadingSpinner.jsx`

Simple centered spinner: animated `border-t-blue-500` rotating div.

---

### 5.9 Frontend Data Flow Diagram

```
User Action
     │
     ▼
Page Component (useState for local UI state)
     │
     ├── useQuery(['key'], fetchFn)
     │         │
     │         ▼
     │   TanStack Query Cache
     │         │ (miss or stale > 5s)
     │         ▼
     │   src/api/index.js  →  axios GET /api/...
     │         │
     │         ▼  (Vite proxy → :5000)
     │   Express Backend  →  HBase REST :8080
     │         │
     │         ▼
     │   Response → cache update → component re-render
     │
     └── useMutation(mutationFn)
               │ (user clicks button)
               ▼
         src/api/index.js  →  axios POST/PUT/DELETE /api/...
               │
               ▼  (Vite proxy → :5000)
         Express Backend  →  HBase REST :8080
               │
               ▼
         onSuccess:
           queryClient.invalidateQueries([...])  ← forces re-fetch
           toast.success(...)
           close modal / reset form
```

---

## 6. Full-Stack Integration Flow

### Stock IN: User adds 50 units to PROD001

```
1.  [StockModal] user enters 50, clicks "Stock IN"
2.  stockMutation.mutate('IN')
3.  [api/index.js] updateStock('PROD001', { quantity: 50, changeType: 'IN' })
4.  axios.put('/api/stock/PROD001', body)
5.  [Vite proxy] forwards → http://localhost:5000/api/stock/PROD001
6.  [routes/stock.js] PUT /:id handler fires
7.  client.table('inventory_products').row('PROD001').get('stock:quantity')
    → returns currentQty = 150
8.  newQty = 150 + 50 = 200
9.  productRow.put(['stock:quantity', 'stock:lastUpdated'], ['200', '<ISO>'])
    → HBase writes NEW CELL VERSION (old value 150 is retained!)
10. txnRow = 'PROD001_<timestamp>'
    txnRow.put(['meta:type', ..., 'qty:before', 'qty:after'], ['IN', ..., '150', '200'])
11. Response: 200 { message: 'Stock updated', newQty: 200 }
12. [StockModal onSuccess] queryClient.invalidateQueries(['products', 'alerts', 'transactions'])
13. TanStack Query re-fetches all 3 endpoints simultaneously
14. Dashboard / Products / Alerts all update within ~1 second
15. toast.success("Stock level updated for Standard Widget")
```

### Time Travel: Restore PROD001 to a historical state (qty=100)

```
1.  [TimeTravel page] user clicks PROD001 card
2.  getProductHistory('PROD001') → GET /api/history/PROD001
3.  HBase returns up to 10 versions of [stock:quantity, info:price, info:name]
4.  Backend builds timeline: [{timestamp, date, quantity, price}, ...]
5.  UI renders vertical timeline with quantity/price at each version
6.  User clicks "Restore This State" on entry with qty=100
7.  restoreProductVersion('PROD001', { quantity: 100, price: '49.99' })
    → POST /api/history/PROD001/restore
8.  Backend: row.put(['stock:quantity', 'info:price', 'stock:lastUpdated'], [..., now])
    → NEW version created — all old versions remain untouched
9.  Transaction logged: meta:type='RESTORE', meta:note='Travelled back to Price: $49.99'
10. queryClient.invalidateQueries(['products', 'alerts', 'transactions'])
11. History refreshed — new "Current Version" now shows qty=100
12. toast.success("Successfully travelled back in time!")
```

---

## 7. Key BDA Concepts Demonstrated

| Concept                        | Where Implemented                                                  | File(s)                                   |
|--------------------------------|--------------------------------------------------------------------|-------------------------------------------|
| **Wide-Column Store**          | HBase table schema with column families (info, stock, meta, qty)  | `initializeHBase.js`                      |
| **Sparse Columns**             | Dynamic attributes stored as `info:<key>` only when present        | `routes/products.js`, `ProductDialog.jsx` |
| **Multi-Version Cells (v=10)** | Time-travel history of stock/price changes                         | `initializeHBase.js`, `routes/history.js` |
| **Time-Travel Queries**        | `row.get(columns, { v: 10 })` retrieves all historical versions    | `routes/history.js`                       |
| **Point-in-Time Restore**      | PUT overwrites current cell → new version created, history intact  | `routes/history.js` POST restore          |
| **Append-Only Transactions**   | Row key = `{productId}_{epochMs}` → chronological ordering         | `routes/stock.js`                         |
| **Raw Cell Inspection**        | Frontend shows exact HBase cell wire format                        | `routes/raw.js`, `RawExplorer.jsx`        |
| **Real-time Polling**          | TanStack Query `refetchInterval: 5000`                             | `main.jsx`                                |
| **In-Memory Scan Filter**      | Alerts from full-table scan filtered by qty vs threshold           | `routes/alerts.js`                        |

---

## 8. Environment Configuration

### Backend `.env`

```env
PORT=5000
HBASE_HOST=localhost
HBASE_PORT=8080
```

| Variable     | Default     | Description                                |
|--------------|-------------|--------------------------------------------|
| `PORT`       | `5000`      | Express server listen port                 |
| `HBASE_HOST` | `localhost` | Hostname of the HBase Stargate REST server |
| `HBASE_PORT` | `8080`      | Port of HBase Stargate REST API            |

### Frontend `vite.config.js`

```js
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:5000'   // All /api/* calls proxied to backend
  }
}
```

---

## 9. Setup & Running Guide

### Prerequisites

- Docker & Docker Compose
- Node.js >= 18 (or Bun)
- npm / bun

### Step 1 — Start HBase

```bash
docker-compose up -d
# Wait 30-60 seconds for HBase to fully initialize
# Verify: http://localhost:16010 (HBase Master Web UI)
```

### Step 2 — Backend Setup

```bash
cd backend
npm install

# Seed database (creates tables + 5 initial products)
npm run seed

# Start backend server (development mode with auto-reload)
npm run dev
```

Backend available at: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

### Step 4 — Verify

Open `http://localhost:3000` → Dashboard should display 5 seeded products.

### Backend npm Scripts

| Script         | Command                        | Action                                       |
|----------------|--------------------------------|----------------------------------------------|
| `npm start`    | `node src/index.js`            | Production server start                      |
| `npm run dev`  | `nodemon src/index.js`         | Development server with auto-reload          |
| `npm run seed` | `node src/initializeHBase.js`  | Drop + recreate HBase tables + seed 5 products|

### Frontend npm Scripts

| Script             | Command        | Action                           |
|--------------------|----------------|----------------------------------|
| `npm run dev`      | `vite`         | Development server (port 3000)   |
| `npm run build`    | `vite build`   | Production bundle output         |
| `npm run preview`  | `vite preview` | Preview production build locally |

---

