import { useState, useEffect, useCallback } from 'react'
import { booksApi } from '../services/api'
import toast from 'react-hot-toast'

export function useBooks(initialParams = {}) {
  const [books, setBooks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState({ skip: 0, limit: 20, ...initialParams })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const r = await booksApi.getAll(params)
      setBooks(r.data.items)
      setTotal(r.data.total)
    } catch (e) {
      toast.error('Failed to load books')
    } finally { setLoading(false) }
  }, [params])

  useEffect(() => { fetch() }, [fetch])

  const createBook = async (data) => {
    const r = await booksApi.create(data)
    toast.success(`"${r.data.title}" added!`)
    fetch()
    return r.data
  }
  const updateBook = async (id, data) => {
    const r = await booksApi.update(id, data)
    toast.success(`"${r.data.title}" updated!`)
    fetch()
    return r.data
  }
  const deleteBook = async (id, title) => {
    await booksApi.delete(id)
    toast.success(`"${title}" deleted!`)
    fetch()
  }
  return { books, total, loading, params, setParams, refetch: fetch, createBook, updateBook, deleteBook }
}
