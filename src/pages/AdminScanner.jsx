import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabase';
import { 
  QrCode, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  Search, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  ShieldCheck,
  LogOut,
  Download,
  ExternalLink,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  MoreVertical,
  Clock
} from 'lucide-react';

const playTone = (freq, duration, soundEnabled) => {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio context not allowed yet:", e);
  }
};

import { allCountryCodes, normalizeWhatsAppNumber, isValidWhatsAppNumber } from '../utils/phoneUtils';

const SHARED_INVITATION_CODE = 'DIYF-GUEST';
const PUBLIC_APP_URL = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
const SHARED_GUEST_URL = `${PUBLIC_APP_URL}/guest-checkin`;

export default function AdminScanner() {
  const [stats, setStats] = useState({ 
    undanganHadir: 0, 
    totalUndangan: 0, 
    guestHadir: 0, 
    totalGuest: 0,
    totalHadir: 0,
    totalAll: 0
  });
  const [activeTab, setActiveTab] = useState('scanner');
  
  const [guestName, setGuestName] = useState('');
  const [invName, setInvName] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invCountryCode, setInvCountryCode] = useState('62');
  const [invCode, setInvCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  const [recentAttendees, setRecentAttendees] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const scanInProgressRef = useRef(false);
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sharedScanOpen, setSharedScanOpen] = useState(false);
  const [sharedSearch, setSharedSearch] = useState('');
  const [sharedSelectedId, setSharedSelectedId] = useState(null);
  const [sharedCheckInLoading, setSharedCheckInLoading] = useState(false);
  const [qrModalAttendee, setQrModalAttendee] = useState(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const handleCloseMenu = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActionMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleCloseMenu);
    return () => document.removeEventListener('click', handleCloseMenu);
  }, []);

  const loadData = async () => {
    const { data } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const uHadir = data.filter(d => d.category === 'undangan' && d.is_checked_in).length;
      const uTotal = data.filter(d => d.category === 'undangan').length;
      const gHadir = data.filter(d => d.category === 'guest' && d.is_checked_in).length;
      const gTotal = data.filter(d => d.category === 'guest').length;
      const totalHadir = data.filter(d => d.is_checked_in).length;
      const totalAll = data.length;

      setStats({ 
        undanganHadir: uHadir, 
        totalUndangan: uTotal, 
        guestHadir: gHadir, 
        totalGuest: gTotal,
        totalHadir,
        totalAll
      });
      setRecentAttendees(data);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-attendees-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Inisialisasi scanner video langsung tanpa UI default library
  useEffect(() => {
    if (activeTab !== 'scanner') return;

    let html5QrCode = null;
    let isRunning = false;
    let isCancelled = false;

    const onScanSuccess = async (decodedText) => {
      if (scanInProgressRef.current) return;
      scanInProgressRef.current = true;

      const code = decodedText.trim();

      try {
        if (code === SHARED_GUEST_URL) {
          playTone(920, 0.2, soundEnabledRef.current);
          showToast('Guest QR detected. Ask the guest to open this QR code on their phone.', 'warning');
          return;
        }

        if (code.toUpperCase() === SHARED_INVITATION_CODE) {
          setSharedScanOpen(true);
          setSharedSearch('');
          setSharedSelectedId(null);
          playTone(920, 0.2, soundEnabledRef.current);
          return;
        }

        const { data, error } = await supabase
          .from('attendees')
          .select('*')
          .eq('ticket_code', code)
          .single();

        if (error || !data) {
          playTone(280, 0.3, soundEnabledRef.current);
          showToast(`Unregistered QR: code "${code}" was not found.`, 'error');
          return;
        }

        if (data.is_checked_in) {
          playTone(420, 0.35, soundEnabledRef.current);
          showToast(`${data.name} has already checked in.`, 'warning');
          return;
        }

        const now = new Date().toISOString();
        const { data: checkedInAttendee, error: checkInError } = await supabase
          .from('attendees')
          .update({ is_checked_in: true, checked_in_at: now })
          .eq('id', data.id)
          .eq('is_checked_in', false)
          .select()
          .single();

        if (checkInError || !checkedInAttendee) {
          playTone(420, 0.35, soundEnabledRef.current);
          showToast(`${data.name} was just processed by another device.`, 'warning');
          return;
        }

        playTone(920, 0.2, soundEnabledRef.current);
        showToast(`Check-in successful. Welcome, ${checkedInAttendee.name}!`);
        loadData();
      } finally {
        scanInProgressRef.current = false;
      }
    };

    const startCamera = async () => {
      try {
        html5QrCode = new Html5Qrcode('reader');
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 }
          },
          onScanSuccess,
          () => {}
        );

        if (isCancelled) {
          await html5QrCode.stop();
          await html5QrCode.clear();
          return;
        }

        isRunning = true;
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to access the camera sensor:', err);
        }
      }
    };

    const timer = setTimeout(startCamera, 120);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (html5QrCode && isRunning) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch((e) => console.warn('Error cleanup camera:', e));
      }
    };
  }, [activeTab]);

  const downloadAttendeeQr = (attendee) => {
    if (!attendee) return;
    const svgElement = document.querySelector('#admin-qr-modal-svg svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 30, 30, 340, 340);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${attendee.name.replace(/[^a-zA-Z0-9]/g, '_')}-${attendee.ticket_code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const sharedSearchResults = recentAttendees.filter((attendee) => (
    attendee.name.toLowerCase().includes(sharedSearch.toLowerCase().trim()) ||
    attendee.ticket_code.toLowerCase().includes(sharedSearch.toLowerCase().trim())
  ));

  const handleSharedCheckIn = async () => {
    if (!sharedSelectedId) return;

    setSharedCheckInLoading(true);
    const selectedAttendee = recentAttendees.find((attendee) => attendee.id === sharedSelectedId);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('attendees')
      .update({ is_checked_in: true, checked_in_at: now })
      .eq('id', sharedSelectedId)
      .eq('is_checked_in', false)
      .select()
      .single();

    if (error || !data) {
      playTone(420, 0.35, soundEnabledRef.current);
      showToast(
        selectedAttendee?.is_checked_in
          ? `${selectedAttendee.name} has already checked in.`
          : 'This name was just processed by another device.',
        'warning'
      );
    } else {
      playTone(920, 0.2, soundEnabledRef.current);
      showToast(`Check-in successful. Welcome, ${data.name}!`);
      setSharedSearch('');
      setSharedSelectedId(null);
      await loadData();
    }
    setSharedCheckInLoading(false);
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsSubmitting(true);
    const guestCode = `GST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const { error } = await supabase.from('attendees').insert([{
      ticket_code: guestCode,
      name: guestName.trim(),
      category: 'guest',
      is_checked_in: true,
      checked_in_at: now
    }]);

    if (!error) {
      playTone(920, 0.15, soundEnabledRef.current);
      showToast(`Guest "${guestName}" was recorded successfully.`);
      setGuestName('');
      loadData();
    } else {
      showToast(`Failed to record guest: ${error.message}`, 'error');
    }
    setIsSubmitting(false);
  };

  const handleConfirmGuest = async (attendee) => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('attendees')
      .update({ is_checked_in: true, checked_in_at: now })
      .eq('id', attendee.id)
      .eq('is_checked_in', false)
      .select()
      .single();

    if (error || !data) {
      showToast(`${attendee.name} was already processed or could not be confirmed.`, 'warning');
      return;
    }

    playTone(920, 0.2, soundEnabledRef.current);
    showToast(`Check-in confirmed: ${data.name}.`);
    loadData();
  };

  const handleAddUndangan = async (e) => {
    e.preventDefault();
    if (!invName.trim() || !invPhone.trim()) return;

    setIsSubmitting(true);
    const code = invCode.trim() ? invCode.trim().toUpperCase() : `INV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const phone = normalizeWhatsAppNumber(invPhone, invCountryCode);

    if (!isValidWhatsAppNumber(phone)) {
      showToast('Invalid WhatsApp number. Please check country code and digits.', 'error');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('attendees').insert([{
      ticket_code: code,
      name: invName.trim(),
      phone,
      category: 'undangan',
      is_checked_in: false
    }]);

    if (error) {
      showToast(`Failed to add invitation: ${error.message}`, 'error');
    } else {
      const invitationUrl = `${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(code)}`;
      const message = `Hello ${invName.trim()}!\n\nYou are invited to the Diponegoro International Youth Festival 2026.\n\nTicket code: ${code}\n\nOpen your invitation here:\n${invitationUrl}\n\nPlease show the QR code at the check-in desk.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      await supabase.from('attendees').update({ invitation_status: 'opened' }).eq('ticket_code', code);
      showToast(`The invitation for "${invName}" is ready to send via WhatsApp.`);
      setInvName('');
      setInvPhone('');
      setInvCode('');
      loadData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('attendees').delete().eq('id', id);
    if (!error) loadData();
  };

  const copyLink = (ticketCode) => {
    const url = `${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(ticketCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(ticketCode);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const openWhatsApp = async (attendee) => {
    if (!attendee.phone) {
      showToast('The guest does not have a WhatsApp number.', 'error');
      return;
    }

    const phone = attendee.phone.replace(/[^\d+]/g, '').replace(/^0/, '62');
    const invitationUrl = `${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(attendee.ticket_code)}`;
    const message = `Hello ${attendee.name}!\n\nYou are invited to the Diponegoro International Youth Festival 2026.\n\nTicket code: ${attendee.ticket_code}\n\nOpen your invitation here:\n${invitationUrl}\n\nPlease show the QR code at the check-in desk.`;
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');

    if (attendee.invitation_status !== 'opened') {
      await supabase.from('attendees').update({ invitation_status: 'opened' }).eq('id', attendee.id);
      setRecentAttendees((items) => items.map((item) => (
        item.id === attendee.id ? { ...item, invitation_status: 'opened' } : item
      )));
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsSubmitting(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      const attendees = rows
        .map((row, index) => {
          const normalized = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value).trim()])
          );
          const name = normalized.nama || normalized.name;
          const rawPhone = normalized['nomor whatsapp'] || normalized.whatsapp || normalized.phone || normalized.telepon;
          const phone = rawPhone ? normalizeWhatsAppNumber(rawPhone, '62') : '';
          const ticketCode = (normalized['kode tiket'] || normalized.ticket_code || '').toUpperCase();

          if (!name || !phone || !isValidWhatsAppNumber(phone)) {
            throw new Error(`Row ${index + 2}: name or WhatsApp number is invalid.`);
          }

          return {
            ticket_code: ticketCode || `INV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            name,
            phone,
            category: 'undangan',
            is_checked_in: false
          };
        });

      if (attendees.length === 0) throw new Error('The Excel file contains no data.');
      const { error } = await supabase.from('attendees').insert(attendees);
      if (error) throw error;

      showToast(`${attendees.length} invitations imported successfully. Use the WhatsApp button in the list to send them.`);
      await loadData();
      setActiveTab('pending');
    } catch (error) {
      showToast(`Excel import failed: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoCheckIn = async (attendee) => {
    const confirmUndo = window.confirm(`Cancel check-in status for "${attendee.name}"? The guest will be moved back to the Pending list.`);
    if (!confirmUndo) return;

    const { data, error } = await supabase
      .from('attendees')
      .update({ is_checked_in: false, checked_in_at: null })
      .eq('id', attendee.id)
      .eq('is_checked_in', true)
      .select()
      .single();

    if (error || !data) {
      showToast('Failed to undo check-in.', 'error');
    } else {
      playTone(420, 0.2, soundEnabledRef.current);
      showToast(`Check-in cancelled for ${data.name}.`);
      loadData();
    }
  };

  const getTabAttendees = () => {
    if (activeTab === 'checked_in') {
      return recentAttendees.filter(item => item.is_checked_in);
    }
    if (activeTab === 'pending') {
      return recentAttendees.filter(item => !item.is_checked_in);
    }
    if (activeTab === 'all') {
      return recentAttendees;
    }
    // Default when entering from 'list'
    return recentAttendees.filter(item => !item.is_checked_in);
  };

  const currentTabAttendees = getTabAttendees();

  const filteredAttendees = currentTabAttendees.filter(item => 
    item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.ticket_code.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / pageSize));
  const paginatedAttendees = filteredAttendees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (event) => {
    setSearchFilter(event.target.value);
    setCurrentPage(1);
  };

  const exportExcel = () => {
    const attendanceRows = recentAttendees.map((item, index) => ({
      No: index + 1,
      'Ticket Code': item.ticket_code,
      'Full Name': item.name,
      'WhatsApp Number': item.phone ?? '',
      Event: 'Food Festival',
      'Faculty / Institution': item.faculty ?? '',
      'NIM / NIP': item.student_number ?? '',
      'International Student': item.international_student ? 'Yes' : 'No',
      Category: item.category,
      'Check-In Status': item.is_checked_in ? 'Checked In' : 'Pending',
      'Invitation Status': item.invitation_status ?? 'Pending'
    }));
    const checkedInCount = recentAttendees.filter((item) => item.is_checked_in).length;
    const categoryCounts = recentAttendees.reduce((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, {});
    const summaryRows = [
      { Metric: 'Total Attendees', Value: recentAttendees.length },
      { Metric: 'Checked In', Value: checkedInCount },
      { Metric: 'Pending Check-In', Value: recentAttendees.length - checkedInCount },
      ...Object.entries(categoryCounts).map(([category, count]) => ({
        Metric: `Category: ${category}`,
        Value: count
      }))
    ];
    const workbook = XLSX.utils.book_new();
    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows);
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

    attendanceSheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 }
    ];
    attendanceSheet['!autofilter'] = { ref: `A1:G${Math.max(1, attendanceRows.length + 1)}` };
    attendanceSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    summarySheet['!cols'] = [{ wch: 24 }, { wch: 14 }];
    summarySheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.writeFile(workbook, `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Attendance Excel file downloaded successfully.');
  };

  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-800 font-sans pb-16 antialiased">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#492e6e]/10 px-3 sm:px-8 py-2.5 sm:py-3.5 shadow-[0_8px_30px_rgba(73,46,110,0.08)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-white border border-[#ffb800]/50 flex items-center justify-center shadow-md shadow-[#492e6e]/15 overflow-hidden shrink-0">
              <img src="/diyf-logo.png" alt="DIYF" className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-slate-900 text-sm sm:text-base truncate">DIYF Attendance</span>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40 uppercase">
                  Admin Deck
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Live Attendance & Fast-track Gate</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#ffb800]/15 border-[#ffb800]/40 text-[#492e6e]'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Audio On' : 'Mute'}</span>
            </button>
            <button 
              onClick={loadData}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Invited Guests</span>
              <span className="p-2 rounded-xl bg-[#492e6e]/10 text-[#492e6e]"><Users className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.undanganHadir}</span>
              <span className="text-xs font-semibold text-slate-500">/ {stats.totalUndangan} checked in</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-[#ffb800] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalUndangan > 0 ? (stats.undanganHadir / stats.totalUndangan) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-medium">
              VIP & Special Invitations
            </div>
          </div>

          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Registered Guests</span>
              <span className="p-2 rounded-xl bg-[#ffb800]/15 text-[#492e6e]"><UserPlus className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#492e6e]">{stats.guestHadir}</span>
              <span className="text-xs font-semibold text-slate-500">/ {stats.totalGuest} checked in</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-[#492e6e] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalGuest > 0 ? (stats.guestHadir / stats.totalGuest) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse"></span> {stats.totalGuest - stats.guestHadir} pending check-in • Public & Desk
            </div>
          </div>

          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Total Attendance</span>
              <span className="p-2 rounded-xl bg-[#492e6e]/10 text-[#492e6e]"><ShieldCheck className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.totalHadir}</span>
              <span className="text-xs font-semibold text-slate-500">/ {stats.totalAll} checked in</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalAll > 0 ? (stats.totalHadir / stats.totalAll) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-medium">
              {stats.totalHadir} on-site • Automatically synchronized
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start overflow-x-auto pb-1 -mx-1 px-1">
          <div className="p-1 bg-slate-200/80 rounded-2xl flex gap-1 border border-slate-300/60 min-w-max">
            {[
              { id: 'scanner', label: 'Scan Ticket QR', icon: QrCode },
              { id: 'guest', label: 'Walk-In Guest', icon: UserPlus },
              { id: 'tambah_undangan', label: 'Add Invitation', icon: Sparkles },
              { 
                id: 'pending', 
                label: `Pending Check-In (${stats.totalAll - stats.totalHadir})`, 
                icon: Clock 
              },
              { 
                id: 'checked_in', 
                label: `Checked In (${stats.totalHadir})`, 
                icon: CheckCircle2 
              }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id || (tab.id === 'pending' && (activeTab === 'list' || activeTab === 'all'));
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-[#492e6e] text-white shadow-md shadow-[#492e6e]/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffb800]' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'scanner' && (
          <div className="bg-white border border-[#492e6e]/10 rounded-[28px] sm:rounded-[32px] p-4 sm:p-8 shadow-[0_12px_40px_rgba(73,46,110,0.08)] max-w-lg mx-auto text-center space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">QR Code Scanner</h3>
              <p className="text-xs text-slate-500 mt-0.5">Position the guest ticket QR code in the center of the scanner.</p>
            </div>

            <div className="rounded-2xl overflow-hidden border-4 border-[#ffb800]/70 bg-[#492e6e] shadow-inner">
              <div id="reader" className="w-full"></div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse"></span>
              Camera active automatically
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-700">Public Registration QR</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Open the dedicated page to display or print the registration QR code.
              </p>
              <a
                href="/guest-qr"
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-3 items-center justify-center px-4 py-2.5 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition"
              >
                Open Public QR Page
              </a>
            </div>

            {sharedScanOpen && (
              <div className="border-t border-slate-200 pt-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Select Guest Name</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Search for the arriving guest, then confirm.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSharedScanOpen(false);
                      setSharedSearch('');
                      setSharedSelectedId(null);
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>

                <div className="relative mt-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="search"
                    value={sharedSearch}
                    onChange={(event) => setSharedSearch(event.target.value)}
                    placeholder="Type guest name..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white"
                  />
                </div>

                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {sharedSearchResults.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-slate-400">No names found.</p>
                  ) : (
                    sharedSearchResults.map((attendee) => (
                      <button
                        type="button"
                        key={attendee.id}
                        onClick={() => setSharedSelectedId(attendee.id)}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition ${
                          sharedSelectedId === attendee.id
                            ? 'bg-[#492e6e] text-white'
                            : 'bg-slate-50 hover:bg-[#492e6e]/10 text-slate-800'
                        }`}
                      >
                        <span className="font-bold">{attendee.name}</span>
                        <span className={`text-[10px] font-bold ${sharedSelectedId === attendee.id ? 'text-[#ffda70]' : attendee.is_checked_in ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {attendee.is_checked_in ? 'Already checked in' : 'Pending'}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSharedCheckIn}
                  disabled={!sharedSelectedId || sharedCheckInLoading || recentAttendees.find((attendee) => attendee.id === sharedSelectedId)?.is_checked_in}
                  className="w-full mt-3 py-3 bg-[#492e6e] hover:bg-[#392354] text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {sharedCheckInLoading ? 'Processing...' : 'Confirm Attendance'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guest' && (
          <div className="bg-white border border-slate-200 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 shadow-sm max-w-md mx-auto">
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40">
                Registration Desk
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Quick Walk-In Guest Registration</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter a guest name, submit it, and attendance will be recorded immediately.
              </p>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Guest Name *</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter the full name..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !guestName.trim()}
                className="w-full py-3.5 bg-[#492e6e] hover:bg-[#392354] text-white font-bold rounded-xl shadow-lg shadow-[#492e6e]/20 transition disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#ffb800]" />
                {isSubmitting ? 'Processing...' : 'Confirm Entry'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'tambah_undangan' && (
          <div className="bg-white border border-slate-200 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 shadow-sm max-w-md mx-auto">
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20">
                Pre-Event
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Create VIP/Guest Invitation</h3>
              <p className="text-xs text-slate-500 mt-1">
                The guest will receive a digital e-pass link with a personal QR code.
              </p>
            </div>

            <form onSubmit={handleAddUndangan} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Invited Guest Name *</label>
                <input
                  type="text"
                  required
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="Example: Mr. Bambang Wijaya"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white text-sm transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">WhatsApp Number *</label>
                <div className="flex gap-2">
                  <div className="relative w-36 shrink-0">
                    <select
                      value={invCountryCode}
                      onChange={(e) => setInvCountryCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] truncate"
                    >
                      {allCountryCodes.map((c, idx) => (
                        <option key={`${c.code}-${idx}`} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={invPhone}
                      onChange={(e) => setInvPhone(e.target.value)}
                      placeholder="8123456789 or +60..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white text-sm transition"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Supports domestic and international WhatsApp numbers.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Ticket Code (Optional)</label>
                <input
                  type="text"
                  value={invCode}
                  onChange={(e) => setInvCode(e.target.value)}
                  placeholder="Leave blank to generate automatically (e.g. INV-7K9A)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !invName.trim() || !invPhone.trim()}
                className="w-full py-3.5 bg-gradient-to-tr from-[#492e6e] to-[#6d4792] hover:from-[#392354] hover:to-[#492e6e] text-white font-bold rounded-xl shadow-lg shadow-[#492e6e]/20 transition disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isSubmitting ? 'Creating Ticket...' : 'Save & Generate Ticket'}
              </button>
            </form>
          </div>
        )}

        {(activeTab === 'pending' || activeTab === 'checked_in' || activeTab === 'all' || activeTab === 'list') && (
          <div className="bg-white border border-slate-200 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">
                    {activeTab === 'checked_in' ? 'Checked In Attendees' : activeTab === 'all' ? 'All Attendees' : 'Pending Check-In'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20">
                    {activeTab === 'checked_in' ? `${stats.totalHadir} on-site` : activeTab === 'all' ? `${stats.totalAll} total` : `${stats.totalAll - stats.totalHadir} waiting`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTab === 'checked_in'
                    ? 'Guests who have successfully checked in on-site'
                    : activeTab === 'all'
                      ? 'List of all registered guests and invitations'
                      : 'Guests who have not checked in yet (moves automatically to Checked In upon check-in)'}
                </p>
              </div>

              {/* Sub-filter pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit overflow-x-auto min-w-0 max-w-full pb-1 sm:pb-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'pending' || activeTab === 'list'
                      ? 'bg-white text-[#492e6e] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending ({stats.totalAll - stats.totalHadir})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('checked_in'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'checked_in'
                      ? 'bg-white text-[#492e6e] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Checked In ({stats.totalHadir})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-[#492e6e] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({stats.totalAll})
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={handleSearchChange}
                  placeholder="Search by name or ticket code..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white transition"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <label className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold cursor-pointer shadow-sm">
                  <FileSpreadsheet className="w-4 h-4 text-[#ffb800]" />
                  Import Excel
                  <input type="file" accept=".xlsx,.xls" onChange={importExcel} disabled={isSubmitting} className="hidden" />
                </label>
                <button onClick={exportExcel} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer">
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>

            {/* Mobile Card List (visible on phones, hidden on sm+) */}
            <div className="block sm:hidden space-y-3">
              {filteredAttendees.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {activeTab === 'checked_in' 
                    ? 'No guests have checked in yet.' 
                    : activeTab === 'pending' 
                      ? 'All registered guests have checked in!' 
                      : 'No matching guests found.'}
                </div>
              ) : (
                paginatedAttendees.map((item) => (
                  <div key={`m-${item.id}`} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setQrModalAttendee(item)}
                        className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-[#492e6e] bg-white border border-[#492e6e]/15 px-2.5 py-1 rounded-xl shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#ffb800]" />
                        {item.ticket_code}
                      </button>

                      {item.is_checked_in ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb800]/20 text-[#492e6e] border border-[#ffb800]/50 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-[#492e6e]" /> Checked In
                          </span>
                          {item.checked_in_at && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-500 border border-slate-200">
                          Pending
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{item.name}</h4>
                      {(item.faculty || item.student_number) && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {[item.faculty, item.student_number && `NIM/NIP: ${item.student_number}`].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        item.category === 'undangan' 
                          ? 'bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20'
                          : 'bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40'
                      }`}>
                        {item.category === 'undangan' ? 'Invitation' : 'Guest'}
                      </span>

                      <span className="px-2 py-0.5 rounded-full font-extrabold bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40">
                        Food Festival
                      </span>

                      {item.category === 'guest' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20">
                          <Check className="w-3 h-3 text-[#ffb800]" />
                          {item.invitation_status === 'opened' ? 'Ticket Issued' : 'Registered'}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                          item.invitation_status === 'opened' || item.invitation_status === 'sent' 
                            ? 'bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {item.invitation_status === 'opened' ? 'Pass Opened' : item.invitation_status === 'sent' ? 'Sent' : 'Not Sent'}
                        </span>
                      )}
                    </div>

                    {/* Actions row for Mobile */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-1.5">
                      {!item.is_checked_in ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmGuest(item)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb800]" />
                          Confirm Check-In
                        </button>
                      ) : (
                        <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setQrModalAttendee(item)}
                          className="p-2 rounded-xl bg-white hover:bg-[#492e6e]/10 text-[#492e6e] border border-slate-200 shadow-2xs transition cursor-pointer"
                          title="View QR Code & Ticket"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {item.phone && (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(item)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 shadow-2xs transition cursor-pointer"
                            title="Send via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        <div className="relative action-menu-container inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpenId(actionMenuOpenId === `m-${item.id}` ? null : `m-${item.id}`);
                            }}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-2xs transition cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === `m-${item.id}` && (
                            <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                              <a
                                href={`${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(item.ticket_code)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setActionMenuOpenId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#492e6e] font-semibold transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#ffb800]" />
                                Open Ticket Pass
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  copyLink(item.ticket_code);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#492e6e] font-semibold transition text-left cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                Copy Ticket Link
                              </button>

                              {item.is_checked_in && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUndoCheckIn(item);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 font-semibold transition text-left cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                                  Undo Check-In
                                </button>
                              )}

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={() => {
                                  handleDelete(item.id, item.name);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Attendee
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (hidden on small screens, visible on sm+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Faculty / NIM/NIP</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Invitation</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400">
                        {activeTab === 'checked_in' 
                          ? 'No guests have checked in yet.' 
                          : activeTab === 'pending' 
                            ? 'All registered guests have checked in!' 
                            : 'No matching guests found.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendees.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          <button
                            type="button"
                            onClick={() => setQrModalAttendee(item)}
                            className="inline-flex items-center gap-1.5 hover:text-[#492e6e] text-slate-800 transition cursor-pointer font-mono font-bold"
                            title="Click to view QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ffb800]" />
                            {item.ticket_code}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex rounded-full border border-[#ffb800]/40 bg-[#ffb800]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#492e6e]">
                            Food Festival
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.faculty || item.student_number ? (
                            <div className="leading-relaxed">
                              <div className="font-semibold text-slate-700">{item.faculty || '-'}</div>
                              <div className="text-[10px] text-slate-400">{item.student_number ? `NIM/NIP: ${item.student_number}` : '-'}</div>
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            item.category === 'undangan' 
                              ? 'bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20'
                              : 'bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40'
                          }`}>
                            {item.category === 'undangan' ? 'Invitation' : 'Guest'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.is_checked_in ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-[#492e6e]" /> Checked In
                              </span>
                              {item.checked_in_at && (
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 whitespace-nowrap">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.category === 'guest' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20 whitespace-nowrap">
                              <Check className="w-3 h-3 text-[#ffb800]" />
                              {item.invitation_status === 'opened' ? 'Ticket Issued' : 'Registered'}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              item.invitation_status === 'opened' || item.invitation_status === 'sent' 
                                ? 'bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {item.invitation_status === 'opened' 
                                ? 'Pass Opened' 
                                : item.invitation_status === 'sent' 
                                  ? 'Sent' 
                                  : 'Not Sent'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            {/* Primary Confirm button if not checked in */}
                            {!item.is_checked_in && (
                              <button
                                type="button"
                                onClick={() => handleConfirmGuest(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                                title="Confirm Check-In"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb800]" />
                                Confirm
                              </button>
                            )}

                            {/* QR Code modal button */}
                            <button
                              type="button"
                              onClick={() => setQrModalAttendee(item)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#492e6e]/10 text-slate-700 hover:text-[#492e6e] border border-slate-200 transition cursor-pointer"
                              title="View QR Code & Ticket"
                            >
                              <QrCode className="w-3.5 h-3.5 text-[#492e6e]" />
                            </button>

                            {/* WhatsApp button if phone exists */}
                            {item.phone && (
                              <button
                                type="button"
                                onClick={() => openWhatsApp(item)}
                                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 transition cursor-pointer"
                                title="Send via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* More actions dropdown (•••) */}
                            <div className="relative action-menu-container inline-block">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuOpenId(actionMenuOpenId === item.id ? null : item.id);
                                }}
                                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {actionMenuOpenId === item.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                                  <a
                                    href={`${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(item.ticket_code)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setActionMenuOpenId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#492e6e] font-semibold transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#ffb800]" />
                                    Open Ticket Pass
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      copyLink(item.ticket_code);
                                      setActionMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#492e6e] font-semibold transition text-left cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    Copy Ticket Link
                                  </button>

                                  {item.is_checked_in && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUndoCheckIn(item);
                                        setActionMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 font-semibold transition text-left cursor-pointer"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                                      Undo Check-In
                                    </button>
                                  )}

                                  <div className="my-1 border-t border-slate-100" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(item.id, item.name);
                                      setActionMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition text-left cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Attendee
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">{filteredAttendees.length} records</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-slate-600">Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal for any Attendee */}
      {qrModalAttendee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#492e6e]/20 w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[32px] p-5 sm:p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setQrModalAttendee(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                qrModalAttendee.category === 'undangan'
                  ? 'bg-[#492e6e]/10 text-[#492e6e] border border-[#492e6e]/20'
                  : 'bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40'
              }`}>
                {qrModalAttendee.category === 'undangan' ? 'Invitation' : 'Guest'}
              </span>
              {qrModalAttendee.is_checked_in ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb800]/20 text-[#492e6e] border border-[#ffb800]/50">
                  <CheckCircle2 className="w-3 h-3 text-[#492e6e]" /> Checked In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Pending
                </span>
              )}
            </div>

            <h3 className="text-base font-black text-slate-900 truncate px-4">{qrModalAttendee.name}</h3>
            {(qrModalAttendee.faculty || qrModalAttendee.student_number) && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {[qrModalAttendee.faculty, qrModalAttendee.student_number && `NIM/NIP: ${qrModalAttendee.student_number}`].filter(Boolean).join(' • ')}
              </p>
            )}

            {/* QR Code Container */}
            <div id="admin-qr-modal-svg" className="inline-block my-4 p-3 bg-white rounded-2xl border-4 border-[#ffb800]/70 shadow-md">
              <QRCodeSVG
                value={qrModalAttendee.ticket_code}
                size={190}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Ticket code & copy */}
            <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono">
              <span className="text-xs text-slate-400">Code:</span>
              <span className="text-sm font-black text-[#492e6e] tracking-wider">{qrModalAttendee.ticket_code}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrModalAttendee.ticket_code);
                  showToast('Ticket code copied!');
                }}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                title="Copy code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => downloadAttendeeQr(qrModalAttendee)}
                className="w-full py-2.5 px-3 bg-[#ffb800] hover:bg-[#e5a500] text-[#492e6e] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </button>
              <a
                href={`${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(qrModalAttendee.ticket_code)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-[#492e6e] hover:bg-[#392354] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#ffb800]" />
                Open Pass
              </a>
            </div>

            {!qrModalAttendee.is_checked_in && (
              <button
                type="button"
                onClick={async () => {
                  await handleConfirmGuest(qrModalAttendee);
                  setQrModalAttendee((prev) => prev ? { ...prev, is_checked_in: true } : null);
                }}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Check-In
              </button>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-xs font-bold shadow-lg ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {toast.message}
        </div>
      )}

    </div>
  );
}