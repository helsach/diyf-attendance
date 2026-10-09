import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  ChevronRight
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

const countryCodes = [
  ['93', 'Afghanistan'], ['355', 'Albania'], ['213', 'Algeria'], ['376', 'Andorra'], ['244', 'Angola'],
  ['1268', 'Antigua dan Barbuda'], ['54', 'Argentina'], ['374', 'Armenia'], ['297', 'Aruba'], ['61', 'Australia'],
  ['43', 'Austria'], ['994', 'Azerbaijan'], ['1242', 'Bahamas'], ['973', 'Bahrain'], ['880', 'Bangladesh'],
  ['1246', 'Barbados'], ['375', 'Belarus'], ['32', 'Belgia'], ['501', 'Belize'], ['229', 'Benin'],
  ['975', 'Bhutan'], ['591', 'Bolivia'], ['387', 'Bosnia dan Herzegovina'], ['267', 'Botswana'], ['55', 'Brasil'],
  ['673', 'Brunei'], ['359', 'Bulgaria'], ['226', 'Burkina Faso'], ['257', 'Burundi'], ['238', 'Cabo Verde'],
  ['855', 'Kamboja'], ['237', 'Kamerun'], ['1', 'Kanada'], ['236', 'Republik Afrika Tengah'], ['235', 'Chad'],
  ['56', 'Chile'], ['86', 'China'], ['57', 'Kolombia'], ['269', 'Komoro'], ['242', 'Kongo'],
  ['243', 'Republik Demokratik Kongo'], ['682', 'Kepulauan Cook'], ['506', 'Kosta Rika'], ['385', 'Kroasia'],
  ['53', 'Kuba'], ['357', 'Siprus'], ['420', 'Ceko'], ['45', 'Denmark'], ['253', 'Djibouti'],
  ['1767', 'Dominika'], ['1809', 'Republik Dominika'], ['593', 'Ekuador'], ['20', 'Mesir'], ['503', 'El Salvador'],
  ['240', 'Guinea Khatulistiwa'], ['291', 'Eritrea'], ['372', 'Estonia'], ['268', 'Eswatini'], ['251', 'Ethiopia'],
  ['679', 'Fiji'], ['358', 'Finlandia'], ['33', 'Prancis'], ['241', 'Gabon'], ['220', 'Gambia'],
  ['995', 'Georgia'], ['49', 'Jerman'], ['233', 'Ghana'], ['30', 'Yunani'], ['1473', 'Grenada'],
  ['502', 'Guatemala'], ['224', 'Guinea'], ['245', 'Guinea-Bissau'], ['592', 'Guyana'], ['509', 'Haiti'],
  ['504', 'Honduras'], ['852', 'Hong Kong'], ['36', 'Hungaria'], ['354', 'Islandia'], ['91', 'India'],
  ['62', 'Indonesia'], ['98', 'Iran'], ['964', 'Irak'], ['353', 'Irlandia'], ['972', 'Israel'],
  ['39', 'Italia'], ['225', 'Pantai Gading'], ['1876', 'Jamaika'], ['81', 'Jepang'], ['962', 'Yordania'],
  ['7', 'Kazakhstan / Rusia'], ['254', 'Kenya'], ['686', 'Kiribati'], ['383', 'Kosovo'], ['965', 'Kuwait'],
  ['996', 'Kirgizstan'], ['856', 'Laos'], ['371', 'Latvia'], ['961', 'Lebanon'], ['266', 'Lesotho'],
  ['231', 'Liberia'], ['218', 'Libya'], ['423', 'Liechtenstein'], ['370', 'Lithuania'], ['352', 'Luksemburg'],
  ['853', 'Makau'], ['261', 'Madagaskar'], ['265', 'Malawi'], ['60', 'Malaysia'], ['960', 'Maladewa'],
  ['223', 'Mali'], ['356', 'Malta'], ['692', 'Kepulauan Marshall'], ['222', 'Mauritania'], ['230', 'Mauritius'],
  ['52', 'Meksiko'], ['691', 'Mikronesia'], ['373', 'Moldova'], ['377', 'Monako'], ['976', 'Mongolia'],
  ['382', 'Montenegro'], ['212', 'Maroko'], ['258', 'Mozambik'], ['95', 'Myanmar'], ['264', 'Namibia'],
  ['674', 'Nauru'], ['977', 'Nepal'], ['31', 'Belanda'], ['64', 'Selandia Baru'], ['505', 'Nikaragua'],
  ['227', 'Niger'], ['234', 'Nigeria'], ['683', 'Niue'], ['850', 'Korea Utara'], ['389', 'Makedonia Utara'],
  ['47', 'Norwegia'], ['968', 'Oman'], ['92', 'Pakistan'], ['680', 'Palau'], ['970', 'Palestina'],
  ['507', 'Panama'], ['675', 'Papua Nugini'], ['595', 'Paraguay'], ['51', 'Peru'], ['63', 'Filipina'],
  ['48', 'Polandia'], ['351', 'Portugal'], ['974', 'Qatar'], ['40', 'Rumania'], ['250', 'Rwanda'],
  ['1869', 'Saint Kitts dan Nevis'], ['1758', 'Saint Lucia'], ['1784', 'Saint Vincent dan Grenadine'], ['685', 'Samoa'],
  ['378', 'San Marino'], ['239', 'Sao Tome dan Principe'], ['966', 'Arab Saudi'], ['221', 'Senegal'], ['381', 'Serbia'],
  ['248', 'Seychelles'], ['232', 'Sierra Leone'], ['65', 'Singapura'], ['421', 'Slovakia'], ['386', 'Slovenia'],
  ['677', 'Kepulauan Solomon'], ['252', 'Somalia'], ['27', 'Afrika Selatan'], ['82', 'Korea Selatan'], ['211', 'Sudan Selatan'],
  ['34', 'Spanyol'], ['94', 'Sri Lanka'], ['249', 'Sudan'], ['597', 'Suriname'], ['46', 'Swedia'],
  ['41', 'Swiss'], ['963', 'Suriah'], ['886', 'Taiwan'], ['992', 'Tajikistan'], ['255', 'Tanzania'],
  ['66', 'Thailand'], ['670', 'Timor-Leste'], ['228', 'Togo'], ['690', 'Tokelau'], ['676', 'Tonga'],
  ['1868', 'Trinidad dan Tobago'], ['216', 'Tunisia'], ['90', 'Turki'], ['993', 'Turkmenistan'], ['688', 'Tuvalu'],
  ['256', 'Uganda'], ['380', 'Ukraina'], ['971', 'Uni Emirat Arab'], ['44', 'Britania Raya'], ['1', 'Amerika Serikat'],
  ['598', 'Uruguay'], ['998', 'Uzbekistan'], ['678', 'Vanuatu'], ['379', 'Vatikan'], ['58', 'Venezuela'],
  ['84', 'Vietnam'], ['681', 'Wallis dan Futuna'], ['967', 'Yaman'], ['260', 'Zambia'], ['263', 'Zimbabwe']
].map(([code, name]) => ({ code, name }));
void countryCodes;
const SHARED_INVITATION_CODE = 'DIYF-GUEST';
const PUBLIC_APP_URL = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
const SHARED_GUEST_URL = `${PUBLIC_APP_URL}/guest-checkin`;

export default function AdminScanner() {
  const [stats, setStats] = useState({ undanganHadir: 0, totalUndangan: 0, guestHadir: 0 });
  const [activeTab, setActiveTab] = useState('scanner');
  
  const [guestName, setGuestName] = useState('');
  const [invName, setInvName] = useState('');
  const [invPhone, setInvPhone] = useState('');
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
  const pageSize = 10;

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const loadData = async () => {
    const { data } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const uHadir = data.filter(d => d.category === 'undangan' && d.is_checked_in).length;
      const uTotal = data.filter(d => d.category === 'undangan').length;
      const gHadir = data.filter(d => d.category === 'guest' && d.is_checked_in).length;
      setStats({ undanganHadir: uHadir, totalUndangan: uTotal, guestHadir: gHadir });
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

  const sharedSearchResults = recentAttendees.filter((attendee) => (
    attendee.category === 'undangan' &&
    attendee.name.toLowerCase().includes(sharedSearch.toLowerCase().trim())
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
      .eq('category', 'undangan')
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
      .eq('category', 'guest')
      .eq('is_checked_in', false)
      .select()
      .single();

    if (error || !data) {
      showToast(`${attendee.name} was already processed or could not be confirmed.`, 'warning');
      return;
    }

    playTone(920, 0.2, soundEnabledRef.current);
    showToast(`Guest check-in confirmed: ${data.name}.`);
    loadData();
  };

  const handleAddUndangan = async (e) => {
    e.preventDefault();
    if (!invName.trim() || !invPhone.trim()) return;

    setIsSubmitting(true);
    const code = invCode.trim() ? invCode.trim().toUpperCase() : `INV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const phone = invPhone.replace(/[^\d+]/g, '').replace(/^0/, '62');

    if (!/^\+?\d{10,15}$/.test(phone)) {
      showToast('Invalid WhatsApp number. Use the 08... or 628... format.', 'error');
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
      const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
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
    const confirmDelete = window.confirm(`Yakin ingin menghapus data "${name}"?`);
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
          const phone = rawPhone?.replace(/[^\d+]/g, '').replace(/^0/, '62');
          const ticketCode = (normalized['kode tiket'] || normalized.ticket_code || '').toUpperCase();

          if (!name || !phone || !/^\+?\d{10,15}$/.test(phone)) {
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
      setActiveTab('list');
    } catch (error) {
      showToast(`Excel import failed: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAttendees = recentAttendees.filter(item => 
    item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.ticket_code.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / pageSize));
  const paginatedAttendees = filteredAttendees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (event) => {
    setSearchFilter(event.target.value);
    setCurrentPage(1);
  };

  const exportCsv = () => {
    const headers = ['Ticket', 'Name', 'WhatsApp', 'Category', 'Check-In Status', 'Invitation Status'];
    const rows = recentAttendees.map((item) => [
      item.ticket_code,
      item.name,
      item.phone ?? '',
      item.category,
      item.is_checked_in ? 'Checked In' : 'Pending',
      item.invitation_status ?? 'pending'
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekap-kehadiran-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Attendance CSV downloaded successfully.');
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
          </div>

          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Guest Walk-In</span>
              <span className="p-2 rounded-xl bg-[#ffb800]/15 text-[#492e6e]"><UserPlus className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#492e6e]">{stats.guestHadir}</span>
              <span className="text-xs font-semibold text-slate-500">guests on-site</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse"></span> Manual registration desk
            </div>
          </div>

          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Total Attendance</span>
              <span className="p-2 rounded-xl bg-[#492e6e]/10 text-[#492e6e]"><ShieldCheck className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.undanganHadir + stats.guestHadir}</span>
              <span className="text-xs font-semibold text-slate-500">people on-site</span>
            </div>
            <div className="mt-4 text-[11px] text-slate-500 font-medium">
              Automatically synchronized
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start overflow-x-auto pb-1 -mx-1 px-1">
          <div className="p-1 bg-slate-200/80 rounded-2xl flex gap-1 border border-slate-300/60 min-w-max">
            {[
              { id: 'scanner', label: 'Scan Ticket QR', icon: QrCode },
              { id: 'guest', label: 'Walk-In Guest', icon: UserPlus },
              { id: 'tambah_undangan', label: 'Add Invitation', icon: Sparkles },
              { id: 'list', label: `Attendance List (${recentAttendees.length})`, icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
              <p className="text-xs font-bold text-slate-700">Shared Guest QR</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Open the dedicated page to display or print this QR code.
              </p>
              <a
                href="/guest-qr"
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-3 items-center justify-center px-4 py-2.5 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition"
              >
                Open Guest QR Page
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
                    placeholder="Ketik nama tamu..."
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
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={invPhone}
                    onChange={(e) => setInvPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white text-sm transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">WhatsApp will open with a pre-filled invitation message.</p>
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

        {activeTab === 'list' && (
          <div className="bg-white border border-slate-200 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Attendance Summary</h3>
                <p className="text-xs text-slate-500">Manage WhatsApp invitations or guest entries</p>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72 col-span-2 sm:col-auto">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={handleSearchChange}
                    placeholder="Search by name or ticket code..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white transition"
                  />
                </div>
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold cursor-pointer shadow-sm">
                  <FileSpreadsheet className="w-4 h-4 text-[#ffb800]" />
                  Import Excel
                  <input type="file" accept=".xlsx,.xls" onChange={importExcel} disabled={isSubmitting} className="hidden" />
                </label>
                <button onClick={exportCsv} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Invitation</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400">No matching guests found.</td>
                    </tr>
                  ) : (
                    paginatedAttendees.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.ticket_code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb800]/15 text-[#492e6e] border border-[#ffb800]/40">
                              <CheckCircle2 className="w-3 h-3 text-[#492e6e]" /> Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.category === 'undangan' ? (
                            <span className={`text-[10px] font-bold uppercase ${item.invitation_status === 'opened' || item.invitation_status === 'sent' ? 'text-[#492e6e]' : 'text-slate-400'}`}>
                              {item.invitation_status === 'opened' ? 'Link opened' : item.invitation_status === 'sent' ? 'Sent' : 'Not sent'}
                            </span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.category === 'undangan' && (
                              <a
                                href={`${PUBLIC_APP_URL}/invitation?code=${encodeURIComponent(item.ticket_code)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#492e6e] hover:bg-[#392354] text-white text-[11px] font-bold shadow-sm transition"
                                title="Open invitation link"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#ffb800]" />
                                Open
                              </a>
                            )}
                            {item.category === 'undangan' && (
                              <button
                                onClick={() => openWhatsApp(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[11px] font-bold shadow-sm transition cursor-pointer"
                                title="Send invitation via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WA
                              </button>
                            )}
                            {item.category === 'undangan' && (
                              <button
                                onClick={() => copyLink(item.ticket_code)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#ffb800] bg-white text-[11px] font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                                title="Copy invitation link"
                              >
                                {copiedCode === item.ticket_code ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#492e6e]" />
                                    <span className="text-[#492e6e]">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    Link
                                  </>
                                )}
                              </button>
                            )}
                            {item.category === 'guest' && !item.is_checked_in && (
                              <button
                                onClick={() => handleConfirmGuest(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#492e6e] hover:bg-[#392354] text-white text-[11px] font-bold shadow-sm transition cursor-pointer"
                                title="Confirm guest attendance"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb800]" />
                                Confirm
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-xs cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">{filteredAttendees.length} data</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-slate-600">Halaman {currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-xs font-bold shadow-lg ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {toast.message}
        </div>
      )}

    </div>
  );
}