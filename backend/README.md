# Backend Documentation: HBase Inventory Manager

This is the Node.js backend for the Real-Time Inventory Management System. It acts as a middle-layer between the React frontend and the Apache HBase storage.

## Core Features
- **HBase REST Integration**: Communicates with the HBase Stargate REST gateway.
- **Data Seeding**: Automated script to initialize tables with Big Data configurations (e.g., `VERSIONS: 10`).
- **Real-Time API**: Provides endpoints for inventory scouting, stock movement logging, and audit history.
- **Sparsity Support**: Handles dynamic attributes without a fixed schema.

## Directory Structure
```text
backend/
├── src/
│   ├── routes/             # API Route Handlers
│   │   ├── alerts.js       # Low stock detection logic
│   │   ├── history.js      # HBase Time-Travel version retrieval
│   │   ├── products.js     # CRUD operations for inventory
│   │   ├── stock.js        # Stock IN/OUT & Transaction logging
│   │   └── transactions.js # History log scanning
│   ├── hbaseClient.js      # HBase connection singleton
│   ├── index.js            # Express server entry point
│   └── initializeHBase.js  # Database setup & Seeding script
├── .env                    # Environment configuration
└── package.json            # Dependencies and scripts
```

## File Explanations

### 1. `src/index.js`
The main entry point. It initializes the Express server, enables CORS, and registers all API routes. It also loads environment variables from `.env`.

### 2. `src/hbaseClient.js`
A singleton module that configures the `hbase` npm library. It defines the `host` and `port` where the HBase REST server is running (default: `localhost:8080`).

### 3. `src/initializeHBase.js`
**Crucial for the BDA Lab.** This script:
- Drops old tables to ensure a clean state.
- Creates new tables with a specific **Big Data Schema**.
- **Important Config**: Sets `VERSIONS: 10` on column families to enable historical tracking.

### 4. `src/routes/products.js`
Handles standard CRUD. 
- **Big Data Note**: Supports "Dynamic Attributes". It maps any extra JSON fields directly to HBase columns, demonstrating **Sparsity**.

### 5. `src/routes/history.js`
Uses the HBase `v` (version) parameter to fetch the last 10 versions of a single cell. This powers the "Time Travel" feature in the UI.

### 6. `src/routes/stock.js`
When stock is updated, this route performs two actions in one request:
1. Updates the `inventory_products` table.
2. Appends a new audit log to the `inventory_transactions` table using a `productId_timestamp` RowKey.

---

## Environment Variables (.env)
- `PORT`: Server port (default 5000).
- `HBASE_HOST`: Location of the HBase container.
- `HBASE_PORT`: Port of the Stargate REST gateway (8080).
