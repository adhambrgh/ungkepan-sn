import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Storefront,
  Users,
  Package,
  CheckCircle,
  Star,
  Clock,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Cookie,
  Coffee,
  BowlFood,
  Cake,
  MapPin,
  Envelope,
  InstagramLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { getSiteContent } from "../api/client";

const iconMap: Record<string, any> = {
  Heart,
  ShieldCheck,
  ShoppingBag,
  Package,
  Truck,
  Star,
  Cookie,
  Coffee,
  BowlFood,
  Cake,
  Clock,
  Storefront,
};

export default function About() {
  const [content, setContent] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [footer, setFooter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSiteContent("about"),
      getSiteContent("contact"),
      getSiteContent("footer"),
    ])
      .then(([aboutData, contactData, footerData]) => {
        if (aboutData) setContent(aboutData);
        if (contactData) setContact(contactData);
        if (footerData) setFooter(footerData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-5 sm:px-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const c = contact || {};
  const f = footer || {};

  const a = content || {};
  const storyPars =
    a.storyParagraphs && a.storyParagraphs.length
      ? a.storyParagraphs
      : [
          "Ungkepan SN lahir dari keinginan sederhana: ingin keluarga Indonesia bisa menikmati lauk tradisional favorit tanpa repot memasak dari nol. Dimulai dari dapur kecil dengan resep warisan nenek, kini kami menghadirkan berbagai varian ungkepan yang sudah dimasak sampai empuk meresap tinggal panaskan dan santap.",
          "Setiap lauk dimasak dengan teknik ungkep tradisional hingga bumbu meresap ke tulang, lalu dikemas dengan standar kebersihan tertinggi. Dari dapur kecil, kini Ungkepan SN melayani pelanggan dari berbagai kota yang menginginkan lauk enak, bergizi, dan praktis.",
        ];
  const valueCards =
    a.values && a.values.length
      ? a.values
      : [
          { icon: "Heart", title: "Resep Rahasia Tersendiri", desc: "Bumbu tradisional khas nusantara, empuk meresap tanpa pengawet" },
          { icon: "ShieldCheck", title: "Siap Saji Dalam Hitungan Menit", desc: "Tinggal panaskan 10-15 menit di microwave, rice cooker, atau wajan" },
          { icon: "Package", title: "Bersih, Higienis, Tanpa Pengawet", desc: "Dapur bersertifikat, bahan segar harian" },
        ];
  const checkItems =
    a.checklist && a.checklist.length
      ? a.checklist
      : [
          "Lauk tradisional favorit: ayam ungkep, ikan bakar, pepes, usus, dll",
          "Bumbu meresap sempurna tidak perlu tambah garam/bumbu lagi",
          "Bisa disimpan lama di kulkas/freezer, stok lauk siap saji",
          "Hemat waktu & tenaga cocok untuk keluarga sibuk & kos-kosan",
          "Harga terjangkau, porsi pas untuk 1-2 orang makan",
        ];

  const stats = [
    { icon: Users, value: "250+", label: "Happy Clients" },
    { icon: Package, value: "500+", label: "Pesanan Dikirim" },
    { icon: Star, value: "4.9/5", label: "Average Client Rating" },
    { icon: Heart, value: "98%", label: "Client Retention" },
  ];

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">
              {a.title || "Tentang Kami"}
            </h1>
            <p className="mt-3 text-zinc-500 text-sm md:text-base leading-relaxed">
              {a.hero_subtitle ||
                "Kami menghadirkan olahan ungkepan siap saji yang mempermudah hidangan sehari-hari"}
            </p>
            <p className="mt-4 text-zinc-600 leading-relaxed max-w-md">
              {a.hero_desc ||
                "Ungkepan SN menyediakan berbagai lauk ungkepan tradisional yang sudah matang sempurna tinggal panaskan dan santap. Resep warisan keluarga, bahan segar, tanpa pengawet, cocok untuk keluarga sibuk yang tetap ingin makan enak bergizi."}
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 px-7 py-2.5 text-base font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-all hover:scale-105 active:scale-95"
            >
              {a.hero_button || "Lihat Produk Kami"}
            </Link>
          </div>
          <div className="rounded-3xl overflow-hidden">
            <img
              src={a.hero_image || "/hero-about.jpg"}
              alt="Produk ungkepan siap saji Ungkepan SN"
              className="w-full h-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* ========== SEJARAH ========== */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="rounded-3xl overflow-hidden">
            <img
              src={a.story_image || "/logo.png"}
              alt="Logo Ungkepan SN"
              className="w-full h-full object-contain aspect-[4/3] p-8 bg-white"
            />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">
              {a.story_title || "Sejarah Ungkepan SN"}
            </h2>
            <p className="mt-3 text-zinc-500 text-sm md:text-base leading-relaxed">
              {a.story_subtitle ||
                "Dari dapur kecil dengan resep warisan, kini hadir untuk keluarga Indonesia"}
            </p>
            {storyPars.map((p: string, i: number) => (
              <p key={i} className="mt-4 text-zinc-600 leading-relaxed max-w-md">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ========== KEUNGGULAN UNGKEPAN SN ========== */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-32">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">
            {a.values_title || "Mengapa Pilih Ungkepan SN?"}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: value cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:col-span-2 self-start">
            {valueCards.map((v: any, i: number) => {
              const Icon = iconMap[v.icon] || Heart;
              return (
                <div key={i} className="rounded-2xl border border-zinc-100 p-6">
                  <Icon size={22} className="text-[#EA580C]" strokeWidth={2} />
                  <h3 className="mt-4 font-bold text-sm text-zinc-900">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Big card with checklist */}
          <div className="rounded-2xl bg-[#EA580C] text-white p-7">
            <ul className="mt-5 space-y-4 text-sm">
              {checkItems.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle
                    size={18}
                    className="shrink-0 mt-0.5"
                    weight="fill"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-32">
        <div className="rounded-3xl bg-white border-2 border-[#EA580C] px-6 sm:px-10 py-24 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">
            {a.cta_title || "Siap untuk Memasak Lebih Mudah?"}
          </h2>
          <p className="mt-3 text-zinc-500 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            {a.cta_desc ||
              "Dengan membeli produk kami, memasak bukanlah menjadi hal yang sulit, kalian bisa memasak isntan dengan suka cita rasa khas indonesia"}
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 px-7 py-2.5 text-base font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-all hover:scale-105 active:scale-95"
          >
            {a.cta_button || "Mulai Pesan"}
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-zinc-900 text-zinc-300 mt-32">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img
                  src="/logo.png"
                  alt="Ungkepan SN"
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                {f.description ||
                  "Jajanan rumahan enak, bersih, dan terpercaya."}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Menu</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/"
                    className="hover:text-brand-400 transition-colors"
                  >
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    className="hover:text-brand-400 transition-colors"
                  >
                    Semua Produk
                  </Link>
                </li>
                <li>
                  <Link
                    to="/favorit"
                    className="hover:text-brand-400 transition-colors"
                  >
                    Favorit Saya
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-brand-400 transition-colors"
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-brand-400 transition-colors"
                  >
                    Kontak
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profil"
                    className="hover:text-brand-400 transition-colors"
                  >
                    Profil
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/login"
                    className="text-zinc-600 hover:text-brand-400 transition-colors"
                  >
                    Panel
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Kontak</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <WhatsappLogo
                    size={18}
                    weight="fill"
                    className="text-[#EA580C] shrink-0"
                  />
                  <a
                    href={`https://wa.me/${c.whatsapp || "6281234567890"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-400 transition-colors"
                  >
                    {c.whatsapp_display || "0812-3456-7890"}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin
                    size={18}
                    weight="fill"
                    className="text-[#EA580C] shrink-0"
                  />
                  <span>{c.location || "Jakarta, Indonesia"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Envelope
                    size={18}
                    weight="fill"
                    className="text-[#EA580C] shrink-0"
                  />
                  <a
                    href={`mailto:${c.email || "ungkepansn@email.com"}`}
                    className="hover:text-brand-400 transition-colors"
                  >
                    {c.email || "ungkepansn@email.com"}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <InstagramLogo
                    size={18}
                    weight="fill"
                    className="text-[#EA580C] shrink-0"
                  />
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
            {f.copyright
              ? f.copyright.replace("{year}", String(new Date().getFullYear()))
              : `\u00A9 ${new Date().getFullYear()} Ungkepan SN. Dibuat dengan sepenuh hati.`}
          </div>
        </div>
      </footer>
    </>
  );
}
