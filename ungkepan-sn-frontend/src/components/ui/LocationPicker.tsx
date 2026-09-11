import { useEffect, useRef, useState } from 'react'
import { MapPin, Crosshair, Spinner, CheckCircle } from '@phosphor-icons/react'

const MAP_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

interface LocationPickerProps {
  onLocationSelect: (data: {
    address: string
    city: string
    district: string
    province: string
    postcode: string
    lat: number
    lng: number
  }) => void
  defaultAddress?: string
  defaultCity?: string
}

export default function LocationPicker({ onLocationSelect, defaultAddress, defaultCity }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [center, setCenter] = useState<[number, number]>([-6.2088, 106.8456])

  const updateAddressDisplay = (address: string, city: string) => {
    setSelectedAddress(address)
    setSelectedCity(city)
  }

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

      const map = L.map(mapRef.current, {
        center,
        zoom: 12,
        zoomControl: true,
      })

      L.tileLayer(TILE_URL, { attribution: MAP_ATTR }).addTo(map)

      const marker = L.marker(center, { draggable: true }).addTo(map)
      markerRef.current = marker

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        reverseGeocode(e.latlng.lat, e.latlng.lng)
      })

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        reverseGeocode(pos.lat, pos.lng)
      })

      mapInstance.current = map
      setLoaded(true)
    }

    initMap()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!loaded || !defaultAddress) return
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(defaultAddress + ',' + defaultCity)}&limit=1&accept-language=id`)
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          mapInstance.current?.setView([lat, lon], 14)
          markerRef.current?.setLatLng([lat, lon])
          setCenter([lat, lon])
        }
      })
      .catch(() => {})
  }, [loaded, defaultAddress, defaultCity])

  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`
      )
      const data = await res.json()
      const addr = data.address || {}

      const road = addr.road || addr.pedestrian || addr.footway || ''
      const house = addr.house_number || ''
      const quarter = addr.neighbourhood || addr.quarter || ''
      const kelurahan = addr.suburb || addr.village || addr.hamlet || ''
      const rt = addr['addr:rt'] || addr.rt || addr['addr:rt_rw'] || addr.rt_rw || ''
      const city = addr.city || addr.town || addr.county || addr.state_district || addr.municipality || ''
      const province = addr.state || ''
      const district = addr.city_district || addr.town || addr.village || addr.suburb || addr.municipality || ''
      const postcode = addr.postcode || ''

      const addressParts = [house, road, kelurahan, quarter, rt, postcode].filter(Boolean)
      const fullAddress = addressParts.join(', ')
      const finalAddress = fullAddress || data.display_name || ''
      const finalCity = city || addr.state || ''
      const finalDistrict = district !== city ? district : ''
      const finalProvince = province || addr.country || ''

      updateAddressDisplay(finalAddress, finalCity)

      onLocationSelect({
        address: finalAddress,
        city: finalCity,
        district: finalDistrict,
        province: finalProvince,
        postcode,
        lat,
        lng,
      })
    } catch {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      updateAddressDisplay(fallback, '')
      onLocationSelect({
        address: fallback,
        city: '',
        district: '',
        province: '',
        postcode: '',
        lat,
        lng,
      })
    } finally {
      setResolving(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser kamu tidak mendukung fitur lokasi')
      return
    }

    setResolving(true)

    let best = { latitude: 0, longitude: 0, accuracy: Infinity }
    let readCount = 0
    let finalized = false

    const finalize = () => {
      if (finalized) return
      finalized = true
      navigator.geolocation.clearWatch(watchId)
      if (best.latitude === 0) {
        setResolving(false)
        alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.')
        return
      }
      const { latitude, longitude } = best
      mapInstance.current?.setView([latitude, longitude], 16)
      markerRef.current?.setLatLng([latitude, longitude])
      reverseGeocode(latitude, longitude)
      console.log('Akurasi posisi terbaik (meter):', Math.round(best.accuracy))
    }

    // Batasi waktu menunggu agar tidak lama
    const timeoutTimer = window.setTimeout(finalize, 6000)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        readCount += 1
        const acc = pos.coords.accuracy
        if (acc < best.accuracy) {
          best = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: acc }
        }
        // Akurasi sudah bagus dan sudah beberapa pembacaan -> selesaikan lebih awal
        if (acc <= 30 && readCount >= 3) {
          window.clearTimeout(timeoutTimer)
          finalize()
        }
      },
      () => {
        window.clearTimeout(timeoutTimer)
        navigator.geolocation.clearWatch(watchId)
        setResolving(false)
        alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="space-y-3">
      {/* Tombol Lokasi Saya */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={resolving}
        className="w-full flex items-center gap-3 py-2.5 px-3 bg-gradient-to-br from-brand-50 to-orange-50 border-2 border-brand-200 hover:border-brand-400 rounded-xl transition-all disabled:opacity-50 group"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white shrink-0 group-hover:scale-105 transition-transform">
          <Crosshair size={16} weight="fill" />
        </div>
        <div className="text-left">
          <span className="font-semibold text-zinc-800 text-sm">Gunakan Lokasi Saya</span>
          <p className="text-xs text-zinc-500 mt-0.5">Otomatis isi alamat dari posisi kamu sekarang</p>
        </div>
        {resolving && <Spinner size={18} className="animate-spin ml-auto shrink-0 text-brand-600" />}
      </button>

      {/* Peta */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <MapPin size={12} />
            Klik peta atau drag marker
          </div>
        </div>
        <div ref={mapRef} className="w-full h-64 rounded-xl border-2 border-zinc-200 overflow-hidden z-0" />
      </div>

      {/* Status / hasil */}
      {resolving && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl">
          <Spinner size={14} className="animate-spin shrink-0" />
          Mencari lokasi paling akurat...
        </div>
      )}
      {!resolving && selectedAddress && (
        <div className="flex items-start gap-2.5 text-xs text-green-700 bg-green-50 border border-green-200 p-3 rounded-xl">
          <CheckCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Alamat terdeteksi:</span>
            <p className="text-green-600 mt-0.5">{selectedAddress}{selectedCity ? `, ${selectedCity}` : ''}</p>
          </div>
        </div>
      )}
    </div>
  )
}
