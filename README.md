# 📚 LibraryOS — Modern Library Management System

> A production-quality, full-stack library management platform built with **FastAPI + React**. Designed to look and feel like a premium SaaS product, not a college CRUD project.

![Tech Stack](https://img.shields.io/badge/FastAPI-0.111-green?style=flat-square) ![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan?style=flat-square) ![SQLite](https://img.shields.io/badge/SQLite-3-orange?style=flat-square) ![Pandas](https://img.shields.io/badge/Pandas-2.2-purple?style=flat-square) ![Phase](https://img.shields.io/badge/Phase-2%20Complete-brightgreen?style=flat-square)

---

## ✨ Features

### Phase 1 — Core Library Management
- **Book Management** — Full CRUD with grid/list views, cover color coding, category filtering, ISBN validation
- **Borrower Management** — Member profiles with avatar initials, active borrow tracking
- **Borrow & Return Workflow** — Visual book/borrower selection, duplicate borrow prevention, automatic availability updates
- **Transaction History** — Filterable timeline with active/returned status, date tracking
- **Global Search** — Real-time debounced search across books and borrowers
- **Dashboard** — Stats cards, area charts, pie charts, recent activity feeds

### Phase 2 — ETL Pipeline & Analytics
- **ETL Pipeline** — Upload CSV datasets or sync from live DB; extract → validate → transform → load in one click
- **Analytics Dashboard** — KPI cards, monthly borrowing trends, popular books leaderboard, category distribution, overdue analysis
- **Reports Page** — Sortable/paginated tables for all analytics datasets with one-click CSV export
- **ETL Manager** — Drag-and-drop CSV upload, dataset type selection, job log viewer with auto-refresh
- **5 analytics tables** rebuilt automatically after every ETL run (popular books, monthly trends, category summary, overdue summary, job logs)
- **475 seed records** — 153 books, 62 borrowers, 260 transactions across 3 importable CSV datasets

### UI/UX
- Warm beige/brown/navy library-themed palette
- Glassmorphism cards and smooth Framer Motion animations
- Animated collapsible sidebar with tooltip labels and "Analytics" section group
- Book cover placeholders with unique color coding per genre
- Loading skeletons for every data-loading state
- Empty state illustrations
- Toast notifications (success/error)
- Responsive layout — works on desktop, tablet, mobile
- Playfair Display headings + Inter body font

### Technical
- Modular FastAPI architecture (routers / crud / schemas / models / etl / analytics / config)
- SQLAlchemy ORM with SQLite (WAL mode, FK enforcement)
- PostgreSQL-ready architecture — swap `DATABASE_URL` in `.env`
- Pydantic v2 validation with custom error messages
- Pandas ETL pipeline with field normalization, deduplication, and derived metric computation
- UUID-based ETL job tracking with structured log capture
- Axios API service layer with interceptors
- Custom React hooks (`useBooks`, `useBorrowers`, `useDebounce`)
- Paginated API endpoints with sorting + filtering
- CSV export via FastAPI `StreamingResponse`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TailwindCSS 3, Framer Motion |
| UI Components | Lucide React, Recharts, React Hot Toast |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Backend | FastAPI 0.111, Python 3.10+ |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Database | SQLite (PostgreSQL-ready) |
| ETL | Pandas 2.2, NumPy 1.26 |
| File I/O | python-multipart, aiofiles, openpyxl |

---

## 📁 Project Structure

```
Library Management/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS + router registration
│   │   ├── database.py          # Engine, session, Base
│   │   ├── config/
│   │   │   └── settings.py      # Pydantic settings
│   │   ├── models/
│   │   │   ├── book.py          # Book ORM model
│   │   │   ├── borrower.py      # Borrower ORM model
│   │   │   └── transaction.py   # Transaction ORM model
│   │   ├── schemas/
│   │   │   ├── book.py          # Pydantic Book schemas
│   │   │   ├── borrower.py      # Pydantic Borrower schemas
│   │   │   ├── transaction.py   # Pydantic Transaction schemas
│   │   │   └── common.py        # Shared response schemas
│   │   ├── crud/
│   │   │   ├── book.py          # Book CRUD operations
│   │   │   ├── borrower.py      # Borrower CRUD operations
│   │   │   └── transaction.py   # Transaction CRUD + borrow/return logic
│   │   ├── routers/
│   │   │   ├── books.py         # GET/POST/PUT/DELETE /books
│   │   │   ├── borrowers.py     # GET/POST/PUT/DELETE /borrowers
│   │   │   ├── transactions.py  # GET /transactions, POST /borrow, POST /return
│   │   │   ├── search.py        # GET /search
│   │   │   └── dashboard.py     # GET /dashboard/stats
│   │   └── dependencies/        # FastAPI dependencies (extensible)
│   ├── seed.py                  # Sample data seeder
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── MainLayout.jsx
    │   │   │   ├── Sidebar.jsx   # Animated collapsible sidebar
    │   │   │   └── Navbar.jsx    # Search + profile topbar
    │   │   └── ui/
    │   │       ├── Modal.jsx
    │   │       ├── ConfirmDialog.jsx
    │   │       ├── StatCard.jsx
    │   │       ├── StatusBadge.jsx
    │   │       ├── EmptyState.jsx
    │   │       ├── LoadingSkeleton.jsx
    │   │       └── Pagination.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # Hero + stats + charts + recent activity
    │   │   ├── Books.jsx         # Book CRUD with grid/list views
    │   │   ├── Borrowers.jsx     # Borrower management
    │   │   ├── BorrowReturn.jsx  # Borrow/return workflow
    │   │   ├── Transactions.jsx  # Transaction history
    │   │   ├── Search.jsx        # Global search
    │   │   ├── Analytics.jsx     # [Phase 2] Analytics dashboard
    │   │   ├── ETLManager.jsx    # [Phase 2] ETL pipeline manager
    │   │   ├── Reports.jsx       # [Phase 2] Tabular reports + CSV export
    │   │   └── NotFound.jsx      # 404 page
    │   ├── hooks/
    │   │   ├── useBooks.js
    │   │   ├── useBorrowers.js
    │   │   └── useDebounce.js
    │   ├── services/
    │   │   └── api.js            # Axios API service layer
    │   ├── context/
    │   │   └── AppContext.jsx    # Global state + sidebar
    │   ├── utils/
    │   │   ├── cn.js             # clsx + tailwind-merge
    │   │   └── format.js         # Date formatters
    │   └── styles/
    │       └── globals.css       # Tailwind base + component classes
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd "Library Management/backend"

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample data (optional but recommended)
python seed.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at: **http://localhost:8000**
API Docs (Swagger UI): **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd "Library Management/frontend"

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be running at: **http://localhost:5173**

### 3. Import Phase 2 Datasets (Optional)

After the backend is running, import the pre-built CSV datasets through the ETL Manager UI or via curl:

```bash
# Option A: Use the ETL Manager UI
# Navigate to http://localhost:5173/etl-manager
# Upload each CSV from backend/datasets/ with the correct dataset type

# Option B: Run DB sync (rebuilds analytics from existing data)
curl -X POST http://localhost:8000/api/v1/etl/run

# Option C: Upload via curl
curl -X POST "http://localhost:8000/api/v1/etl/upload?dataset_type=books" \
  -F "file=@backend/datasets/books_dataset.csv"

curl -X POST "http://localhost:8000/api/v1/etl/upload?dataset_type=borrowers" \
  -F "file=@backend/datasets/borrowers_dataset.csv"

curl -X POST "http://localhost:8000/api/v1/etl/upload?dataset_type=transactions" \
  -F "file=@backend/datasets/transactions_dataset.csv"
```

The datasets contain:
- **`books_dataset.csv`** — 153 books across 20+ categories with publisher, year, description, ISBN
- **`borrowers_dataset.csv`** — 62 borrowers with email, phone, address
- **`transactions_dataset.csv`** — 260 transactions (75% returned, 25% active, realistic overdue patterns)

After import, visit `/analytics` to see the populated dashboard.

---

## 🔌 API Reference

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/books` | List all books (paginated, filterable) |
| GET | `/api/v1/books/{id}` | Get book by ID |
| POST | `/api/v1/books` | Create new book |
| PUT | `/api/v1/books/{id}` | Update book |
| DELETE | `/api/v1/books/{id}` | Delete book |
| GET | `/api/v1/books/categories` | Get all categories |
| GET | `/api/v1/books/stats` | Book statistics |
| GET | `/api/v1/books/recent` | Recently added books |

### Borrowers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/borrowers` | List all borrowers |
| GET | `/api/v1/borrowers/{id}` | Get borrower by ID |
| POST | `/api/v1/borrowers` | Create new borrower |
| PUT | `/api/v1/borrowers/{id}` | Update borrower |
| DELETE | `/api/v1/borrowers/{id}` | Delete borrower |
| GET | `/api/v1/borrowers/stats` | Borrower statistics |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions` | List all transactions |
| GET | `/api/v1/transactions/{id}` | Get transaction by ID |
| POST | `/api/v1/borrow` | Borrow a book |
| POST | `/api/v1/return` | Return a book |
| GET | `/api/v1/transactions/stats` | Transaction statistics |
| GET | `/api/v1/transactions/recent` | Recent transactions |

### Search & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search?q={query}` | Global search |
| GET | `/api/v1/dashboard/stats` | Aggregate dashboard stats |
| GET | `/api/v1/dashboard/recent-transactions` | Recent transactions |
| GET | `/api/v1/dashboard/recent-books` | Recently added books |

#### Query Parameters for `/api/v1/books`
| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | int | Pagination offset (default: 0) |
| `limit` | int | Results per page (default: 20, max: 100) |
| `search` | string | Full-text search across title, author, ISBN, category |
| `category` | string | Filter by category |
| `availability_status` | boolean | Filter available/borrowed books |
| `sort_by` | string | Sort field (default: book_id) |
| `sort_order` | string | `asc` or `desc` (default: desc) |

### ETL Pipeline (Phase 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/etl/upload?dataset_type={type}` | Upload CSV file (books/borrowers/transactions) |
| POST | `/api/v1/etl/run` | Run DB sync pipeline (rebuild analytics from live data) |
| GET | `/api/v1/etl/status/{job_id}` | Get ETL job status by UUID |
| GET | `/api/v1/etl/logs` | List recent ETL job logs |

### Analytics (Phase 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/dashboard-summary` | KPI aggregates + top books + monthly trends |
| GET | `/api/v1/analytics/popular-books` | Books ranked by total borrows |
| GET | `/api/v1/analytics/monthly-trends` | Monthly borrow/return/overdue counts |
| GET | `/api/v1/analytics/category-trends` | Per-category book and borrow stats |
| GET | `/api/v1/analytics/overdue-analysis` | Overdue stats + top offenders |
| GET | `/api/v1/analytics/export/popular-books` | CSV download — popular books |
| GET | `/api/v1/analytics/export/monthly-trends` | CSV download — monthly trends |
| GET | `/api/v1/analytics/export/overdue` | CSV download — overdue transactions |
| GET | `/api/v1/analytics/export/categories` | CSV download — category summary |

---

## 🗄 Database Schema

```sql
-- Books
CREATE TABLE books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    availability_status BOOLEAN DEFAULT TRUE,
    description VARCHAR(1000),
    publisher VARCHAR(255),
    published_year INTEGER,
    cover_color VARCHAR(20),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME
);

-- Borrowers
CREATE TABLE borrowers (
    borrower_id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME
);

-- Transactions
CREATE TABLE transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER REFERENCES books(book_id) ON DELETE CASCADE,
    borrower_id INTEGER REFERENCES borrowers(borrower_id) ON DELETE CASCADE,
    borrow_date DATETIME DEFAULT NOW(),
    due_date DATETIME,
    return_date DATETIME,
    is_returned BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT NOW()
);
```

### Analytics Tables (Phase 2 — auto-rebuilt by ETL)

```sql
-- Popular books summary (rebuilt after every ETL run)
CREATE TABLE analytics_popular_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER, title VARCHAR(255), author VARCHAR(255), category VARCHAR(100),
    total_borrows INTEGER DEFAULT 0, total_returns INTEGER DEFAULT 0,
    active_borrows INTEGER DEFAULT 0, avg_borrow_days FLOAT DEFAULT 0.0,
    rank INTEGER, last_borrowed_at DATETIME, updated_at DATETIME
);

-- Monthly borrowing trends
CREATE TABLE analytics_monthly_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER, month INTEGER, month_label VARCHAR(20),
    total_borrows INTEGER DEFAULT 0, total_returns INTEGER DEFAULT 0,
    active_borrows INTEGER DEFAULT 0, overdue_count INTEGER DEFAULT 0,
    unique_borrowers INTEGER DEFAULT 0, unique_books INTEGER DEFAULT 0,
    updated_at DATETIME
);

-- Category-level summary
CREATE TABLE analytics_category_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR(100) UNIQUE, total_books INTEGER DEFAULT 0,
    available_books INTEGER DEFAULT 0, borrowed_books INTEGER DEFAULT 0,
    total_borrows INTEGER DEFAULT 0, borrow_percentage FLOAT DEFAULT 0.0,
    updated_at DATETIME
);

-- Overdue transaction tracking
CREATE TABLE analytics_overdue_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER UNIQUE, book_id INTEGER, borrower_id INTEGER,
    overdue_days FLOAT DEFAULT 0.0, status VARCHAR(50), updated_at DATETIME
);

-- ETL job audit log
CREATE TABLE etl_job_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(36) UNIQUE, job_type VARCHAR(50), status VARCHAR(20),
    records_extracted INTEGER DEFAULT 0, records_transformed INTEGER DEFAULT 0,
    records_loaded INTEGER DEFAULT 0, records_skipped INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0, log_output TEXT,
    duration_seconds FLOAT, created_at DATETIME, updated_at DATETIME
);
```

---

## 🔄 ETL Architecture (Phase 2)

```
CSV Upload / DB Sync
        │
        ▼
┌─────────────────┐
│    Extract      │  → Read CSV bytes or query live DB tables
│  (extract.py)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Transform     │  → Normalize columns, validate, deduplicate
│ (transform.py)  │  → Compute derived fields:
└────────┬────────┘    - borrowing_month / borrowing_year
         │             - overdue_days (julianday arithmetic)
         ▼             - transaction_status (active/overdue/returned_on_time/returned_late)
┌─────────────────┐
│     Load        │  → Upsert books (by ISBN), borrowers (by email)
│   (load.py)     │  → Rebuild all 4 analytics tables from scratch
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Job Log       │  → UUID job_id, status, record counts, duration, captured logs
│ (EtlJobLog)     │
└─────────────────┘
```

**Transform derived fields:**

| Field | Source | Logic |
|-------|--------|-------|
| `borrowing_month` | `borrow_date` | `.dt.month` |
| `borrowing_year` | `borrow_date` | `.dt.year` |
| `overdue_days` | `due_date`, `return_date` | `(ref_date - effective_due).days.clip(lower=0)` |
| `transaction_status` | `is_returned`, `overdue_days` | `active` / `overdue` / `returned_on_time` / `returned_late` |

---

## 🎨 Sample Data

Running `python seed.py` will populate the database with:
- **20 books** across 10 categories (Fiction, Sci-Fi, Fantasy, Technology, Business, Self-Help, etc.)
- **8 borrowers** with complete profiles
- **5 active borrowings** with various borrow dates
- **3 completed returns** for transaction history

**Phase 2 datasets** (in `backend/datasets/`):
- **`books_dataset.csv`** — 153 books, 20+ categories, full metadata
- **`borrowers_dataset.csv`** — 62 borrowers with realistic profiles
- **`transactions_dataset.csv`** — 260 transactions, 75% returned, 25% active, varied overdue patterns

---

## 🔮 Future Enhancements

- [ ] Dark mode toggle
- [ ] AI-powered semantic book search (vector embeddings)
- [ ] Book recommendation engine
- [ ] Email notifications for due dates
- [ ] Barcode/ISBN scanning
- [ ] Fine tracking for overdue books
- [ ] Role-based access control (Admin / Librarian / Member)
- [ ] PostgreSQL migration with Alembic
- [ ] Docker Compose setup
- [ ] REST API authentication (JWT)
- [ ] Analytics with historical charts

---

## 🐳 Docker Support (coming soon)

```yaml
# docker-compose.yml (planned)
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
  frontend:
    build: ./frontend
    ports: ["5173:80"]
```

---

## 📝 License

MIT License — free to use, modify and distribute.

---

*Built with ❤️ as a portfolio-quality capstone project demonstrating modern full-stack development with FastAPI + React.*
