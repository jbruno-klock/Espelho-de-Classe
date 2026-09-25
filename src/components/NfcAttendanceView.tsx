import React, { useState, useEffect, useMemo } from 'react';
import { 
  SmartphoneNfc, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  Download, 
  QrCode, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  Table, 
  Grid, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Presentation,
  DoorOpen,
  Info,
  X
} from 'lucide-react';
import { Classroom, Student, Institution, AttendanceRecord } from '../types';
import { subscribeToAttendance } from '../lib/firebase';
import * as XLSX from 'xlsx';

interface NfcAttendanceViewProps {
  classroom: Classroom;
  allClassrooms: Classroom[];
  activeInstitution?: Institution;
  theme: 'dark' | 'light';
  onSelectStudent?: (student: Student) => void;
}

export const NfcAttendanceView: React.FC<NfcAttendanceViewProps> = ({
  classroom,
  allClassrooms,
  activeInstitution,
  theme,
  onSelectStudent,
}) => {
  // Today's date YYYY-MM-DD in local time
  const getTodayDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayMonthStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // State
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayMonthStr());
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'report'>('map');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // NFC Entrance Sticker URL
  const nfcStickerUrl = useMemo(() => {
    const origin = window.location.origin;
    const instId = activeInstitution?.id || classroom.institutionId || 'unidade';
    return `${origin}/?nfcEntrada=1&unidadeId=${encodeURIComponent(instId)}`;
  }, [activeInstitution, classroom]);

  // Subscribe to real-time Firebase attendance updates
  useEffect(() => {
    const instId = activeInstitution?.id || classroom.institutionId || 'unidade';
    const unsub = subscribeToAttendance(instId, (records) => {
      setAllAttendanceRecords(records);
    });

    return () => {
      unsub();
    };
  }, [activeInstitution, classroom]);

  // Copy NFC Entrance link to clipboard
  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(nfcStickerUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.error('Error copying to clipboard:', e);
    }
  };

  // Map of studentId -> AttendanceRecord for the selected date
  const dayAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    allAttendanceRecords.forEach(rec => {
      if (rec.date === selectedDate) {
        map.set(rec.studentId, rec);
        // Also map by matricula for cross-referencing
        if (rec.matricula) {
          map.set(`mat_${rec.matricula}`, rec);
        }
      }
    });
    return map;
  }, [allAttendanceRecords, selectedDate]);

  // Quick lookup helper for a student's attendance on selected date
  const getStudentAttendance = (student: Student): AttendanceRecord | undefined => {
    return dayAttendanceMap.get(student.id) || (student.matricula ? dayAttendanceMap.get(`mat_${student.matricula}`) : undefined);
  };

  // Student metrics for active classroom
  const totalStudents = classroom.students.length;
  const presentStudents = classroom.students.filter(s => !!getStudentAttendance(s));
  const presentCount = presentStudents.length;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Monthly records for this classroom
  const monthlyRecords = useMemo(() => {
    return allAttendanceRecords.filter(rec => {
      const matchMonth = rec.date.startsWith(selectedMonth);
      const matchClass = rec.classroomId === classroom.id || classroom.students.some(s => s.id === rec.studentId || (s.matricula && s.matricula === rec.matricula));
      return matchMonth && matchClass;
    }).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.entryTime || '').localeCompare(a.entryTime || '');
    });
  }, [allAttendanceRecords, selectedMonth, classroom]);

  // Download Excel attendance report
  const handleDownloadExcelReport = () => {
    try {
      const rows = monthlyRecords.map((r, index) => {
        const studentObj = classroom.students.find(s => s.id === r.studentId || s.matricula === r.matricula);
        const [yyyy, mm, dd] = r.date.split('-');
        const formattedDate = `${dd}/${mm}/${yyyy}`;

        return {
          'Nº': index + 1,
          'Aluno': r.studentName,
          'Matrícula': r.matricula,
          'Turma': r.classroomName || classroom.name,
          'Data': formattedDate,
          'Horário de Entrada': r.entryTime,
          'Status': 'Presente',
          'Origem': r.source === 'nfc' ? 'NFC Portaria' : 'Check-in Digital'
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Frequencia_${selectedMonth}`);
      
      const fileName = `frequencia_nfc_${classroom.name.replace(/\s+/g, '_')}_${selectedMonth}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error('Error exporting Excel report:', e);
    }
  };

  // Room config layout rendering helpers
  const { rows, cols, activeDesks, teacherDeskPosition, doorPosition } = classroom.roomConfig;
  const seatingMap = classroom.seatingMap || {};
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    classroom.students.forEach(s => map.set(s.id, s));
    return map;
  }, [classroom.students]);

  // Check unassigned students
  const assignedStudentIds = useMemo(() => {
    return new Set(Object.values(seatingMap).filter(Boolean) as string[]);
  }, [seatingMap]);
  const unassignedStudents = classroom.students.filter(s => !assignedStudentIds.has(s.id));

  // Date stepper navigation
  const handleStepDate = (direction: 'prev' | 'next') => {
    const [yyyy, mm, dd] = selectedDate.split('-').map(Number);
    const date = new Date(yyyy, mm - 1, dd);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    const nextYyyy = date.getFullYear();
    const nextMm = String(date.getMonth() + 1).padStart(2, '0');
    const nextDd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${nextYyyy}-${nextMm}-${nextDd}`);
  };

  const isToday = selectedDate === getTodayDateStr();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5 text-slate-900 dark:text-zinc-100">
      
      {/* ======================================================== */}
      {/* TOP BANNER: ADESIVO NFC ENTRADA & LINK ÚNICO             */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121216] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-zinc-800/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Info */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
                <SmartphoneNfc className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-zinc-100">
                Frequência em Tempo Real via NFC
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Portaria • Entrada Única
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              O colégio possui <strong>apenas um adesivo NFC na portaria</strong>. Quando o aluno aproxima o celular, digita sua matrícula e confirma a identidade, sua presença é sincronizada instantaneamente no espelho de sala.
            </p>
          </div>

          {/* Quick Actions & URL Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Copy Button */}
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isCopied 
                  ? 'bg-emerald-600 text-white shadow-emerald-700/20' 
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
              }`}
              title="Copiar URL para programar no adesivo NFC ou gerar QR code da entrada"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link do Adesivo NFC (Entrada)</span>
                </>
              )}
            </button>

            {/* Test in Browser Button */}
            <a
              href={nfcStickerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
              title="Abrir tela móvel do aluno em nova aba para testar"
            >
              <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Testar no Celular</span>
            </a>

            {/* QR Code Modal Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
              title="Visualizar QR Code para imprimir ou escanear com câmera"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL Pill Display */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-zinc-800/60 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">URL do Adesivo:</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 truncate bg-slate-100 dark:bg-zinc-900/60 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
              {nfcStickerUrl}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            ● Nuvem Firestore Ativa
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILTER BAR & KPIS                                        */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Date Selector & Mode Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sub-tab navigation */}
          <div className="flex items-center bg-white dark:bg-[#121216] p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
            <button
              onClick={() => setActiveSubTab('map')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Mapa em Tempo Real</span>
            </button>

            <button
              onClick={() => setActiveSubTab('report')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'report'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Relatório Mensal</span>
            </button>
          </div>

          {/* Date Picker for Map View */}
          {activeSubTab === 'map' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#121216] p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <button
                onClick={() => handleStepDate('prev')}
                title="Dia anterior"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => handleStepDate('next')}
                title="Próximo dia"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isToday && (
                <button
                  onClick={() => setSelectedDate(getTodayDateStr())}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                >
                  Hoje
                </button>
              )}
            </div>
          )}

          {/* Month Picker for Report View */}
          {activeSubTab === 'report' && (
            <div className="flex items-center gap-2 bg-white dark:bg-[#121216] px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Mês:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Summary Counter KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Total */}
          <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Alunos</p>
              <p className="text-lg font-black text-slate-900 dark:text-zinc-100 font-display">{totalStudents}</p>
            </div>
          </div>

          {/* Present */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Presentes</p>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">({presentPercentage}%)</span>
              </div>
              <p className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-display">{presentCount}</p>
            </div>
          </div>

          {/* Absent */}
          <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Ausentes</p>
              <p className="text-lg font-black text-slate-700 dark:text-zinc-300 font-display">{absentCount}</p>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: MAPA DE SALA EM TEMPO REAL                    */}
      {/* ======================================================== */}
      {activeSubTab === 'map' && (
        <div className="bg-white dark:bg-[#121216] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-6">
          
          {/* Header Map Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2 font-display">
                <span>Mapa de Sala • Turma {classroom.name}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                  ({selectedDate.split('-').reverse().join('/')})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Os cartões das carteiras acendem em verde com o horário exato de chegada do aluno.
              </p>
            </div>

            {/* Badges Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600" />
                <span className="text-slate-700 dark:text-zinc-300 font-semibold">Presente (NFC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700" />
                <span className="text-slate-500 dark:text-zinc-400">Aguardando</span>
              </div>
            </div>
          </div>

          {/* Blackboard / Top Board */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-xl bg-slate-800 dark:bg-zinc-900 text-slate-200 dark:text-zinc-300 py-2.5 px-6 rounded-2xl shadow-md border-b-4 border-slate-900 dark:border-black flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400">
                <Presentation className="w-4 h-4" />
                <span>Quadro Negro / Lousa Digital</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Frente da Sala</span>
            </div>
          </div>

          {/* Teacher Desk & Door Features */}
          <div className="flex items-center justify-between px-4 max-w-5xl mx-auto text-xs text-slate-500">
            {teacherDeskPosition.includes('left') ? (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                <span>Mesa do Professor</span>
              </div>
            ) : <div />}

            {doorPosition.includes('right') ? (
              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                <DoorOpen className="w-4 h-4 text-slate-400" />
                <span>Porta de Entrada</span>
              </div>
            ) : <div />}
          </div>

          {/* Desks Grid */}
          <div className="overflow-x-auto pb-2">
            <div
              className="grid gap-3 min-w-[700px] max-w-6xl mx-auto p-3"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                  const deskId = `r${r}_c${c}`;
                  const isActive = activeDesks[deskId] !== false;

                  if (!isActive) {
                    return (
                      <div
                        key={deskId}
                        className="min-h-[85px] rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/20 flex items-center justify-center text-[10px] font-bold text-slate-400 dark:text-zinc-600 select-none"
                      >
                        Corredor
                      </div>
                    );
                  }

                  const studentId = seatingMap[deskId];
                  const student = studentId ? studentMap.get(studentId) : null;
                  const isLocked = classroom.lockedDesks?.[deskId];
                  const attendance = student ? getStudentAttendance(student) : undefined;
                  const isPresent = !!attendance;

                  return (
                    <div
                      key={deskId}
                      onClick={() => student && onSelectStudent?.(student)}
                      className={`relative min-h-[92px] p-2.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                        isPresent
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                          : student
                          ? 'bg-white dark:bg-[#16161b] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs'
                          : isLocked
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-800/40'
                          : 'bg-slate-50/80 dark:bg-zinc-900/40 border-dashed border-slate-200 dark:border-zinc-800/60'
                      }`}
                    >
                      {/* Desk Label (F1-C1) */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-bold">
                          F{r + 1}-C{c + 1}
                        </span>

                        {/* Status Badge */}
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                            <Clock className="w-2.5 h-2.5" />
                            {attendance.entryTime}
                          </span>
                        ) : student ? (
                          <span className="text-[9px] text-slate-400 font-medium">
                            Aguardando
                          </span>
                        ) : isLocked ? (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                            Bloqueada
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">Vazia</span>
                        )}
                      </div>

                      {/* Student Info */}
                      {student ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={student.name}
                                className="w-5 h-6 rounded object-cover border border-slate-300 dark:border-zinc-700"
                              />
                            ) : (
                              <div
                                className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                                style={{ backgroundColor: student.avatarColor || '#10b981' }}
                              >
                                {student.rollNumber}
                              </div>
                            )}

                            <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate block">
                              {student.nickname || student.name.split(' ')[0]}
                            </span>
                          </div>

                          {/* Matricula Badge */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-500 dark:text-zinc-400">
                              {student.matricula || `Nº ${student.rollNumber}`}
                            </span>
                            {isPresent && (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ Presente
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[11px] text-slate-400 dark:text-zinc-600 font-medium">
                            {isLocked ? 'Reservada' : 'Livre'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Unassigned Students Strip (if any) */}
          {unassignedStudents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Alunos da turma não alocados no mapa ({unassignedStudents.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {unassignedStudents.map(student => {
                  const attendance = getStudentAttendance(student);
                  const isPresent = !!attendance;
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                        isPresent
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-100 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{student.name}</span>
                      {student.matricula && (
                        <span className="font-mono text-[10px] opacity-75">({student.matricula})</span>
                      )}
                      {isPresent && (
                        <span className="font-mono text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md">
                          {attendance.entryTime}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: RELATÓRIO MENSAL DE ENTRADAS                  */}
      {/* ======================================================== */}
      {activeSubTab === 'report' && (
        <div className="bg-white dark:bg-[#121216] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 font-display">
                Histórico Mensal de Entradas ({selectedMonth})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Lista de todos os check-ins registrados via adesivo NFC da portaria nesta turma ao longo do mês.
              </p>
            </div>

            <button
              onClick={handleDownloadExcelReport}
              disabled={monthlyRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baixar Relatório em Excel (.xlsx)</span>
            </button>
          </div>

          {/* Table */}
          {monthlyRecords.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                Nenhum registro de entrada encontrado para o mês {selectedMonth}
              </p>
              <p className="text-xs text-slate-500">
                Assim que os alunos realizarem check-in pelo adesivo da portaria, as entradas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-zinc-300">
                <thead className="bg-slate-100 dark:bg-[#16161c] text-slate-800 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Aluno(a)</th>
                    <th className="py-3 px-4">Matrícula</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Horário de Entrada</th>
                    <th className="py-3 px-4">Origem</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {monthlyRecords.map((record) => {
                    const student = classroom.students.find(s => s.id === record.studentId);
                    const [yyyy, mm, dd] = record.date.split('-');
                    const formattedDate = `${dd}/${mm}/${yyyy}`;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {student?.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={record.studentName}
                                className="w-6 h-7 rounded object-cover border border-slate-300 dark:border-zinc-700"
                              />
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                                style={{ backgroundColor: student?.avatarColor || '#10b981' }}
                              >
                                {student?.rollNumber || '•'}
                              </div>
                            )}
                            <span className="font-bold text-slate-900 dark:text-zinc-100">
                              {record.studentName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-zinc-300">
                          {record.matricula}
                        </td>

                        <td className="py-3 px-4 font-mono">
                          {formattedDate}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/60">
                            <Clock className="w-3 h-3" />
                            {record.entryTime}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          {record.source === 'nfc' ? 'Adesivo NFC Portaria' : 'Check-in Digital'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/20">
                            Presente
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QR CODE DO ADESIVO NFC ENTRADA                   */}
      {/* ======================================================== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121418] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-md w-full overflow-hidden p-6 space-y-5 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <SmartphoneNfc className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 font-display">
                  Adesivo NFC da Portaria
                </h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Grave o link abaixo na tag/adesivo NFC da entrada da unidade ou imprima o QR Code para colocar na portaria:
            </p>

            {/* QR Code Container */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-inner inline-block">
              {/* Generate pure SVG QR code representation via Google Charts API or inline SVG */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(nfcStickerUrl)}`}
                alt="QR Code Entrada NFC"
                className="w-48 h-48 mx-auto block"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unidade Vinculada</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {activeInstitution?.name || 'Unidade Atual'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-left border border-slate-200 dark:border-zinc-800 text-[11px] font-mono break-all text-slate-700 dark:text-zinc-300 select-all">
              {nfcStickerUrl}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Copy className="w-4 h-4" />
                <span>{isCopied ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
