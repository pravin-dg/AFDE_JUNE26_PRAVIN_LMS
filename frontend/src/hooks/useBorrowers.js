import { useState, useEffect, useCallback } from 'react'
import { borrowersApi } from '../services/api'
import toast from 'react-hot-toast'

export function useBorrowers(initialParams = {}) {
  const [borrowers, setBorrowers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState({ skip: 0, limit: 20, ...initialParams })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const r = await borrowersApi.getAll(params)
      setBorrowers(r.data.items)
      setTotal(r.data.total)
    } catch { toast.error('Failed to load borrowers') }
    finally { setLoading(false) }
  }, [params])

  useEffect(() => { fetch() }, [fetch])

  const createBorrower = async (d) => { const r = await borrowersApi.create(d); toast.success(`${r.data.borrower_name} added!`); fetch(); return r.data }
  const updateBorrower = async (id, d) => { const r = await borrowersApi.update(id, d); toast.success(`${r.data.borrower_name} updated!`); fetch(); return r.data }
  const deleteBorrower = async (id, name) => { await borrowersApi.delete(id); toast.success(`${name} deleted!`); fetch() }

  return { borrowers, total, loading, params, setParams, refetch: fetch, createBorrower, updateBorrower, deleteBorrower }
}
