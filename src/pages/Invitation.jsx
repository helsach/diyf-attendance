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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const qrRef = useRef(null);

  useEffect(() => {
    if (!ticketCode) {
      setError('Ticket code not found in the invitation link.');
      setLoading(false);
      return;
    }

    // 1. Fetch initial attendee data
    async function fetchTamu() {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('ticket_code', ticketCode)
        .single();

      if (error || !data) {
        setError('Invitation pass not found or the link has expired.');
      } else {
        setTamu(data);
      }
      setLoading(false);
    }

    fetchTamu();

    // 2. Real-time updates listener
    const channel = supabase
      .channel(`realtime-ticket-${ticketCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendees',
          filter: `ticket_code=eq.${ticketCode}`,
        },
        (payload) => {
          setTamu(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Preparing Your Pass...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Invalid Pass</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      
      {/* Digital Boarding Pass Container */}
      <div className="w-full max-w-sm rounded-[32px] bg-white shadow-xl shadow-slate-300/60 overflow-hidden border border-slate-200/80 transition-all">
        
        {/* Header Pass */}
        <div className="bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white px-6 pt-7 pb-6 relative">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
              <Sparkles className="w-3 h-3 text-amber-300" /> Guest Pass
            </span>
            <span className="font-mono text-xs font-bold text-indigo-200">{tamu.ticket_code}</span>
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">
              Diponegoro International Youth Festival 2026
            </h1>
            <p className="text-xs text-indigo-100/80 mt-1">Official Entry Ticket</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/15 text-[11px] text-indigo-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="truncate">Friday, Oct 9, 2026</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <MapPin className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="truncate">Widya Puraya, Undip</span>
            </div>
          </div>
        </div>

        {/* Perforated Cut-out Notches */}
        <div className="relative flex items-center bg-white h-7">
          <div className="w-4 h-7 bg-gradient-to-b from-slate-100 to-slate-200 rounded-r-full shadow-inner -ml-1 border-r border-slate-200"></div>
          <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2"></div>
          <div className="w-4 h-7 bg-gradient-to-b from-slate-100 to-slate-200 rounded-l-full shadow-inner -mr-1 border-l border-slate-200"></div>
        </div>

        {/* Pass Content & QR Display */}
        <div className="p-6 pt-1 text-center space-y-5">
          
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Attendee Name</p>
            <h2 className="text-xl font-black text-slate-900 mt-1 tracking-tight">{tamu.name}</h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                {tamu.category}
              </span>
              {tamu.is_checked_in ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Checked In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                  <Clock className="w-3 h-3" /> Ready to Scan
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center" ref={qrRef}>
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-inner inline-block">
              <QRCodeSVG 
                value={tamu.ticket_code} 
                size={190} 
                level="H" 
                includeMargin={false}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Passcode ID</span>
            <p className="font-mono font-black text-slate-800 tracking-widest text-base">{tamu.ticket_code}</p>
          </div>

          <button
            onClick={downloadQR}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Save Ticket to Device
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            Present this QR code at the check-in desk upon arrival
          </div>

        </div>

      </div>

    </div>
  );
}