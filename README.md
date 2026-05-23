# 📚 LibraryOS — Modern Library Management System

> A production-quality, full-stack library management platform built with **FastAPI + React**. Designed to look and feel like a premium SaaS product, not a college CRUD project.

![Tech Stack](https://img.shields.io/badge/FastAPI-0.111-green?style=flat-square) ![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan?style=flat-square) ![SQLite](https://img.shields.io/badge/SQLite-3-orange?style=flat-square)

---

## ✨ Features

### Core
- **Book Management** — Full CRUD with grid/list views, cover color coding, category filtering, ISBN validation
- **Borrower Management** — Member profiles with avatar initials, active borrow tracking
- **Borrow & Return Workflow** — Visual book/borrower selection, duplicate borrow prevention, automatic availability updates
- **Transaction History** — Filterable timeline with active/returned status, date tracking
- **Global Search** — Real-time debounced search across books and borrowers
- **Analytics Dashboard** — Stats cards, area charts, pie charts, recent activity feeds

### UI/UX
- Warm beige/brown/navy library-themed palette
- Glassmorphism cards and smooth Framer Motion animations
- Animated collapsible sidebar with tooltip labels
- Book cover placeholders with unique color coding per genre
- Loading skeletons for every data-loading state
- Empty state illustrations
- Toast notifications (success/error)
- Responsive layout — works on desktop, tablet, mobile
- Playfair Display headings + Inter body font

### Technical
- Modular FastAPI architecture (routers / crud / schemas / models / config)
- SQLAlchemy ORM with SQLite (WAL mode, FK enforcement)
- PostgreSQL-ready architecture — swap `DATABASE_URL` in `.env`
- Pydantic v2 validation with custom error messages
- Axios API service layer with interceptors
- Custom React hooks (`useBooks`, `useBorrowers`, `useDebounce`)
- Paginated API endpoints with sorting + filtering

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

---

## 🎨 Sample Data

Running `python seed.py` will populate the database with:
- **20 books** across 10 categories (Fiction, Sci-Fi, Fantasy, Technology, Business, Self-Help, etc.)
- **8 borrowers** with complete profiles
- **5 active borrowings** with various borrow dates
- **3 completed returns** for transaction history

---

## 🔮 Future Enhancements

- [ ] Dark mode toggle
- [ ] AI-powered semantic book search (vector embeddings)
- [ ] Book recommendation engine
- [ ] CSV/Excel export of transactions
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
