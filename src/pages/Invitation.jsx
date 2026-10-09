import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../supabase';
import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Download, 
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function Invitation() {
  const [searchParams] = useSearchParams();
  const ticketCode = searchParams.get('code');
  
  const [tamu, setTamu] = useState(null);
  const [loading, setLoading] = useState(Boolean(ticketCode));
  const [error, setError] = useState(ticketCode ? '' : 'Ticket code not found in the invitation link.');
  const qrRef = useRef(null);

  useEffect(() => {
    if (!ticketCode) return;

    async function fetchTamu() {
      const { data, error } = await supabase
        .rpc('get_attendee_by_ticket', { p_ticket_code: ticketCode });

      const attendee = data?.[0];
      if (error || !attendee) {
        setError('Invitation pass not found or the link has expired.');
      } else {
        setTamu(attendee);
      }
      setLoading(false);
    }

    fetchTamu();

    const refreshTimer = setInterval(fetchTamu, 10000);

    return () => {
      clearInterval(refreshTimer);
    };
  }, [ticketCode]);

  // Download QR code to device as PNG image
  const downloadQR = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 25, 25, 250, 250);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Pass-${tamu.name}-${tamu.ticket_code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7fb] flex flex-col items-center justify-center p-4">
        <div className="w-9 h-9 border-4 border-[#492e6e]/20 border-t-[#ffb800] rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Preparing Your Pass...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7fb] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[#492e6e]/10 border border-[#492e6e]/10 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-[#492e6e]/10 text-[#492e6e] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#492e6e]/15">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Invalid Pass</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7fb] relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#ffb800]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#492e6e]/15 blur-3xl" />
      
      {/* Digital Boarding Pass Container */}
      <div className="relative w-full max-w-sm rounded-[32px] bg-white shadow-2xl shadow-[#492e6e]/20 overflow-hidden border border-[#492e6e]/10 transition-all">
        
        {/* Header Pass */}
        <div className="bg-gradient-to-br from-[#492e6e] via-[#57357b] to-[#392354] text-white px-6 pt-7 pb-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[18px] border-[#ffb800]/20" />
          <div className="absolute right-7 top-8 h-3 w-3 rounded-full bg-[#ffb800]" />
          <div className="flex items-center gap-2 min-w-0">
            <img src="/diyf-logo.png" alt="DIYF" className="h-8 w-8 shrink-0 rounded-xl bg-white object-contain p-1 shadow-md" />
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#ffb800] text-[#492e6e] shadow-sm">
              Guest Pass
            </span>
            <span className="ml-auto min-w-0 truncate font-mono text-xs font-bold text-[#ffda70]">{tamu.ticket_code}</span>
          </div>

          <div className="mt-5">
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">
              Diponegoro International Youth Festival 2026
            </h1>
            <p className="text-xs text-[#eadcf5] mt-1">Official Entry Ticket <span className="text-[#ffb800]">•</span> E-Pass</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/15 text-[11px] text-[#eadcf5]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#ffb800] shrink-0" />
              <span className="truncate">Friday, Oct 16, 2026</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <MapPin className="w-3.5 h-3.5 text-[#ffb800] shrink-0" />
              <span className="truncate">Widya Puraya, Undip</span>
            </div>
          </div>
        </div>

        {/* Perforated Cut-out Notches */}
        <div className="relative flex items-center bg-white h-7">
          <div className="w-4 h-7 bg-[#f8f7fb] rounded-r-full shadow-inner -ml-1 border-r border-[#492e6e]/10"></div>
          <div className="flex-1 border-b-2 border-dashed border-[#492e6e]/20 mx-2"></div>
          <div className="w-4 h-7 bg-[#f8f7fb] rounded-l-full shadow-inner -mr-1 border-l border-[#492e6e]/10"></div>
        </div>

        {/* Pass Content & QR Display */}
        <div className="p-6 pt-1 text-center space-y-5">
          
          <div>
            <p className="text-[10px] font-extrabold text-[#492e6e]/55 uppercase tracking-[0.2em]">Attendee Name</p>
            <h2 className="text-xl font-black text-slate-900 mt-1 tracking-tight">{tamu.name}</h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20">
                {tamu.category}
              </span>
              {tamu.is_checked_in ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb800]/20 text-[#492e6e] border border-[#ffb800]/50">
                  <CheckCircle2 className="w-3 h-3 text-[#492e6e]" /> Checked In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                  <Clock className="w-3 h-3" /> Ready to Scan
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center" ref={qrRef}>
            <div className="p-4 bg-white border-4 border-[#ffb800]/70 rounded-3xl shadow-[0_8px_25px_rgba(73,46,110,0.12)] inline-block">
              <QRCodeSVG 
                value={tamu.ticket_code} 
                size={190} 
                level="H" 
                includeMargin={false}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-[#492e6e]/55 tracking-[0.2em]">Passcode ID</span>
            <p className="font-mono font-black text-[#492e6e] tracking-widest text-base">{tamu.ticket_code}</p>
          </div>

          <button
            onClick={downloadQR}
            className="w-full py-3 px-4 bg-[#ffb800] hover:bg-[#e5a500] text-[#492e6e] rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-lg shadow-[#ffb800]/25 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Save Ticket to Device
          </button>

          <div className="rounded-xl border border-[#ffb800]/50 bg-[#ffb800]/10 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-[#492e6e]">
            Please save this ticket and keep the QR code ready for check-in.
          </div>

          <div className="pt-2 border-t border-[#492e6e]/10 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#492e6e] shrink-0" />
            Present this QR code at the check-in desk upon arrival
          </div>

        </div>

      </div>

    </div>
  );
}