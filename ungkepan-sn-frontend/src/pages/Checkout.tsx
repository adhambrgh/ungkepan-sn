import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  MapPin,
  X,
  User,
  Truck,
  Bank,
  PaperPlaneTilt,
  CaretDown,
  AddressBook as AddressBookIcon,
  Storefront,
  Motorcycle,
} from "@phosphor-icons/react"
import { useCartStore } from "../store/cartStore"
import { useAuthStore } from "../store/authStore"
import { createOrder, getPaymentMethods, getSiteContent, resolveImage, getAddresses, useCustomerPromo, getOrderSnapToken, loadSnapScript, payWithSnap } from "../api/client"
import type { PaymentMethod, UserAddress } from "../api/client"
import LocationPicker from "../components/ui/LocationPicker"
import PaymentSelector from "../components/ui/PaymentSelector"

const checkoutSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(10, "Nomor HP minimal 10 angka").max(15),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  city: z.string().min(1, "Kota wajib diisi"),
  notes: z.string().optional(),
  shipping: z.string().min(1, "Pilih pengiriman"),
  payment: z.string().min(1, "Pilih pembayaran"),
})

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <h2 className="text-lg font-extrabold text-zinc-800">{title}</h2>
    </div>
  )
}

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function Checkout() {
  const { items, getTotal, getSubtotal, discount, discountInfo, clearCart, addOrder } = useCartStore()
  const selectedItems = items.filter((i) => i.selected)
  const authUser = useAuthStore((s) => s.user)
  const authToken = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [midtransLoading, setMidtransLoading] = useState(false)
  const [pendingSnapToken, setPendingSnapToken] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [showQrisModal, setShowQrisModal] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const [lastOrder, setLastOrder] = useState<{
  orderCode: string
  customerName: string
  phone: string
  address: string
  city: string
  payment: string
  shipping: string
  shippingLabel: string
  shippingCost: number
  total: number
  items: Array<{
    product: { name: string; price: number }
    quantity: number
  }>
} | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping: "",
      payment: "",
      name: authUser?.name || "",
      phone: authUser?.phone || "",
    },
  })

  const selectedPaymentId = watch("payment")
  const selectedShipping = watch("shipping")

  const [shippingConfig, setShippingConfig] = useState<{
  store_lat: number
  store_lng: number
  free_shipping_min: number
  cost_per_km: number
  max_distance: number
  label: string
} | null>(null)
  const [shippingMethods, setShippingMethods] = useState<Array<{
  value: string
  label: string
  desc: string
  cost: number
  is_active: boolean
}>>([])
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [addrOpen, setAddrOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)

  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  useEffect(() => {
    if (authToken) {
      getAddresses()
        .then((res) => setSavedAddresses(res.addresses || []))
        .catch(() => {})
    }
  }, [authToken])

  const applyAddress = (a: UserAddress) => {
    setSelectedAddress(a)
    setAddrOpen(false)
    if (a.name) setValue("name", a.name)
    if (a.phone) setValue("phone", a.phone)
    setValue("address", a.address)
    if (a.city) setValue("city", a.city)
    if (a.latitude && a.longitude) {
      setUserLatLng({ lat: a.latitude, lng: a.longitude })
    }
  }

  const formatAddress = (a: UserAddress): string => {
    const parts: string[] = []
    if (a.address) parts.push(a.address)
    if (a.rt_rw) parts.push(a.rt_rw)
    if (a.patokan) parts.push(`(${a.patokan})`)
    if (a.district) parts.push(`Kec. ${a.district}`)
    if (a.city) parts.push(a.city)
    if (a.province) parts.push(a.province)
    if (a.postal_code) parts.push(a.postal_code)
    return parts.join(", ")
  }

  useEffect(() => {
    getPaymentMethods().then(setPaymentMethods).catch(() => {})
    getSiteContent("shipping").then(setShippingConfig).catch(() => {})
    getSiteContent("shipping_methods").then((data) => {
      if (data) setShippingMethods(data.filter((m: { is_active: boolean }) => m.is_active))
    }).catch(() => {})
  }, [])

  const distance = userLatLng && shippingConfig
    ? calcDistance(
        shippingConfig!.store_lat,
        shippingConfig!.store_lng,
        userLatLng!.lat,
        userLatLng!.lng
      )
    : null

  const getShippingCost = (methodValue: string): number => {
    if (!methodValue) return 0
    if (methodValue === "lokal") {
      if (!distance || !shippingConfig) return 0
      if (shippingConfig!.free_shipping_min > 0 && getTotal() >= shippingConfig!.free_shipping_min) return 0
      return Math.round(distance * shippingConfig!.cost_per_km)
    }
    const m = shippingMethods.find((m) => m.value === methodValue)
    return m?.cost || 0
  }

  const isFreeShipping = (shippingConfig?.free_shipping_min ?? 0) > 0 && getTotal() >= (shippingConfig?.free_shipping_min ?? 0)
  const selectedShippingCost = selectedShipping ? getShippingCost(selectedShipping) : 0

  const shippingMethodList = (() => {
    let methods: Array<{
      value: string
      label: string
      desc: string
      cost: number
      disabled: boolean
    }> = []

    if (shippingMethods.length > 0) {
      methods = shippingMethods.map((m) => ({
        value: m.value,
        label: m.label,
        desc: m.desc || "",
        cost: Number(m.cost) || 0,
        disabled: false,
      }))
    } else {
      methods = [
        { value: "jne", label: "JNE Reguler", desc: "2-3 hari kerja", cost: 0, disabled: false },
        { value: "jnt", label: "J&T Express", desc: "1-2 hari kerja", cost: 0, disabled: false },
        { value: "gosend", label: "GoSend (Jabodetabek)", desc: "Hari ini sampai", cost: 0, disabled: false },
        { value: "ambil", label: "Ambil Langsung", desc: "Ke rumah Mamak", cost: 0, disabled: false },
      ]
    }

    if (shippingConfig) {
      const tooFar = distance && distance > (shippingConfig.max_distance || 20)
      const cost = !distance ? 0 : Math.round(distance * (shippingConfig.cost_per_km || 0))
      const finalCost = isFreeShipping ? 0 : cost

      let desc = ""
      if (!distance) {
        desc = "Pilih lokasi di peta dulu"
      } else if (tooFar) {
        desc = `${distance.toFixed(1)} km — melebihi jarak maksimal ${shippingConfig.max_distance} km`
      } else if (isFreeShipping) {
        desc = `${distance.toFixed(1)} km — GRATIS ONGKIR`
      } else {
        desc = `${distance.toFixed(1)} km — Rp ${finalCost.toLocaleString("id-ID")} (Rp ${(shippingConfig.cost_per_km || 5000).toLocaleString("id-ID")}/km)`
      }

      methods.push({
        value: "lokal",
        label: shippingConfig.label || "Lokal (Ongkir berdasarkan jarak)",
        desc,
        cost: finalCost,
        disabled: !!tooFar,
      })
    }

    return methods
  })()

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(""), 2000)
  }

  const qrisMethod = paymentMethods.find((p) => p.method === "qris" && p.is_active)

  const onSubmit = async (data: CheckoutForm) => {
    // Kalau sudah ada pending snap token, buka ulang popup (retry)
    if (pendingSnapToken) {
      setMidtransLoading(true)
      try {
        await loadSnapScript()
        setMidtransLoading(false)
        payWithSnap(pendingSnapToken, {
          onSuccess: () => {
            clearCart()
            setPendingSnapToken(null)
            setSubmitted(true)
          },
          onPending: () => {},
          onError: () => {},
          onClose: () => {},
        })
      } catch {
        setMidtransLoading(false)
      }
      return
    }

setSubmitting(true)
    try {
      const payMethod = paymentMethods.find((p) => String(p.id) === data.payment)
      const payLabel = payMethod?.label || data.payment
      const isCod =
        payMethod?.method === "cod" || /cod|bayar di tempat|cash/i.test(payLabel)
      const isMidtrans =
        !isCod &&
        (payMethod?.method === "midtrans" || /midtrans|snap|online/i.test(payLabel))

      const res = await createOrder({
        customer_name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        notes: data.notes || "",
        shipping_method: data.shipping,
        payment_method: payLabel,
        total: getTotal(),
        discount,
        promo_code: discountInfo?.code || null,
        items: selectedItems.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          product_price: i.product.price,
          quantity: i.quantity,
        })),
      })
      const orderCode = res.order_code
      if (discountInfo?.code) {
        useCustomerPromo(discountInfo.code, orderCode).catch(() => {})
      }
      addOrder({
        id: orderCode,
        items: [...selectedItems],
        total: getTotal(),
        customerName: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        notes: data.notes || "",
        shippingMethod: data.shipping,
        paymentMethod: payLabel,
        status: "pending",
        createdAt: new Date().toISOString(),
      })
      const finalTotal = getTotal()
      const finalItems = [...selectedItems]
      const selMethod = shippingMethods.find((m) => m.value === data.shipping)
      const shippingLabel = data.shipping === "lokal"
        ? (shippingConfig?.label || "Lokal (Ongkir berdasarkan jarak)")
        : (selMethod?.label || data.shipping)
      setLastOrder({
        orderCode,
        customerName: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        payment: payLabel,
        shipping: data.shipping,
        shippingLabel,
        shippingCost: getShippingCost(data.shipping),
        total: finalTotal,
        items: finalItems,
      })

      setOrderId(orderCode)

      if (isMidtrans) {
        setMidtransLoading(true)
        try {
          const tokenRes = await getOrderSnapToken(orderCode)
          const token = tokenRes.snap_token
          await loadSnapScript()
          setPendingSnapToken(token)
          setMidtransLoading(false)

          const openSnap = () => {
            payWithSnap(token, {
              onSuccess: () => {
                // Berhasil → bersihkan cart, tampilkan struk
                clearCart()
                setSubmitted(true)
              },
              onPending: () => {},
              onError: () => {},
              onClose: () => {
                // Cancel → tetap di checkout, form masih utuh
                // User bisa klik "Buat Pesanan" lagi untuk retry
              },
            })
          }

          setTimeout(openSnap, 100)
        } catch (e) {
          setMidtransLoading(false)
          const message = e instanceof Error ? e.message : "Popup pembayaran belum siap"
          alert("Pembayaran online gagal dimuat: " + message)
        }
        return
      }

      // Non-Midtrans (COD): langsung ke halaman sukses
      clearCart()
      setPendingSnapToken(null)
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Coba lagi"
      alert("Gagal membuat pesanan: " + message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!authToken && items.length > 0) {
    return <Navigate to="/login?redirect=/checkout" replace />
  }

  if (selectedItems.length === 0 && !submitted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-xl text-zinc-400 mb-4">Belum ada produk yang dipilih</p>
        <Link to="/cart" className="text-brand-600 font-semibold">
          Kembali ke Keranjang dan centang produk
        </Link>
      </main>
    )
  }

  if (submitted) {
    const isCod = /cod|bayar di tempat|cash/i.test(lastOrder?.payment || "")

    return (
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-800 mb-2">
            Pesanan Berhasil!
          </h1>
          <p className="text-zinc-500">
            Nomor pesanan: <strong className="text-brand-600">{orderId}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-6 mb-6 max-w-md mx-auto font-mono text-sm">
          <div className="text-center mb-4 border-b border-dashed border-zinc-200 pb-4">
            <p className="font-bold text-base text-zinc-800">UNGKEPAN SN</p>
            <p className="text-zinc-400 text-xs">Olahan Rumah Terpercaya</p>
          </div>

          <div className="flex justify-between text-zinc-500 mb-3 text-xs">
            <span>#{lastOrder!.orderCode}</span>
            <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <div className="border-t border-dashed border-zinc-200 pt-3 mb-3 space-y-1.5">
            {lastOrder!.items.map((item: { product: { name: string; price: number }; quantity: number }, i: number) => (
              <div key={i} className="flex justify-between text-zinc-700">
                <span className="truncate max-w-[60%]">{item.product.name}</span>
                <span className="shrink-0">{item.quantity} x Rp {item.product.price.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-zinc-800 pt-2 flex justify-between font-bold text-zinc-800">
            <span>TOTAL</span>
            <span>Rp {(lastOrder!.total + (lastOrder!.shippingCost || 0)).toLocaleString("id-ID")}</span>
          </div>
          {lastOrder!.shippingCost > 0 && (
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Termasuk ongkir</span>
              <span>Rp {lastOrder!.shippingCost.toLocaleString("id-ID")}</span>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-dashed border-zinc-200 text-xs text-zinc-500 space-y-0.5">
            <p>Pembayaran: {lastOrder!.payment}</p>
            <p>Pengiriman: {lastOrder!.shippingLabel}</p>
            {lastOrder!.shipping === "lokal" && <p>Jarak: {distance?.toFixed(1)} km</p>}
            <p>Alamat: {lastOrder!.address}, {lastOrder!.city}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {isCod ? (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center mb-4">
              <p className="text-sm text-zinc-700 font-semibold">Bayar di Tempat (COD)</p>
              <p className="text-xs text-zinc-500 mt-1">
                Siapkan uang tunai sesuai total tagihan saat pesanan tiba.
              </p>
            </div>
          ) : (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center mb-4">
              <p className="text-sm text-zinc-700 font-semibold">Pembayaran Online</p>
              <p className="text-xs text-zinc-500 mt-1">
                Pembayaran diproses lewat popup Midtrans. Lanjutkan sesuai metode yang kamu pilih.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <div className="flex gap-3 w-full">
            <Link
              to="/profil?tab=pesanan"
              className="flex-1 px-6 py-3 text-sm font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-[8px] transition-colors text-center"
            >
              Pesanan Saya
            </Link>
            <Link
              to="/products"
              className="flex-1 px-6 py-3 text-sm font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-[8px] transition-colors text-center"
            >
              Belanja Lagi
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Checkout</h1>
          <p className="text-zinc-500 text-sm md:text-base">Konfirmasi pesanan Anda</p>
        </div>
        <Link to="/cart" className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm">
          <ArrowLeft size={18} /> Kembali ke Keranjang
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        const fieldOrder = ['name', 'phone', 'city', 'address', 'shipping', 'payment']
        for (const field of fieldOrder) {
          if (errors[field as keyof typeof errors]) {
            const el = document.querySelector(`[name="${field}"]`)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              ;(el as HTMLElement).focus()
            }
            break
          }
        }
      })}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <SectionHeading icon={<User size={17} weight="fill" />} title="Data Pembeli" />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Nama Lengkap</label>
                <input
                  {...register("name")}
                  className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                  placeholder="Masukkan nama Anda"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Nomor WhatsApp</label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                  placeholder="Contoh: 08123456789"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <SectionHeading icon={<MapPin size={17} weight="fill" />} title="Alamat Pengiriman" />
            <div className="mt-6 space-y-5">
              {savedAddresses.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">
                    Alamat Tersimpan
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddrOpen((v) => !v)}
                    className="mt-2 w-full flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm text-left outline-none focus:border-brand-500 transition-colors bg-white"
                  >
                    {selectedAddress ? (
                      <span className="text-zinc-800 min-w-0">
                        <span className="font-semibold">{selectedAddress.label}{selectedAddress.name ? ` · ${selectedAddress.name}` : ''}</span>
                        <span className="block text-zinc-500 text-xs mt-0.5 leading-snug">{formatAddress(selectedAddress)}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">Pilih alamat tersimpan...</span>
                    )}
                    <CaretDown size={16} className={`text-zinc-400 shrink-0 transition-transform ${addrOpen ? "rotate-180" : ""}`} />
                  </button>
                  {addrOpen && (
                    <div className="mt-2 rounded-xl border border-black/10 overflow-hidden divide-y divide-black/5 bg-white">
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applyAddress(a)}
                          className="w-full px-4 py-3 text-left hover:bg-brand-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <AddressBookIcon size={15} className="text-brand-600 shrink-0" />
                            <span className="font-semibold text-sm text-zinc-800">{a.label}</span>
                            {a.is_default && (
                              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-md uppercase">Utama</span>
                            )}
                            {a.name && <span className="text-xs text-zinc-500">· {a.name}</span>}
                            {a.phone && <span className="text-xs text-zinc-400">📞 {a.phone}</span>}
                          </div>
                          <span className="block text-xs text-zinc-600 mt-1 leading-relaxed">{formatAddress(a)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Kota / Kabupaten</label>
                <input
                  {...register("city")}
                  className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                  placeholder="Jakarta, Bogor, dll"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={15} className="text-brand-600" />
                  <span className="text-sm font-bold text-zinc-700">Pilih Lokasi di Peta</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Geser / klik pin pada peta untuk akurasi lokasi pengiriman.
                </p>
                <LocationPicker
                  onLocationSelect={(data) => {
                    setSelectedAddress(null)
                    setValue("address", data.address)
                    setValue("city", data.city)
                    setUserLatLng({ lat: data.lat, lng: data.lng })
                  }}
                  defaultAddress={selectedAddress?.address || undefined}
                  defaultCity={selectedAddress?.city || undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Alamat Lengkap</label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors resize-none placeholder:text-zinc-400"
                  placeholder="Nama jalan, gedung, no. rumah, RT/RW, kode pos"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <SectionHeading icon={<Truck size={17} weight="fill" />} title="Metode Pengiriman" />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shippingMethodList.map((s) => {
                const shippingIcon = s.value === "ambil" ? <Storefront size={18} /> : s.value === "lokal" ? <Motorcycle size={18} /> : <Truck size={18} />

    return (
                  <label
                    key={s.value}
                    className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col gap-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/50 transition-all bg-white ${
                      s.disabled ? "border-red-200 bg-red-50 opacity-60" : "border-zinc-200 hover:border-brand-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        {shippingIcon}
                      </span>
                      <input
                        type="radio"
                        value={s.value}
                        {...register("shipping")}
                        className="w-5 h-5 shrink-0 appearance-none rounded-full border-[3px] border-zinc-300 checked:border-brand-600 checked:bg-brand-600 checked:shadow-[0_0_0_3px_rgba(234,88,12,0.15)] transition-all"
                        disabled={s.disabled}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-zinc-800">{s.label}</p>
                        {!s.disabled && s.cost > 0 && (
                          <span className="font-bold text-sm text-zinc-700 shrink-0">
                            Rp {s.cost.toLocaleString("id-ID")}
                          </span>
                        )}
                        {!s.disabled && s.cost === 0 && s.value === "lokal" && distance && (
                          <span className="font-bold text-sm text-green-600 shrink-0">GRATIS</span>
                        )}
                      </div>
                      <p className={`mt-1 text-xs leading-relaxed ${s.disabled ? "text-red-500" : "text-zinc-500"}`}>
                        {s.desc}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
            {errors.shipping && <p className="text-red-500 text-sm mt-1">{errors.shipping.message}</p>}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <SectionHeading icon={<Bank size={17} weight="fill" />} title="Metode Pembayaran" />
            <div className="mt-5">
              <PaymentSelector
                paymentMethods={paymentMethods}
                selectedPaymentId={selectedPaymentId}
                onSelect={(id) => setValue("payment", id)}
                copiedText={copiedText}
                onCopy={handleCopy}
                showQrisModal={showQrisModal}
                setShowQrisModal={setShowQrisModal}
                qrisMethod={qrisMethod}
              />
            </div>
            {errors.payment && <p className="text-red-500 text-sm mt-1">{errors.payment.message}</p>}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-700">Catatan Pesanan</label>
              <span className="text-xs text-zinc-400">Opsional</span>
            </div>
            <textarea
              {...register("notes")}
              rows={3}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors resize-none placeholder:text-zinc-400"
              placeholder="Pesan tambahan untuk Mamak atau kurir..."
            />
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 bg-white rounded-2xl p-6 sm:p-7">
          <h2 className="text-lg font-extrabold text-zinc-800">Ringkasan Pesanan</h2>

          <div className="mt-5 rounded-2xl border border-brand-100 bg-orange-50/50 p-4">
            <ul className="space-y-4">
              {selectedItems.map((item) => (
                <li key={item.product.id} className="flex gap-3">
                  {item.product.image ? (
                    <img
                      src={resolveImage(item.product.image)}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-brand-600 shrink-0">
                      <PaperPlaneTilt size={22} />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-zinc-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.quantity} x Rp {item.product.price.toLocaleString("id-ID")}</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 shrink-0">
                    Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-5 border-t border-dashed border-black/10 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Subtotal Produk</span>
              <span className="font-semibold text-zinc-800">Rp {getSubtotal().toLocaleString("id-ID")}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">
                  Diskon{discountInfo?.type === "percent" ? ` (${discountInfo.value}%)` : ""}
                  {discountInfo?.code ? ` · ${discountInfo.code}` : ""}
                </span>
                <span className="font-semibold text-brand-600">-Rp {discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Ongkos Kirim</span>
              <span className={`font-semibold ${selectedShippingCost > 0 ? "text-zinc-800" : "text-green-600"}`}>
                {selectedShippingCost > 0
                  ? `Rp ${selectedShippingCost.toLocaleString("id-ID")}`
                  : "Gratis"}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-black/10 flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-800">Total Tagihan :</span>
            <span className="text-2xl font-extrabold text-brand-600">
              Rp {(getTotal() + selectedShippingCost).toLocaleString("id-ID")}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full items-center justify-center py-3 px-6 text-sm font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors disabled:bg-zinc-300"
          >
            {submitting ? "Mengirim..." : pendingSnapToken ? "Bayar Lagi" : "Buat Pesanan"}
          </button>
          <p className="mt-3 text-xs text-center text-zinc-400">
            Dengan membuat pesanan, kamu setuju dengan syarat & ketentuan Ungkepan SN.
          </p>
        </aside>

      </div>
      </form>

      {showQrisModal && qrisMethod?.qris_image && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowQrisModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-zinc-800">Scan QRIS</h3>
              <button
                type="button"
                onClick={() => setShowQrisModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={resolveImage(qrisMethod.qris_image)}
              alt="QRIS"
              className="w-full aspect-square object-contain rounded-xl"
            />
            <p className="text-center text-sm text-zinc-500 mt-4">
              Scan menggunakan aplikasi pembayaran (GoPay, OVO, DANA, Mobile Banking, dll)
            </p>
          </div>
        </div>
      )}

      {midtransLoading && (
        <div className="fixed inset-0 z-[60] bg-white/90 flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
          <p className="mt-4 font-semibold text-zinc-700">Menyiapkan pembayaran online...</p>
          <p className="text-sm text-zinc-400 text-center mt-1">
            Popup pembayaran akan terbuka. Jika tidak muncul, pastikan pop-up diizinkan di browser.
          </p>
        </div>
      )}
    </main>
  )
}