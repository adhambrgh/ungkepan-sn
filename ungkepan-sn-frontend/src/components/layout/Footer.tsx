import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { WhatsappLogo, MapPin, InstagramLogo } from '@phosphor-icons/react'
import { getSiteContent } from '../../api/client'

function GmailLogo({ size = 24, color = '#EA4335' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
        fill={color}
      />
    </svg>
  )
}

export default function Footer() {
  const [contact, setContact] = useState<any>(null)
  const [footer, setFooter] = useState<any>(null)

  useEffect(() => {
    getSiteContent('contact').then(setContact).catch(() => {})
    getSiteContent('footer').then((data) => {
      if (data) setFooter(data)
    }).catch(() => {})
  }, [])

  const c = contact || {}
  const f = footer || {}

  return (
    <footer className="bg-zinc-900 text-zinc-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.png" alt="Ungkepan SN" className="h-16 w-auto" />
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              {f.description || 'Jajanan rumahan enak, bersih, dan terpercaya.'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Menu</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Beranda</Link></li>
              <li><Link to="/products" className="hover:text-brand-400 transition-colors">Semua Produk</Link></li>
              <li><Link to="/about" className="hover:text-brand-400 transition-colors">Tentang Kami</Link></li>
              <li><Link to="/favorit" className="hover:text-brand-400 transition-colors">Favorit Saya</Link></li>
              <li><Link to="/contact" className="hover:text-brand-400 transition-colors">Kontak</Link></li>
              <li><Link to="/profil" className="hover:text-brand-400 transition-colors">Profil</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Kontak</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <WhatsappLogo size={18} weight="fill" className="text-[#EA580C] shrink-0" />
                <a
                  href={`https://wa.me/${c.whatsapp || '6281234567890'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-400 transition-colors"
                >
                  {c.whatsapp_display || '0812-3456-7890'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={18} weight="fill" className="text-[#EA580C] shrink-0" />
                <span>{c.location || 'Malang, Indonesia'}</span>
              </li>
              <li className="flex items-center gap-2">
                <GmailLogo size={18} color="#EA580C" />
                <a
                  href={`mailto:${c.email || 'ungkepansn@gmail.com'}`}
                  className="hover:text-brand-400 transition-colors"
                >
                  {c.email || 'ungkepansn@gmail.com'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <InstagramLogo size={18} weight="fill" className="text-[#EA580C] shrink-0" />
                <a
                  href="https://instagram.com/ungkepansn_malang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-400 transition-colors"
                >
                  @ungkepansn_malang
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-700 mt-8 pt-8 text-center text-xs text-zinc-500">
          {f.copyright ? f.copyright.replace('{year}', String(new Date().getFullYear())) : `\u00A9 ${new Date().getFullYear()} Ungkepan SN. Dibuat dengan sepenuh hati.`}
        </div>
      </div>
    </footer>
  )
}
