<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ungkepan SN — Backend API & Service Hub</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .glow-amber {
            box-shadow: 0 0 50px -10px rgba(245, 158, 11, 0.25);
        }
    </style>
</head>
<body class="bg-stone-900 text-stone-100 min-h-screen antialiased selection:bg-amber-500 selection:text-stone-900">
    <div class="relative overflow-hidden min-h-screen flex flex-col justify-between">
        <!-- Background Gradient Glows -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/3 -right-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Top Navigation -->
        <header class="relative z-10 border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-md">
            <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-extrabold text-xl shadow-lg shadow-amber-500/20">
                        🍗
                    </div>
                    <div>
                        <div class="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                            Ungkepan SN
                            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">Backend API</span>
                        </div>
                        <p class="text-xs text-stone-400">Olahan Rumah Terpercaya &bull; REST API Server</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Server Active
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="relative z-10 max-w-6xl mx-auto px-6 py-10 w-full flex-grow">
            <!-- Hero Banner -->
            <div class="bg-gradient-to-br from-stone-800/90 via-stone-850 to-stone-900 border border-stone-700/60 rounded-3xl p-8 sm:p-10 mb-8 glow-amber">
                <div class="max-w-3xl">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
                        ⚡ Laravel 12 API Gateway
                    </div>
                    <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
                        Server Backend & REST API <br>
                        <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">Ungkepan SN</span>
                    </h1>
                    <p class="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
                        Service backend ini menyediakan seluruh endpoint API untuk katalog produk ungkepan, kategori, keranjang & pesanan, konfirmasi pembayaran QRIS, review pelanggan, dan dashboard admin.
                    </p>

                    <!-- System Info Badges -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div class="bg-stone-950/50 border border-stone-800 rounded-xl p-3.5">
                            <span class="text-xs text-stone-400 block mb-1">Laravel Engine</span>
                            <span class="text-sm font-semibold text-white">v{{ app()->version() }}</span>
                        </div>
                        <div class="bg-stone-950/50 border border-stone-800 rounded-xl p-3.5">
                            <span class="text-xs text-stone-400 block mb-1">PHP Runtime</span>
                            <span class="text-sm font-semibold text-white">v{{ phpversion() }}</span>
                        </div>
                        <div class="bg-stone-950/50 border border-stone-800 rounded-xl p-3.5">
                            <span class="text-xs text-stone-400 block mb-1">Environment</span>
                            <span class="text-sm font-semibold text-emerald-400 uppercase tracking-wider">{{ app()->environment() }}</span>
                        </div>
                        <div class="bg-stone-950/50 border border-stone-800 rounded-xl p-3.5">
                            <span class="text-xs text-stone-400 block mb-1">Database</span>
                            <span class="text-sm font-semibold text-amber-300">{{ config('database.default') }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Two Columns: Instructions & API Endpoints -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Left Column: How to run & connect (5 cols) -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="bg-stone-900/90 border border-stone-800 rounded-2xl p-6">
                        <h2 class="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <span>🚀</span> Panduan Menjalankan Sistem
                        </h2>
                        
                        <div class="space-y-4 text-xs text-stone-300">
                            <div class="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
                                <div class="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                                    <span>1.</span> Backend Laravel (Folder ini)
                                </div>
                                <p class="text-stone-400 mb-2">Jalankan web server Laravel:</p>
                                <code class="block bg-stone-900 px-3 py-2 rounded-lg text-amber-200 font-mono border border-stone-800">
                                    php artisan serve
                                </code>
                                <p class="text-stone-400 mt-2 text-[11px]">
                                    Akses API di <span class="text-white font-mono">http://127.0.0.1:8000</span>
                                </p>
                            </div>

                            <div class="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
                                <div class="font-semibold text-orange-400 mb-1 flex items-center gap-1.5">
                                    <span>2.</span> Frontend Web (Toko & Admin)
                                </div>
                                <p class="text-stone-400 mb-2">Buka folder Frontend Anda di terminal terpisah lalu jalankan:</p>
                                <code class="block bg-stone-900 px-3 py-2 rounded-lg text-orange-200 font-mono border border-stone-800">
                                    npm run dev
                                </code>
                                <p class="text-stone-400 mt-2 text-[11px]">
                                    Buka link yang tampil (biasanya <span class="text-white font-mono">http://localhost:5173</span>) untuk melihat UI toko pelanggan & admin.
                                </p>
                            </div>

                            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed">
                                💡 <strong>Catatan:</strong> <code class="text-white font-mono">npm run dev</code> di dalam folder backend ini hanya digunakan untuk meng-compile asset internal Laravel.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: API Endpoints Explorer (7 cols) -->
                <div class="lg:col-span-7">
                    <div class="bg-stone-900/90 border border-stone-800 rounded-2xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-base font-bold text-white flex items-center gap-2">
                                <span>🔌</span> Uji Coba Endpoint API Publik
                            </h2>
                            <span class="text-xs text-stone-400">Format JSON</span>
                        </div>

                        <div class="divide-y divide-stone-800">
                            <!-- Endpoint item -->
                            <div class="py-3 flex items-center justify-between gap-4">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">GET</span>
                                    <div class="truncate">
                                        <div class="text-xs font-semibold text-white truncate">Daftar Produk</div>
                                        <div class="text-[11px] font-mono text-stone-400 truncate">/api/products.php</div>
                                    </div>
                                </div>
                                <a href="{{ url('/api/products.php') }}" target="_blank" class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-medium text-stone-200 transition">
                                    Buka Data &rarr;
                                </a>
                            </div>

                            <!-- Endpoint item -->
                            <div class="py-3 flex items-center justify-between gap-4">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">GET</span>
                                    <div class="truncate">
                                        <div class="text-xs font-semibold text-white truncate">Kategori Menu</div>
                                        <div class="text-[11px] font-mono text-stone-400 truncate">/api/categories.php</div>
                                    </div>
                                </div>
                                <a href="{{ url('/api/categories.php') }}" target="_blank" class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-medium text-stone-200 transition">
                                    Buka Data &rarr;
                                </a>
                            </div>

                            <!-- Endpoint item -->
                            <div class="py-3 flex items-center justify-between gap-4">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">GET</span>
                                    <div class="truncate">
                                        <div class="text-xs font-semibold text-white truncate">Konten & Informasi Toko</div>
                                        <div class="text-[11px] font-mono text-stone-400 truncate">/api/site_content.php</div>
                                    </div>
                                </div>
                                <a href="{{ url('/api/site_content.php') }}" target="_blank" class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-medium text-stone-200 transition">
                                    Buka Data &rarr;
                                </a>
                            </div>

                            <!-- Endpoint item -->
                            <div class="py-3 flex items-center justify-between gap-4">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">GET</span>
                                    <div class="truncate">
                                        <div class="text-xs font-semibold text-white truncate">Metode Pembayaran</div>
                                        <div class="text-[11px] font-mono text-stone-400 truncate">/api/payments.php</div>
                                    </div>
                                </div>
                                <a href="{{ url('/api/payments.php') }}" target="_blank" class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-medium text-stone-200 transition">
                                    Buka Data &rarr;
                                </a>
                            </div>

                            <!-- Endpoint item -->
                            <div class="py-3 flex items-center justify-between gap-4">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">GET</span>
                                    <div class="truncate">
                                        <div class="text-xs font-semibold text-white truncate">Testimoni & Review</div>
                                        <div class="text-[11px] font-mono text-stone-400 truncate">/api/reviews.php</div>
                                    </div>
                                </div>
                                <a href="{{ url('/api/reviews.php') }}" target="_blank" class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-medium text-stone-200 transition">
                                    Buka Data &rarr;
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="relative z-10 border-t border-stone-800/80 bg-stone-950/80 py-4 text-center text-xs text-stone-500">
            Ungkepan SN &copy; {{ date('Y') }} &bull; Backend Service Platform
        </footer>
    </div>
</body>
</html>
