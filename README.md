# DIYF Attendance — Event Registration & QR Attendance System

Sistem manajemen presensi acara modern berbasis web untuk registrasi tiket undangan, pendaftaran cepat tamu walk-in di lokasi (*on-site*), dan pemindaian QR code secara *real-time*.

---

## Fitur Utama

- **Live QR Scanner**: Pemindai tiket langsung menggunakan kamera perangkat dengan verifikasi instan dan indikator audio.
- **Fast-track Walk-In**: Registrasi cepat untuk tamu umum langsung dari meja panitia tanpa persiapan awal.
- **Digital E-Pass / Invitation**: Halaman tiket tamu personal berdesain *boarding pass* dilengkapi QR code dinamis dan opsi simpan gambar ke galeri.
- **Real-time Synchronization**: Pembaruan status presensi terhubung langsung ke database Supabase secara instan.
- **Modern UI**: Antarmuka bersih bergaya *glassmorphism* berbasis Tailwind CSS.

---

## Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend & Database**: Supabase (PostgreSQL & Realtime Channels)
- **Scanner Core**: `html5-qrcode`
- **QR Generator**: `qrcode.react`

## Supabase Setup

Jalankan migration secara berurutan, termasuk `002_secure_admin_and_invitation_status.sql`, `003_restrict_admin_access.sql`, dan `005_add_email_to_attendees.sql`. Migration ini mengaktifkan RLS, membatasi data untuk user yang berhasil login, dan menyediakan RPC aman untuk halaman tiket publik.

Buat user admin melalui Supabase Dashboard pada **Authentication > Users**, lalu gunakan email dan password tersebut di `/admin/login`. Semua user yang berhasil login akan dapat mengelola presensi. Aktifkan Realtime untuk tabel `attendees` jika ingin perubahan data langsung terlihat di dashboard admin.

Undangan dikirim melalui WhatsApp. Admin memasukkan nomor WhatsApp saat membuat undangan, lalu aplikasi membuka `wa.me` dengan pesan dan link e-pass yang sudah terisi. Tidak diperlukan Resend, Brevo, domain, atau secret tambahan.

Di tab **Daftar Hadir**, gunakan **Import Excel** untuk memasukkan banyak undangan sekaligus. File `.xlsx` atau `.xls` harus memiliki kolom `Nama` dan `Nomor WhatsApp`; kolom `Kode Tiket` bersifat opsional. Setelah data masuk, tombol **WA** di setiap baris membuka pesan undangan personal.

---

## 🚀 Memulai (Local Development)

### 1. Clone Repository
```bash
git clone (https://github.com/helsach/diyf-attendance.git)
cd event-reg