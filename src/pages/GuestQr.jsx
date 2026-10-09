import { QRCodeSVG } from 'qrcode.react';
import { UserPlus } from 'lucide-react';

const guestCheckInUrl = new URL('/guest-checkin', window.location.origin).href;

export default function GuestQr() {
  return (
    <main className="min-h-screen bg-[#f8f7fb] flex items-center justify-center p-5">
      <section className="w-full max-w-lg rounded-[32px] bg-white p-7 sm:p-10 text-center shadow-2xl shadow-[#492e6e]/15 border border-[#492e6e]/10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#492e6e] text-[#ffb800] flex items-center justify-center">
          <UserPlus className="w-7 h-7" />
        </div>
        <h1 className="mt-5 text-2xl sm:text-3xl font-black text-[#492e6e]">Registrasi Guest</h1>
        <p className="mt-2 text-sm text-slate-500">
          Scan QR ini menggunakan kamera HP, lalu masukkan nama lengkap untuk registrasi kehadiran.
        </p>

        <div className="mt-7 inline-block rounded-3xl border-8 border-[#ffb800]/70 bg-white p-5 shadow-[0_12px_35px_rgba(73,46,110,0.14)]">
          <QRCodeSVG value={guestCheckInUrl} size={260} level="H" includeMargin />
        </div>

        <p className="mt-5 text-xs font-bold text-slate-600">Scan untuk mengisi nama</p>
        <p className="mt-2 break-all font-mono text-[10px] text-slate-400">{guestCheckInUrl}</p>
      </section>
    </main>
  );
}
