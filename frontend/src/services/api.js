import axios from 'axios'

const BASE = 'http://localhost:8000/api/v1'

const api = axios.create({ baseURL: BASE, timeout: 15000, headers: { 'Content-Type': 'application/json' } })

api.interceptors.response.use(
  r => r,
  err => {
    console.error('[API]', err.response?.data?.detail || err.message)
    return Promise.reject(err)
  }
)

export const booksApi = {
  getAll: (p = {}) => api.get('/books', { params: p }),
  getById: (id) => api.get(`/books/${id}`),
  create: (d) => api.post('/books', d),
  update: (id, d) => api.put(`/books/${id}`, d),
  delete: (id) => api.delete(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
  getStats: () => api.get('/books/stats'),
  getRecent: (limit = 6) => api.get('/books/recent', { params: { limit } }),
}

export const borrowersApi = {
  getAll: (p = {}) => api.get('/borrowers', { params: p }),
  getById: (id) => api.get(`/borrowers/${id}`),
  create: (d) => api.post('/borrowers', d),
  update: (id, d) => api.put(`/borrowers/${id}`, d),
  delete: (id) => api.delete(`/borrowers/${id}`),
  getStats: () => api.get('/borrowers/stats'),
}

export const transactionsApi = {
  getAll: (p = {}) => api.get('/transactions', { params: p }),
  getById: (id) => api.get(`/transactions/${id}`),
  getRecent: (limit = 10) => api.get('/transactions/recent', { params: { limit } }),
  getStats: () => api.get('/transactions/stats'),
  borrowBook: (d) => api.post('/borrow', d),
  returnBook: (d) => api.post('/return', d),
}

export const searchApi = { search: (q, p = {}) => api.get('/search', { params: { q, ...p } }) }

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentTransactions: () => api.get('/dashboard/recent-transactions'),
  getRecentBooks: () => api.get('/dashboard/recent-books'),
}

export default api
