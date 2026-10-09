import { QRCodeSVG } from 'qrcode.react';
import { UserPlus } from 'lucide-react';

const publicAppUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
const registrationUrl = `${publicAppUrl}/register`;

export default function GuestQr() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full bg-[#ffb800]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-[#a66bd4]/20 blur-3xl" />

      <section className="relative w-full max-w-lg rounded-[32px] bg-white p-6 sm:p-10 text-center shadow-2xl shadow-black/30">
        <div className="flex items-center justify-center gap-3">
          <img src="/diyf-logo.png" alt="DIYF" className="h-14 w-14 rounded-2xl object-contain bg-white p-1 shadow-md ring-1 ring-[#492e6e]/10" />
          <div className="text-left">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#492e6e]/60">Official Event</p>
            <p className="text-sm font-black text-[#492e6e]">DIYF 2026</p>
          </div>
        </div>
        <div className="mx-auto mt-6 h-px w-16 bg-[#ffb800]" />
        <h1 className="mt-5 text-2xl sm:text-3xl font-black tracking-tight text-[#492e6e]">Public Registration</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Scan this QR code with your phone to register and receive your digital invitation.
        </p>

        <div className="mt-7 inline-block rounded-3xl border-[10px] border-[#ffb800]/70 bg-white p-4 shadow-[0_12px_35px_rgba(73,46,110,0.18)]">
          <QRCodeSVG value={registrationUrl} size={260} level="H" includeMargin />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#492e6e]/10 px-4 py-2 text-xs font-bold text-[#492e6e]">
          <UserPlus className="h-4 w-4 text-[#d69700]" />
          Scan to register
        </div>
        <p className="mt-5 text-[10px] font-medium text-slate-400">Diponegoro International Youth Festival 2026</p>
      </section>
    </main>
  );
}
