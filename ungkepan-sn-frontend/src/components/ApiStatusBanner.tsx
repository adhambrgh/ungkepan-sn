import { useEffect, useState } from 'react'
import { WifiSlash, WarningCircle } from '@phosphor-icons/react'
import { isApiAvailable, checkApi, onApiStatusChange, getApiBase } from '../api/client'

export default function ApiStatusBanner() {
  const [apiOk, setApiOk] = useState(true)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    isApiAvailable().then(setApiOk)
    const off = onApiStatusChange(setApiOk)
    return off
  }, [])

  if (apiOk) return null

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm text-amber-800 bg-amber-100 border-b border-amber-200">
        <WifiSlash size={16} weight="bold" />
        <span>Terputus dari database — menampilkan data sementara. Mencoba menyambungkan ulang...</span>
        <button
          onClick={async () => {
            setRetrying(true)
            const ok = await checkApi(true)
            setApiOk(ok)
            setRetrying(false)
          }}
          disabled={retrying}
          className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50 transition-colors"
        >
          <WarningCircle size={14} weight="fill" />
          {retrying ? 'Mencoba...' : 'Coba lagi'}
        </button>
        <span className="hidden md:inline text-amber-600">({getApiBase()})</span>
      </div>
    </div>
  )
}