# Frontend Documentation: HBase Inventory UI

This is a modern, responsive React dashboard designed to visualize Big Data concepts from Apache HBase.

## Core Features
- **Real-Time Analytics**: Visual stock distribution charts using **Recharts**.
- **Time-Travel Visualizer**: Dedicated UI to see historical versions of data cells.
- **Dynamic Form System**: Uses **React Hook Form** + **Zod** for complex data entry with validation.
- **Sparsity Display**: Automatically detects and displays unique attributes for different products.
- **Auto-Sync**: Automatically refetches data every 5 seconds using **TanStack Query**.

## Directory Structure
```text
frontend/
├── src/
│   ├── api/                # Axios API wrappers
│   ├── components/         # Reusable UI Components
│   │   ├── KPICards.jsx    # Dashboard high-level stats
│   │   ├── Layout.jsx      # Navigation & Application Shell
│   │   ├── LoadingSpinner.jsx # HBase status indicator
│   │   ├── ProductDialog.jsx# Add/Edit form with Zod
│   │   ├── ProductHistory.jsx# BDA "Time Travel" Viewer
│   │   └── StockChart.jsx  # Recharts visualization
│   ├── pages/              # Main Application Pages
│   │   ├── Alerts.jsx      # Critical threshold view
│   │   ├── Dashboard.jsx   # Analytics overview
│   │   ├── Products.jsx    # Inventory Management (CRUD)
│   │   └── Transactions.jsx# Full audit log scan
│   ├── App.jsx             # Router & Root Component
│   ├── index.css           # Tailwind CSS & Global Styles
│   └── main.jsx            # Entry point & Provider setup
├── tailwind.config.js      # Styling configuration
└── vite.config.js          # Build & Proxy setup
```

## Major Component Explanations

### 1. `src/components/ProductDialog.jsx`
Integrated with **Zod Schema**. It handles the "Sparsity" demo by allowing users to add "Dynamic Attributes". It converts the field array into a flat object for HBase storage.

### 2. `src/components/ProductHistory.jsx`
This is the **Time Travel Viewer**. It displays the last 10 values of a cell. It demonstrates that in a Big Data system like HBase, data isn't just "there" or "gone"—it's a timeline.

### 3. `src/pages/Dashboard.jsx`
Combines KPI cards and a Bar Chart. It provides an immediate overview of total inventory health and identifies top stock levels.

### 4. `src/pages/Products.jsx`
The core management interface. It tracks state for modals and handles mutations (Add, Update, Delete) via React Query. It displays standard fields alongside any dynamic attributes (HBase sparsity).

### 5. `src/main.jsx`
Configures the `QueryClient`. **Refetch Interval** is set to 5000ms here to simulate a "Live" Big Data stream without needing WebSockets.

---

## Tech Stack Details
- **Styling**: Tailwind CSS (with Glassmorphism effects).
- **Icons**: Lucide React.
- **Data Fetching**: TanStack React Query (Cache management).
- **Form Validation**: Zod (Type safety for inputs).
- **Project Tooling**: Vite (Fast HMR & Build).
