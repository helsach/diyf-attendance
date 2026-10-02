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

Jalankan migration secara berurutan, termasuk `002_secure_admin_and_invitation_status.sql` dan `003_restrict_admin_access.sql`. Migration ini mengaktifkan RLS, membatasi data untuk user yang berhasil login, dan menyediakan RPC aman untuk halaman tiket publik.

Buat user admin melalui Supabase Dashboard pada **Authentication > Users**, lalu gunakan email dan password tersebut di `/admin/login`. Semua user yang berhasil login akan dapat mengelola presensi. Aktifkan Realtime untuk tabel `attendees` jika ingin perubahan data langsung terlihat di dashboard admin.

Undangan tetap memakai link `wa.me`: setelah data tersimpan, browser membuka pesan yang sudah terisi dan status dicatat sebagai `opened` ketika tab WhatsApp berhasil dibuka.

---

## 🚀 Memulai (Local Development)

### 1. Clone Repository
```bash
git clone (https://github.com/helsach/diyf-attendance.git)
cd event-reg