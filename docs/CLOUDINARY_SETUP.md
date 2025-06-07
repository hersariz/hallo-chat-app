# Panduan Setup Cloudinary untuk Aplikasi Hallo

Cloudinary adalah layanan manajemen gambar berbasis cloud yang menyediakan solusi untuk upload, penyimpanan, manajemen, manipulasi, dan pengiriman gambar untuk website dan aplikasi.

## Kredensial Aktif

Aplikasi ini sudah dikonfigurasi dengan kredensial Cloudinary berikut:
- **Cloud Name**: `dk7iscykg`
- **API Key**: `479643753769294`
- **API Secret**: `COLo8c_tmuuAA2ka6P7VLBDlbgw`

Kredensial ini sudah ditambahkan ke file `.env.local` dan siap digunakan.

## Langkah 1: Membuat Akun Cloudinary

1. Kunjungi [https://cloudinary.com/](https://cloudinary.com/) dan daftar untuk akun gratis.
2. Setelah mendaftar, Anda akan dibawa ke dashboard Cloudinary.

## Langkah 2: Mendapatkan Kredensial API

1. Di dashboard Cloudinary, temukan dan catat informasi berikut:
   - **Cloud Name**: Nama cloud Anda
   - **API Key**: Kunci API publik
   - **API Secret**: Kunci rahasia API Anda

## Langkah 3: Konfigurasi Environment Variables

1. Buat file `.env.local` di root proyek Anda (jika belum ada).
2. Tambahkan kredensial Cloudinary ke file tersebut:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Restart server aplikasi Anda untuk memuat variabel lingkungan baru.

## Langkah 4: Pengujian

1. Pastikan server aplikasi Anda berjalan.
2. Coba kirim gambar menggunakan URL dalam aplikasi chat.
3. Verifikasi bahwa gambar telah diunggah ke Cloudinary dengan memeriksa folder `hallo-chat` di dashboard Media Library Cloudinary Anda.

## Memecahkan Masalah

Jika Anda mengalami masalah dengan upload gambar, periksa hal-hal berikut:

1. **Kredensial yang Tidak Valid**: Periksa kembali Cloud Name, API Key, dan API Secret Anda.
2. **CORS Issues**: Jika menggunakan API Upload langsung dari browser, aktifkan CORS di pengaturan Cloudinary Anda.
3. **Rate Limiting**: Tier gratis Cloudinary memiliki batasan. Periksa penggunaan Anda di dashboard.

## Manfaat Menggunakan Cloudinary

- **Tier Gratis yang Generos**: 25GB penyimpanan dan 25GB bandwidth per bulan.
- **Transformasi Gambar**: Resize, crop, dan efek lainnya secara otomatis.
- **Delivery yang Cepat**: CDN global untuk pengiriman yang cepat.
- **Optimasi Otomatis**: Format optimal (WebP) dan kompresi untuk kecepatan web.

## Dokumentasi Lebih Lanjut

- [Dokumentasi Cloudinary](https://cloudinary.com/documentation)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformasi Gambar](https://cloudinary.com/documentation/image_transformations) 