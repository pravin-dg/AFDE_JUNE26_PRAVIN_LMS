import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Books from './pages/Books'
import Borrowers from './pages/Borrowers'
import BorrowReturn from './pages/BorrowReturn'
import Transactions from './pages/Transactions'
import Search from './pages/Search'
import Analytics from './pages/Analytics'
import ETLManager from './pages/ETLManager'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#FDF8F0', color: '#2D1F0F', border: '1px solid #E6B168', fontFamily: 'Inter', fontSize: '14px' },
        success: { iconTheme: { primary: '#2D6A4F', secondary: '#FDF8F0' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#FDF8F0' } },
      }} />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="borrowers" element={<Borrowers />} />
          <Route path="borrow-return" element={<BorrowReturn />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="search" element={<Search />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="etl-manager" element={<ETLManager />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppProvider>
  )
}
