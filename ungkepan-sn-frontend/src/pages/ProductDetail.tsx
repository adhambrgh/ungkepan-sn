import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Star,
  PaperPlaneRight,
  User,
  Heart,
} from "@phosphor-icons/react";
import {
  getProduct,
  getProducts,
  getProductReviews,
  submitReview,
  getMyOrders,
  resolveImage,
} from "../api/client";
import { subscribeStock } from "../lib/stockStream";
import type { Product, Review } from "../types";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useFavoritesStore } from "../store/favoritesStore";
import LoginPrompt from "../components/ui/LoginPrompt";
import FavoriteButton from "../components/product/FavoriteButton";
import AddToCartButton from "../components/product/AddToCartButton";
import BuyNowButton from "../components/product/BuyNowButton";

const cleanProductName = (name: string): string => {
  const words = name.split(" ");
  const cleaned: string[] = [];
  words.forEach((word) => {
    if (
      cleaned.length === 0 ||
      cleaned[cleaned.length - 1].toLowerCase() !== word.toLowerCase()
    ) {
      cleaned.push(word);
    }
  });
  return cleaned.join(" ");
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const authToken = useAuthStore((s) => s.token);
  const authUser = useAuthStore((s) => s.user);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const favIds = useFavoritesStore((s) => s.ids);
  const cartItem = items.find((i) => i.product.id === id);
  const quantity = cartItem?.quantity || 0;
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState({ name: "", rating: 5, review: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [purchaseChecked, setPurchaseChecked] = useState(false);
  const [promptProduct, setPromptProduct] = useState<Product | null>(null);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      id ? getProduct(id) : Promise.resolve(null),
      getProducts(),
      id ? getProductReviews(id) : Promise.resolve([]),
    ]).then(([prod, prods, revs]) => {
      setProduct(prod);
      setProducts(prods);
      setReviews(revs);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (authUser?.name) {
      setForm((f) => ({ ...f, name: authUser!.name }));
    }
  }, [authUser]);

  useEffect(() => {
    return subscribeStock((stocks) => {
      setProduct((prev) =>
        prev && stocks[prev.id] !== undefined
          ? { ...prev, stock: stocks[prev.id] }
          : prev,
      );
      setProducts((prev) =>
        prev.map((p) =>
          stocks[p.id] !== undefined ? { ...p, stock: stocks[p.id] } : p,
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (!authToken || !id) {
      setPurchased(false);
      setPurchaseChecked(true);
      return;
    }
    let active = true;
    getMyOrders()
      .then((orders: any[]) => {
        if (!active) return;
        const eligible = (orders || []).some(
          (o) =>
            ["completed", "shipped", "processed"].includes(o.status) &&
            (o.items || []).some(
              (it: any) => String(it.product_id) === String(id),
            ),
        );
        setPurchased(eligible);
        setPurchaseChecked(true);
      })
      .catch(() => {
        if (active) {
          setPurchased(false);
          setPurchaseChecked(true);
        }
      });
    return () => {
      active = false;
    };
  }, [authToken, id]);

  const similarProducts = product
    ? [
        ...products.filter(
          (p) => p.category === product.category && p.id !== product.id,
        ),
        ...products.filter(
          (p) => p.category !== product.category && p.id !== product.id,
        ),
      ].slice(0, 4)
    : [];

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.review.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitReview({ ...form, product_id: id });
      setSubmitMsg(res.message);
      setForm({ name: "", rating: 5, review: "" });
      if (id) getProductReviews(id).then(setReviews);
    } catch (err: any) {
      setSubmitMsg("Gagal kirim: " + (err.message || "Coba lagi"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!authToken) {
      setShowLoginPrompt(true);
      return;
    }
    if (qtyError || qty < 1 || qty > product!.stock) return;
    for (let i = 0; i < qty; i++) addItem(product!);
    setQty(1);
    setQtyError(false);
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-10 h-10 border-4 border-[#F5730C] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl text-zinc-400 mb-4">Produk tidak ditemukan</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-[#F5730C] font-semibold"
        >
          ← Kembali ke produk
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-5 sm:px-8 pt-10">
      {/* ========== PRODUCT DETAIL ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Image */}
        <div className="relative rounded-3xl overflow-hidden bg-white">
          <span className="absolute top-5 left-5 z-10 px-2.5 py-1 rounded-full bg-white/90 text-zinc-700 text-[11px] font-semibold">
            {product.categoryName || product.category}
          </span>
          <FavoriteButton
            id={product.id}
            className="absolute top-5 right-5 z-10"
          />
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-[4/5] sm:aspect-square object-cover"
          />
        </div>

        {/* Info */}
        <div>
          <h1 className="text-4xl sm:text-[44px] font-extrabold tracking-tight">
            {cleanProductName(product.name)}
          </h1>

          <div className="flex items-center gap-2 mb-3">
            <p className="font-bold text-brand-600 text-base">
              Rp {product.price.toLocaleString("id-ID")}
            </p>

            {(product.avg_rating ?? 0) > 0 && (product.review_count ?? 0) > 0 ? (
              <div className="flex items-center gap-1">
                <Star size={13} weight="fill" className="text-amber-400" />
                <span className="text-xs font-semibold text-zinc-700">
                  {(product.avg_rating ?? 0).toFixed(1)}
                </span>
                <span className="text-xs text-zinc-400">
                  ({product.review_count})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Star size={13} weight="regular" className="text-zinc-300" />
                <span className="text-xs text-zinc-400">Belum ada ulasan</span>
              </div>
            )}
          </div>
          {/* Weight + Stock */}
          <div className="mt-6 bg-[#FFF1E6]/60 rounded-2xl p-5 flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-black/50 uppercase tracking-wide">
                Berat
              </p>
              <p className="mt-1 font-bold text-sm">{product.weight || "-"}</p>
            </div>
            <div className="w-px self-stretch bg-black/10" />
            <div>
              <p className="text-xs font-bold text-black/50 uppercase tracking-wide">
                Stok
              </p>
              <p className="mt-1 font-bold text-sm flex items-center gap-1.5">
                {product.stock > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {product.stock} Tersedia
                  </>
                ) : (
                  <span className="text-red-500">Habis</span>
                )}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 space-y-4 text-sm text-black/60 leading-relaxed">
            {product.description
              .split("\n\n")
              .map((p, i) => (p.trim() ? <p key={i}>{p}</p> : null))}
          </div>

          {/* Rating */}
          {avgRating && (
            <div className="mt-6 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    weight={
                      i < Math.round(Number(avgRating)) ? "fill" : "regular"
                    }
                    className={
                      i < Math.round(Number(avgRating))
                        ? "text-amber-400"
                        : "text-zinc-200"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-black/50">
                {avgRating} ({reviews.length} ulasan)
              </span>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-2 mt-6">
            <BuyNowButton
              product={product}
              className="flex-1"
              onRequireLogin={() => {
                setPromptProduct(product);
                setShowLoginPrompt(true);
              }}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!authToken) {
                  setShowLoginPrompt(true);
                  return;
                }
                toggleFavorite(product.id);
              }}
              aria-label="Favorit"
              className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-[8px] transition-colors ${
                favIds.includes(product.id)
                  ? "text-brand-600 border-2 border-brand-600 bg-brand-50"
                  : "text-zinc-600 border-2 border-zinc-200 hover:border-brand-600 hover:text-brand-600"
              }`}
            >
              <Heart
                size={18}
                weight={favIds.includes(product.id) ? "fill" : "bold"}
              />
            </button>

            <div className="w-11 h-11 shrink-0 [&>button]:w-full [&>button]:h-full">
              <AddToCartButton
                product={product}
                iconOnly
                onRequireLogin={() => {
                  setPromptProduct(product);
                  setShowLoginPrompt(true);
                }}
              />
            </div>
          </div>

          <Link
            to="/cart"
            className="mt-4 block text-center sm:text-left text-sm font-semibold text-[#F5730C] hover:text-[#D9600A] transition-colors"
          >
            Lihat Keranjang
          </Link>
        </div>
      </div>

      {/* ========== TUTORIAL PENYAJIAN ========== */}
      {product.serving_steps && product.serving_steps.length > 0 && (
        <section className="pt-10">
          <h2 className="text-2xl font-extrabold">Tutorial Penyajian</h2>
          <ol className="mt-7 space-y-5">
            {product.serving_steps.map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="shrink-0 w-8 h-8 rounded-full bg-[#EA580C] text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-sm text-zinc-800 leading-7">
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-sm text-black/50 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ========== ULASAN PRODUK ========== */}
      <section className="pt-24">
        <h2 className="text-2xl font-extrabold">Ulasan Produk</h2>

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Reviews list / Empty state */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-[#FFF1E6]/50 rounded-2xl p-10 flex flex-col items-center text-center gap-3">
                <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#F5730C]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </span>
                <p className="font-bold text-sm">Belum ada ulasan</p>
                <p className="text-xs text-black/50 leading-relaxed max-w-[16rem]">
                  Jadilah yang pertama memberikan ulasan untuk produk ini.
                </p>
              </div>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-100"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#FFF1E6] flex items-center justify-center text-[#F5730C] shrink-0 overflow-hidden">
                      {r.avatar ? (
                        <img
                          src={resolveImage(r.avatar)}
                          alt={r.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <User size={16} weight="bold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-zinc-800">
                          {r.name}
                        </span>
                        <span className="text-xs text-zinc-300">•</span>
                        <span className="text-xs text-zinc-400">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : ""}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            weight={i < r.rating ? "fill" : "regular"}
                            className={
                              i < r.rating ? "text-amber-400" : "text-zinc-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-600 text-sm leading-relaxed pl-12">
                    {r.review}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Review form — only shown to logged-in users who purchased this product */}
          {authToken && purchaseChecked && purchased ? (
            <div className="bg-white rounded-2xl border-l-4 border-[#F5730C] p-6 sm:p-8">
              <h3 className="text-lg font-extrabold">Tulis Ulasan Anda</h3>

              {submitMsg && (
                <p className="mt-3 text-xs text-green-700 bg-green-50 p-3 rounded-xl border border-green-200">
                  {submitMsg}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold">
                    Nama Lengkap
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Masukkan nama Anda"
                    required
                    className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#F5730C] transition-colors placeholder:text-black/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold">Penilaian</label>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, rating: n })}
                        className="transition-all hover:scale-110 active:scale-90"
                      >
                        <Star
                          size={28}
                          weight={form.rating >= n ? "fill" : "regular"}
                          className={
                            form.rating >= n
                              ? "text-[#F5730C]"
                              : "text-zinc-200"
                          }
                        />
                      </button>
                    ))}
                    <span className="text-sm text-black/40 ml-1">
                      {
                        ["", "Buruk", "Kurang", "Cukup", "Baik", "Sangat Baik"][
                          form.rating
                        ]
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold">Komentar</label>
                  <textarea
                    value={form.review}
                    onChange={(e) =>
                      setForm({ ...form, review: e.target.value })
                    }
                    rows={4}
                    required
                    placeholder="Bagaimana rasa dan kualitas produk ini?"
                    className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#F5730C] transition-colors resize-none placeholder:text-black/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-[8px] transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800"
                >
                  {submitting ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 text-center">
              <span className="w-14 h-14 rounded-full bg-[#FFF1E6] flex items-center justify-center text-[#F5730C] mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </span>
              <h3 className="text-lg font-extrabold">Berikan Ulasan Anda</h3>
              <p className="mt-2 text-sm text-black/50 leading-relaxed mx-auto max-w-sm">
                {authToken
                  ? "Untuk menulis ulasan, kamu perlu membeli produk ini terlebih dahulu. Setelah pesananmu selesai, kamu bisa berbagi pengalaman belanjamu."
                  : "Masuk ke akunmu untuk menulis ulasan setelah kamu membeli produk ini."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========== PRODUK DISARANKAN ========== */}
      {similarProducts.length > 0 && (
        <section className="pt-24 pb-24">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-extrabold">
              Produk Disarankan Lainnya
            </h2>
            <Link
              to="/products"
              className="text-sm font-semibold text-[#F5730C] hover:text-[#D9600A] whitespace-nowrap"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <Link
                  to={`/products/${p.id}`}
                  className="block relative overflow-hidden aspect-[4/3]"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="px-4 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full">
                        Stok Habis
                      </span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-semibold bg-white/90 text-zinc-700 rounded-full">
                    {p.categoryName || "Produk"}
                  </span>
                </Link>
                <div className="p-3 md:p-4">
                  <Link to={`/products/${p.id}`}>
                    <h3 className="font-bold text-zinc-800 text-sm md:text-base mb-1 line-clamp-1 hover:text-brand-600 transition-colors">
                      {cleanProductName(p.name)}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="font-bold text-brand-600 text-base">
                      Rp {p.price.toLocaleString("id-ID")}
                    </p>

                    {(p.avg_rating ?? 0) > 0 && (p.review_count ?? 0) > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star
                          size={13}
                          weight="fill"
                          className="text-amber-400"
                        />
                        <span className="text-xs font-semibold text-zinc-700">
                          {(p.avg_rating ?? 0).toFixed(1)}
                        </span>
                        <span className="text-xs text-zinc-400">
                          ({p.review_count})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Star
                          size={13}
                          weight="regular"
                          className="text-zinc-300"
                        />
                        <span className="text-xs text-zinc-400">
                          Belum ada ulasan
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <BuyNowButton
                      product={p}
                      onRequireLogin={() => setShowLoginPrompt(true)}
                    />
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${p.id}`}
                        className="flex items-center justify-center flex-1 h-9 px-3 text-xs font-semibold rounded-[8px] transition-colors text-brand-600 border-2 border-brand-600 hover:bg-brand-50 active:bg-brand-100"
                      >
                        Lihat Detail
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!authToken) {
                            setShowLoginPrompt(true);
                            return;
                          }
                          toggleFavorite(p.id);
                        }}
                        aria-label="Favorit"
                        className={`flex items-center justify-center w-9 h-9 rounded-[8px] transition-colors ${
                          favIds.includes(p.id)
                            ? "text-brand-600 border-2 border-brand-600 bg-brand-50"
                            : "text-zinc-600 border-2 border-zinc-200 hover:border-brand-600 hover:text-brand-600"
                        }`}
                      >
                        <Heart
                          size={18}
                          weight={favIds.includes(p.id) ? "fill" : "bold"}
                        />
                      </button>
                      <AddToCartButton
                        product={p}
                        iconOnly
                        onRequireLogin={() => setShowLoginPrompt(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirect={`/products/${product.id}`}
        context="belanja"
      />
    </main>
  );
}
