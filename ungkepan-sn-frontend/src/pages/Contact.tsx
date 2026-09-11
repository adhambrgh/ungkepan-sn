import { useEffect, useRef, useState } from 'react'
import { WhatsappLogo, MapPin, Clock, InstagramLogo } from '@phosphor-icons/react'
import { getSiteContent } from '../api/client'

function GmailLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function Contact() {
  const [content, setContent] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    getSiteContent('contact').then(setContent).catch(() => {})
  }, [])

  useEffect(() => {
    async function initMap() {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (!mapRef.current || mapInstance.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center: [number, number] = [-8.0315, 112.628]

      const map = L.map(mapRef.current, {
        center,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const marker = L.marker(center, { draggable: false }).addTo(map)
      markerRef.current = marker

      mapInstance.current = map
    }

    initMap()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  const c = content || {}

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-800 mb-3">
          Hubungi Kami
        </h1>
        <p className="text-zinc-500 text-base md:text-lg">
          {c.subtitle || 'Punya pertanyaan? Kami siap bantu.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 shrink-0">
              <WhatsappLogo size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 mb-1">WhatsApp</h3>
              <p className="text-zinc-500 text-sm mb-1">{c.whatsapp_label || 'Fast response, chat aja'}</p>
              <a
                href={`https://wa.me/${c.whatsapp || '6281234567890'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 font-semibold hover:underline text-base"
              >
                {c.whatsapp_display || '0812-3456-7890'}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 shrink-0">
              <MapPin size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 mb-1">Lokasi</h3>
              <p className="text-zinc-500 text-sm">{c.location || 'Jakarta, Indonesia'}</p>
              {c.plus_code && <p className="text-xs text-zinc-400">{c.plus_code}</p>}
              {c.location_note && (
                <p className="text-xs text-zinc-400 mt-1">{c.location_note}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 shrink-0">
              <GmailLogo size={24} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 mb-1">Email</h3>
              <a
                href={`mailto:${c.email || 'ungkepansn@email.com'}`}
                className="text-brand-600 font-semibold hover:underline text-base"
              >
                {c.email || 'ungkepansn@email.com'}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 shrink-0">
              <InstagramLogo size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 mb-1">Instagram</h3>
              <a
                href="https://instagram.com/ungkepansn_malang"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 font-semibold hover:underline text-base"
              >
                @ungkepansn_malang
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 shrink-0">
              <Clock size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 mb-1">Jam Operasional</h3>
              {c.hours_weekday && <p className="text-zinc-500 text-sm">{c.hours_weekday}</p>}
              {c.hours_weekend && <p className="text-zinc-500 text-sm">{c.hours_weekend}</p>}
              {!c.hours_weekday && !c.hours_weekend && (
                <>
                  <p className="text-zinc-500 text-sm">Senin - Sabtu: 08.00 - 20.00</p>
                  <p className="text-zinc-500 text-sm">Minggu: 09.00 - 17.00</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative bg-zinc-100 rounded-3xl overflow-hidden min-h-[300px] z-0">
          <div ref={mapRef} className="absolute inset-0 z-0" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]">
            {c.maps_url ? (
              <a
                href={c.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] shadow-lg transition-colors"
              >
                <MapPin size={16} />
                Buka Google Maps
              </a>
            ) : (
              <p className="text-xs text-zinc-600 bg-white/90 rounded-full px-4 py-2 shadow">
                {c.map_placeholder || c.location || 'Jakarta, Indonesia'}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
