import { useEffect, useState } from "react";
import {
  Phone,
  MapPin,
  Truck,
  CreditCard,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from "../../api/client";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";
import SuccessModal from "../../components/ui/SuccessModal";

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  shipping_method: string;
  payment_method: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processed: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
};

const statusColors: Record<string, string> = {
  pending: "text-amber-600",
  processed: "bg-blue-50 text-blue-600",
  shipped: "bg-orange-50 text-orange-600",
  completed: "bg-green-50 text-green-600",
};

const nextStatus: Record<string, string> = {
  pending: "processed",
  processed: "shipped",
  shipped: "completed",
  completed: "",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    code: string;
  } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    adminGetOrders(filter || undefined)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleStatus = async (id: number, status: string) => {
    try {
      await adminUpdateOrderStatus(id, status);
      fetchOrders();
      setSuccess(`Status pesanan diubah menjadi "${statusLabels[status]}"`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (id: number, code: string) => {
    setConfirmDelete({ id, code });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await adminDeleteOrder(confirmDelete.id);
      fetchOrders();
      setConfirmDelete(null);
      setSuccess("Pesanan berhasil dihapus");
    } catch (err: any) {
      setConfirmDelete(null);
      setError(err.message);
    }
  };

  const q = search.trim().toLowerCase();

  const filtered = orders.filter((o) => {
    const matchSearch = q
      ? o.customer_name.toLowerCase().includes(q) ||
        o.order_code.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.items.some((i) => i.product_name.toLowerCase().includes(q))
      : true;

    const orderDate = o.created_at.slice(0, 10); // 'YYYY-MM-DD'
    const matchFrom = dateFrom ? orderDate >= dateFrom : true;
    const matchTo = dateTo ? orderDate <= dateTo : true;

    return matchSearch && matchFrom && matchTo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">
              Pesanan
            </h1>
            <p className="text-zinc-500">{filtered.length} pesanan</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2.5 text-sm border border-zinc-200 rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-colors text-zinc-600"
              />
              <span className="text-zinc-400 text-sm">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2.5 text-sm border border-zinc-200 rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-colors text-zinc-600"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 px-2"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, kode, telepon..."
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-colors"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "processed", "shipped", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
                filter === s
                  ? "bg-[#EA580C] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {s ? statusLabels[s] : "Semua"}
            </button>
          ))}
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDelete !== null}
        title="Hapus Pesanan"
        message={`Yakin ingin menghapus pesanan "${confirmDelete?.code}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <SuccessModal
        open={success !== null}
        message={success || ""}
        onConfirm={() => setSuccess(null)}
      />

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-zinc-400">
          Memuat...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">Belum ada pesanan</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <div
              key={o.order_code}
              className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-zinc-400">
                    {new Date(o.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="font-bold text-zinc-800">{o.customer_name}</p>
                  <p className="text-xs text-zinc-400">{o.order_code}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[o.status] || ""}`}
                >
                  {statusLabels[o.status] || o.status}
                </span>
              </div>

              <div className="text-sm text-zinc-600 mb-3 space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <Phone size={14} className="text-zinc-400 shrink-0" />
                  {o.phone}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-zinc-400 shrink-0" />
                  {o.address}, {o.city}
                </p>
                <p className="flex items-center gap-1.5">
                  <Truck size={14} className="text-zinc-400 shrink-0" />
                  {o.shipping_method === "ambil"
                    ? "Ambil Langsung"
                    : o.shipping_method === "lokal"
                      ? "Lokal"
                      : o.shipping_method === "gosend"
                        ? "GoSend"
                        : o.shipping_method === "jne"
                          ? "JNE"
                          : o.shipping_method === "jnt"
                            ? "J&T"
                            : o.shipping_method}
                  <span className="text-zinc-300 mx-1">|</span>
                  <CreditCard size={14} className="text-zinc-400 shrink-0" />
                  {o.payment_method}
                </p>
                {o.notes && (
                  <p className="text-zinc-400 italic flex items-center gap-1.5">
                    <span className="text-zinc-300">—</span> {o.notes}
                  </p>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-3 mb-3 space-y-1">
                {o.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-600">
                      {item.product_name}{" "}
                      <span className="text-zinc-400">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      Rp{" "}
                      {(item.product_price * item.quantity).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {nextStatus[o.status] && (
<button
                       onClick={() => handleStatus(o.id, nextStatus[o.status])}
                       className="px-4 sm:px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-[8px] transition-colors"
                     >
                       Ubah ke {statusLabels[nextStatus[o.status]]}
                     </button>
                  )}
                  <button
                    onClick={() => handleDelete(o.id, o.order_code)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 text-sm font-semibold text-red-500 border-2 border-red-200 rounded-[8px] hover:bg-red-50 transition-colors"
                  >
                    <Trash size={16} weight="bold" />
                    Hapus
                  </button>
                </div>
                <p className="font-bold text-brand-600 text-lg shrink-0">
                  Rp {o.total.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
