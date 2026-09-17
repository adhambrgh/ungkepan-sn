import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Package,
  Clock,
  ShieldCheck,
  Storefront,
  Star,
  CaretRight,
  CaretDown,
  Leaf,
  Heart,
  Cookie,
  Coffee,
  BowlFood,
  Cake,
  ShoppingCart,
  ClipboardText,
  CreditCard,
  ThumbsUp,
  Sun,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  getCategories,
  getFeaturedProducts,
  getProducts,
  getTestimonials,
  submitReview,
  getSiteContent,
  resolveImage,
} from "../api/client";
import { subscribeStock } from "../lib/stockStream";
import { useAuthStore } from "../store/authStore";
import { useFavoritesStore } from "../store/favoritesStore";
import LoginPrompt from "../components/ui/LoginPrompt";
import AddToCartButton from "../components/product/AddToCartButton";
import BuyNowButton from "../components/product/BuyNowButton";
import type { Category, Product, Review } from "../types";

type SearchResults = { products: Product[]; categories: Category[] };

const iconMap: Record<string, React.ElementType> = {
  Heart,
  ShieldCheck,
  Package,
  Clock,
  Leaf,
  Cookie,
  Coffee,
  BowlFood,
  Cake,
  Storefront,
  ThumbsUp,
  Sun,
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [hero, setHero] = useState<any>(null);
  const [heroImgIdx, setHeroImgIdx] = useState(0);
  const [form, setForm] = useState({ name: "", rating: 5, review: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptProduct, setPromptProduct] = useState<Product | null>(null);
  const [heroSearch, setHeroSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    products: [],
    categories: [],
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authToken = useAuthStore((s) => s.token);
  const authUser = useAuthStore((s) => s.user);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const favIds = useFavoritesStore((s) => s.ids);
  const navigate = useNavigate();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(heroSearch.trim())}`);
    }
    setShowSearchDropdown(false);
  };

  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (!query.trim()) {
        setSearchResults({ products: [], categories: [] });
        setShowSearchDropdown(false);
        return;
      }
      const q = query.toLowerCase();
      const filteredProducts = allProducts
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q),
        )
        .slice(0, 5);
      const filteredCategories = categories
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 3);
      setSearchResults({
        products: filteredProducts,
        categories: filteredCategories,
      });
      setShowSearchDropdown(
        filteredProducts.length + filteredCategories.length > 0,
      );
    }, 50);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHeroSearch(value);
    debouncedSearch(value);
  };

  const handleSearchFocus = () => {
    if (
      heroSearch.trim() &&
      searchResults.products.length + searchResults.categories.length > 0
    ) {
      setShowSearchDropdown(true);
    }
  };

  const selectResult = (
    type: "product" | "category",
    id: string,
    name: string,
  ) => {
    if (type === "product") {
      navigate(`/products/${id}`);
    } else {
      navigate(`/products?category=${id}`);
    }
    setShowSearchDropdown(false);
    setHeroSearch("");
  };

  // Clean duplicate consecutive words in product names (e.g., "Pepes Pepes" → "Pepes")
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

  useEffect(() => {
    getCategories().then(setCategories);
    getFeaturedProducts().then(setFeaturedProducts);
    getProducts().then(setAllProducts);
    getTestimonials().then(setTestimonials);
    getSiteContent("hero")
      .then((data) => {
        setHero(data);
        if (data?.images?.length) setHeroImgIdx(0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return subscribeStock((stocks) => {
      setAllProducts((prev) =>
        prev.map((p) =>
          stocks[p.id] !== undefined ? { ...p, stock: stocks[p.id] } : p,
        ),
      );
      setFeaturedProducts((prev) =>
        prev.map((p) =>
          stocks[p.id] !== undefined ? { ...p, stock: stocks[p.id] } : p,
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (!hero?.images?.length) return;
    const interval = setInterval(() => {
      setHeroImgIdx((prev) => (prev + 1) % hero.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hero?.images?.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    const els = document.querySelectorAll(".animate-on-scroll");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.review.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitReview({
        name: form.name,
        rating: form.rating,
        review: form.review,
        product_id: null,
      });
      setFormMsg(res.message);
      setForm((f) => ({
        name: authUser?.name || authUser?.email || f.name,
        rating: 5,
        review: "",
      }));
    } catch (err: any) {
      setFormMsg("Gagal: " + (err.message || "Coba lagi"));
    } finally {
      setSubmitting(false);
    }
  };

  // Isi nama otomatis dari profil (nama), jika belum ada pakai email
  useEffect(() => {
    if (!authUser) return;
    setForm((f) => ({
      ...f,
      name: authUser!.name || authUser!.email,
    }));
  }, [authUser]);

  // Fallback testimonials untuk padding jika data kurang
  const fallbackTestimonials = [
    {
      id: "f1",
      name: "Andi Wijaya",
      rating: 5,
      review: "Makanan enak banget, bumbunya meresap sampe ke tulang!",
    },
    {
      id: "f2",
      name: "Sari Dewi",
      rating: 5,
      review:
        "Pesan sore, malam udah sampai. Packing rapi, es batu masih beku.",
    },
    {
      id: "f3",
      name: "Budi Santoso",
      rating: 4,
      review: "Sudah langganan 1 tahun, kualitas konsisten. Harga bersahabat.",
    },
    {
      id: "f4",
      name: "Maya Putri",
      rating: 5,
      review:
        "Ayam ungkep favoritku, daging empuk banget. Nasi 3 porsi habis sendirian.",
    },
    {
      id: "f5",
      name: "Rizky Maulana",
      rating: 5,
      review:
        "Ikan bakar wangi asap, sambel terasinya nendang. Recommended deh!",
    },
    {
      id: "f6",
      name: "Dina Permata",
      rating: 4,
      review:
        "Delivery cepat, admin ramah. Minta sambel extra diikutin no ribet.",
    },
    {
      id: "f7",
      name: "Eko Prasetyo",
      rating: 5,
      review:
        "Pesen buat arisan kantor, temen-temen pada suka. Bikin ketagihan!",
    },
    {
      id: "f8",
      name: "Lina Marlina",
      rating: 5,
      review:
        "Fresh banget, baru masak kayaknya pas dikirim. Bakal order lagi.",
    },
    {
      id: "f9",
      name: "Tommy Gunawan",
      rating: 4,
      review:
        "Kualitas premium tapi harga masuk kantong. Value for money banget.",
    },
    {
      id: "f10",
      name: "Rina Wulandari",
      rating: 5,
      review:
        "Udah 5x belanja disini, belum pernah nyesel. Consistency is key!",
    },
  ];

  // Helper: render marquee cards (duplicated for seamless loop)
  const renderMarqueeCards = (
    data: typeof testimonials,
    row: "top" | "bottom",
  ) => {
    const base = [...data];
    // Tambah fallback hanya jika data nyata kurang dari 8 (biar marquee tetap rapat)
    if (base.length < 8) {
      while (base.length < 8) {
        const fb =
          fallbackTestimonials[base.length % fallbackTestimonials.length];
        base.push({ ...fb, id: `${fb.id}-${base.length}` } as any);
      }
    }
    // Tampilkan SEMUA testimoni asli, tanpa dipangkas
    const cards = base;
    return [
      ...cards.map((t, i) => (
        <TestimonialCard key={t.id} testimonial={t} index={i} />
      )),
      ...cards.map((t, i) => (
        <TestimonialCard key={`${t.id}-dup`} testimonial={t} index={i} />
      )),
    ];
  };

  const TestimonialCard = ({
    testimonial,
    index,
  }: {
    testimonial: any;
    index: number;
  }) => {
    return (
      <div className="bg-white p-3 sm:p-6 rounded-2xl border border-zinc-200 hover:shadow-md transition-shadow flex-shrink-0 w-48 sm:w-80">
        <div className="flex items-center gap-1 mb-2 sm:mb-3">
          {Array.from({ length: 5 }).map((_, j) => (
            <Star
              key={j}
              size={12}
              weight={j < testimonial.rating ? "fill" : "regular"}
              className={
                j < testimonial.rating ? "text-amber-500" : "text-zinc-300"
              }
            />
          ))}
          <span className="text-[10px] sm:text-[11px] text-zinc-400 ml-1">
            {testimonial.rating}/5
          </span>
        </div>
        <p className="text-zinc-600 leading-relaxed mb-3 sm:mb-4 text-xs sm:text-base italic">
          {testimonial.review}
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
            {testimonial.avatar ? (
              <img
                src={resolveImage(testimonial.avatar)}
                alt={testimonial.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
          <span className="text-xs sm:text-base font-bold text-zinc-900 truncate min-w-0">
            — {testimonial.name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <main>
      {/* Hero */}
      <section className="relative text-white overflow-hidden min-h-screen flex items-center">
        {/* Background slideshow */}
        <div className="absolute inset-0">
          {["/hero.png"].map((img: string, i: number) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === heroImgIdx ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={resolveImage(img)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 w-full py-16">
          <div
            className="max-w-2xl animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              {hero?.headingStart || "Aneka Olahan Frozen & Minuman"}{" "}
              <br className="hidden md:block" />
              <span className="text-brand-200">
                {hero?.headingBrand || "Olahan Ungkepan SN"}
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-lg mb-8">
              {hero?.description ||
                "Enak, bersih, dan dibuat dengan resep rahasia. Homemade berkualitas."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-2.5 text-base font-bold bg-white text-brand-700 rounded-[8px] hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all"
              >
                Lihat Produk
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-8 py-2.5 text-base font-semibold text-white/90 hover:text-white border-2 border-white/30 hover:border-white/60 rounded-[8px] hover:scale-105 active:scale-95 transition-all"
              >
                Tentang Kami
              </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <form
                onSubmit={handleHeroSearch}
                className="animate-slide-up w-full md:w-96"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-[12px] overflow-hidden">
                  <MagnifyingGlass
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                  />
                  <input
                    type="text"
                    placeholder="Cari lauk favoritmu..."
                    value={heroSearch}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    className="w-full pl-12 pr-4 py-2.5 text-base bg-transparent text-white placeholder:text-white/50 focus:outline-none focus:placeholder:text-white/70 transition-colors"
                  />
                </div>
              </form>

              {/* Search Dropdown */}
              {showSearchDropdown && heroSearch.trim() && (
                <div className="absolute left-0 top-full mt-2 w-full md:w-96 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                  {searchResults.products.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Produk
                      </p>
                      {searchResults.products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() =>
                            selectResult("product", product.id, product.name)
                          }
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-white truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-brand-400 font-bold">
                              Rp {product.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.categories.length > 0 && (
                    <div className="p-2 border-t border-white/10">
                      <p className="px-3 py-1.5 text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Kategori
                      </p>
                      {searchResults.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() =>
                            selectResult("category", category.id, category.name)
                          }
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium text-white">
                            {category.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.products.length === 0 &&
                    searchResults.categories.length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-white/60">
                        Tidak ditemukan "{heroSearch}"
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dots */}
        {(hero?.images?.length || 0) > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-2 z-10">
            {hero.images.map((_: string, i: number) => (
              <button
                key={i}
                onClick={() => setHeroImgIdx(i)}
                className={`rounded-full transition-all ${
                  i === heroImgIdx
                    ? "w-8 h-2.5 bg-white"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Kategori */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-30">
        <div className="animate-on-scroll">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 mb-2">
            Kategori
          </h2>
          <p className="text-zinc-500 mb-8">Pilih kategori yang kamu mau</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative overflow-hidden rounded-2xl bg-zinc-100 hover:bg-brand-50 transition-colors min-h-[180px] animate-on-scroll"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500"
                loading="lazy"
              />
              <div className="relative z-10 flex items-center justify-center h-full p-4">
                <span className="text-lg md:text-xl font-bold text-zinc-800">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-zinc-50 py-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-8 animate-on-scroll">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">
                Produk Favorit
              </h2>
              <p className="text-zinc-500 mt-1">
                Yang paling laris di Ungkepan SN
              </p>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1 text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              Lihat Semua <CaretRight size={16} weight="bold" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map((p, i) => (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-on-scroll"
                style={{ transitionDelay: `${i * 0.1}s` }}
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
                      onRequireLogin={() => {
                        setPromptProduct(p);
                        setShowLoginPrompt(true);
                      }}
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
                        onRequireLogin={() => {
                          setPromptProduct(p);
                          setShowLoginPrompt(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Cek Katalog Card */}
            <Link
              to="/products"
              className="group bg-brand-600 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll overflow-hidden flex items-center justify-center"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden flex items-center justify-center p-6">
                {/* Decorative elements */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />

                <div className="relative text-center">
                  <h3 className="font-bold text-white text-lg md:text-xl mb-3 leading-tight">
                    Ingin menu lainnya?
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-brand-600 bg-white rounded-[8px] shadow-md shadow-black/10 hover:bg-brand-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    Cek Katalog
                  </span>
                </div>
              </div>
            </Link>
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-brand-600 font-semibold"
            >
              Lihat Semua Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Kenapa Pilih Kami */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-30">
          <div className="animate-on-scroll">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 text-center mb-2">
              Kenapa Pilih Ungkepan SN?
            </h2>
            <p className="text-zinc-500 text-center mb-10">
              Kami beda dari yang lain
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: "Package",
                title: "Bahan Segar",
                desc: "Bahan pilihan kualitas terbaik, langsung dari pasar tradisional",
              },
              {
                icon: "Clock",
                title: "Pesanan Baru",
                desc: "Kami buat setelah kamu pesan, bukan stok lama",
              },
              {
                icon: "ShieldCheck",
                title: "Bersih & Higienis",
                desc: "Dapur bersih standar rumahan, pake sarung tangan",
              },
              {
                icon: "Leaf",
                title: "Resep Turun Temurun",
                desc: "Rasa autentik yang udah teruji dari generasi ke generasi",
              },
            ].map((item, i) => {
              const Icon = iconMap[item.icon] || Heart;
              return (
                <div
                  key={i}
                  className="text-center p-6 rounded-2xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-100 text-brand-600 mb-4">
                    <Icon size={28} weight="fill" />
                  </div>
                  <h3 className="font-bold text-zinc-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cara Pemesanan */}
      <section className="bg-zinc-50 py-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="animate-on-scroll text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-800 mb-3">
              Cara <span className="text-brand-600">Pemesanan</span>
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Cukup 4 langkah simpel, pesanan kamu langsung diproses
            </p>
          </div>

          {/* Steps with connector */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 md:gap-y-6">
            {/* Desktop connector line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 -z-0" />

            {[
              {
                icon: Package,
                title: "Pilih Produk",
                desc: "Jelajahi katalog & pilih lauk favorit kamu",
              },
              {
                icon: ShoppingCart,
                title: "Tambah ke Keranjang",
                desc: "Klik ikon keranjang, atur jumlah pesanan",
              },
              {
                icon: ClipboardText,
                title: "Checkout",
                desc: "Isi data diri, alamat & pilih pengiriman",
              },
              {
                icon: CreditCard,
                title: "Bayar Pesanan",
                desc: "Bayar online atau pilih Bayar di Tempat (COD)",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center text-center group animate-on-scroll"
                  style={{ transitionDelay: `${i * 0.15}s` }}
                >
                  {/* Step circle */}
                  <div className="relative z-10 flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border-2 border-brand-100 mb-5 group-hover:scale-110 group-hover:border-brand-300 transition-all duration-500">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                      <Icon
                        size={36}
                        weight="fill"
                        className="text-brand-600 group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    {/* Step number badge */}
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-9 h-9 text-sm font-bold text-white bg-[#EA580C] rounded-full shadow-md border-2 border-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-800 text-base md:text-lg mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-[200px]">
                    {item.desc}
                  </p>

                  {/* Arrow connector (mobile) */}
                  {i < 3 && (
                    <div className="md:hidden absolute -bottom-7 left-1/2 -translate-x-1/2 text-brand-300">
                      <CaretDown size={20} weight="bold" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA mini */}
          <div className="text-center mt-12 animate-on-scroll">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-all hover:scale-105 active:scale-95"
            >
              Mulai Belanja Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="animate-on-scroll">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 text-center mb-2">
              Kata Mereka
            </h2>
            <p className="text-zinc-500 text-center mb-10">
              Yang udah cobain pada suka
            </p>
          </div>
          {testimonials.length === 0 ? (
            <p className="text-center text-zinc-400 animate-on-scroll">
              Belum ada testimoni
            </p>
          ) : (
            <div className="relative max-w-6xl mx-auto">
              {/* Top row: Left → Right */}
              <div className="overflow-hidden mb-6">
                <div
                  className="flex gap-6 animate-marquee-left will-change-transform hover:animation-paused"
                  style={{ animationDuration: "30s" }}
                >
                  {renderMarqueeCards(testimonials, "top")}
                </div>
              </div>
              {/* Bottom row: Right → Left */}
              <div className="overflow-hidden">
                <div
                  className="flex gap-6 animate-marquee-right will-change-transform hover:animation-paused"
                  style={{ animationDuration: "35s" }}
                >
                  {renderMarqueeCards(testimonials, "bottom")}
                </div>
              </div>
              {/* Gradient fade edges */}
              <div className="absolute inset-0 pointer-events-none flex justify-between">
                <div className="w-24 bg-gradient-to-r from-white to-transparent" />
                <div className="w-24 bg-gradient-to-l from-white to-transparent" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Form Testimoni */}
      <section className="bg-white py-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="animate-on-scroll">
            <form
              onSubmit={handleSubmitTestimonial}
              className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-shadow space-y-4"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-zinc-800 text-center mb-4">
                Tulis Testimoni
              </h3>

              {formMsg && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded-lg mb-2">
                  {formMsg}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                    NAMA
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Masukkan nama kamu"
                    className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                    RATING
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, rating: n })}
                        className="transition-transform duration-150 hover:scale-110"
                      >
                        <Star
                          size={14}
                          weight={n <= form.rating ? "fill" : "regular"}
                          className={
                            n <= form.rating
                              ? "text-amber-500"
                              : "text-zinc-300 hover:text-amber-400"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                    PESAN
                  </label>
                  <textarea
                    value={form.review}
                    onChange={(e) =>
                      setForm({ ...form, review: e.target.value })
                    }
                    placeholder="Ceritakan pengalaman kamu di sini..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 resize-none transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12  bg-[#EA580C] hover:bg-[#d94e0b] disabled:bg-zinc-300 disabled:cursor-not-allowed rounded-lg text-white font-bold text-sm transition-colors"
                >
                  {submitting ? "Mengirim..." : "Kirim Testimoni"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirect={promptProduct ? `/products/${promptProduct.id}` : "/"}
        context="belanja"
      />
    </main>
  );
}
