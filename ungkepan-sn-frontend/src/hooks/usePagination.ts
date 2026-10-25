import { useState, useEffect } from 'react'

export interface UsePaginationResult<T> {
  currentPage: number
  setCurrentPage: (page: number) => void
  animating: boolean
  setAnimating: (v: boolean) => void
  totalPages: number
  currentPageClamped: number
  pageData: T[]
  goPrev: () => void
  goNext: () => void
}

export function usePagination<T>(
  items: T[],
  itemsPerPage = 10,
  deps: any[] = []
): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(0)
  const [animating, setAnimating] = useState(false)

  const totalPages = Math.ceil(items.length / itemsPerPage) || 1
  const currentPageClamped = Math.min(Math.max(currentPage, 0), totalPages - 1)
  const startIdx = currentPageClamped * itemsPerPage
  const pageData = items.slice(startIdx, startIdx + itemsPerPage)

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPageClamped > 0) {
        setAnimating(true)
        setCurrentPage(p => Math.max(0, p - 1))
        setTimeout(() => setAnimating(false), 300)
      }
      if (e.key === 'ArrowRight' && currentPageClamped < totalPages - 1) {
        setAnimating(true)
        setCurrentPage(p => Math.min(totalPages - 1, p + 1))
        setTimeout(() => setAnimating(false), 300)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPageClamped, totalPages])

  useEffect(() => {
    setCurrentPage(0)
  }, deps)

  const goPrev = () => {
    if (currentPageClamped > 0) {
      setAnimating(true)
      setCurrentPage(p => Math.max(0, p - 1))
      setTimeout(() => setAnimating(false), 300)
    }
  }

  const goNext = () => {
    if (currentPageClamped < totalPages - 1) {
      setAnimating(true)
      setCurrentPage(p => Math.min(totalPages - 1, p + 1))
      setTimeout(() => setAnimating(false), 300)
    }
  }

  return {
    currentPage,
    setCurrentPage,
    animating,
    setAnimating,
    totalPages,
    currentPageClamped,
    pageData,
    goPrev,
    goNext,
  }
}