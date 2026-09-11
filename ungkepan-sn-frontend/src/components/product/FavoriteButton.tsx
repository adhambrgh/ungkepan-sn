import { useState } from 'react'
import { Heart } from '@phosphor-icons/react'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useAuthStore } from '../../store/authStore'
import LoginPrompt from '../ui/LoginPrompt'

type Props = {
  id: string
  className?: string
}

export default function FavoriteButton({ id, className = '' }: Props) {
  const isFavorite = useFavoritesStore((s) => s.ids.includes(id))
  const toggle = useFavoritesStore((s) => s.toggle)
  const authToken = useAuthStore((s) => s.token)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!authToken) {
      setShowLoginPrompt(true)
      return
    }
    toggle(id)
  }

  return (
    <>
      <button
        type="button"
        aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        title={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        onClick={handleClick}
        className={`flex items-center justify-center w-9 h-9 rounded-full bg-white/50 backdrop-blur-sm shadow-md hover:scale-110 active:scale-90 transition-all ${className}`}
      >
        <Heart
          size={18}
          weight={isFavorite ? 'fill' : 'regular'}
          className={isFavorite ? 'text-brand-600' : 'text-zinc-600'}
        />
      </button>
      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirect="/favorit"
        context="simpan favorit"
      />
    </>
  )
}
