// Konfigurasi aplikasi.
// Isi GOOGLE_CLIENT_ID dari Google Cloud Console (OAuth 2.0 Client IDs, tipe "Web").
// Tambahkan origin aplikasi ke "Authorized JavaScript origins", mis. http://ungkepan-sn.test
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
