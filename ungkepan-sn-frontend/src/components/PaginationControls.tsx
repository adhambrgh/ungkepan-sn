import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  disabledPrev?: boolean
  disabledNext?: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  disabledPrev = false,
  disabledNext = false,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center gap-1 text-sm text-zinc-600">
      <button
        onClick={onPrev}
        disabled={currentPage === 0 || disabledPrev}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft size={16} /> Sebelumnya
      </button>
      <span className="px-2">Halaman {currentPage + 1} dari {totalPages}</span>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages - 1 || disabledNext}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Berikutnya <ArrowRight size={16} />
      </button>
    </div>
  )
}