import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  Check, 
  Trash2, 
  AlertCircle, 
  Building2, 
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Classroom, Student, Institution, AttendanceRecord } from '../../types';
import { recordAttendanceEntry, removeAttendanceRecord } from '../../lib/firebase';
import { NfcPrintModal } from './NfcPrintModal';

interface NfcDailyConferenceProps {
  classroom: Classroom;
  allClassrooms: Classroom[];
  activeInstitution?: Institution;
  institutions?: Institution[];
  onSelectInstitution?: (institutionId: string) => void;
  isMaster?: boolean;
  allAttendanceRecords: AttendanceRecord[];
  onSelectStudent?: (student: Student) => void;
}

export const NfcDailyConference: React.FC<NfcDailyConferenceProps> = ({
  classroom,
  allClassrooms,
  activeInstitution,
  institutions,
  onSelectInstitution,
  isMaster,
  allAttendanceRecords,
  onSelectStudent,
}) => {
  const getTodayDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all');
  const [cutoffTime, setCutoffTime] = useState<string>('07:45');
  const [isCutoffActive, setIsCutoffActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Filter classrooms by active institution
  const institutionClassrooms = useMemo(() => {
    const instId = activeInstitution?.id || classroom.institutionId;
    if (!instId) return allClassrooms;
    const filtered = allClassrooms.filter(c => c.institutionId === instId);
    return filtered.length > 0 ? filtered : allClassrooms;
  }, [allClassrooms, activeInstitution, classroom]);

  // Selected classrooms in current scope
  const targetClassrooms = useMemo(() => {
    if (selectedClassroomId === 'all') return institutionClassrooms;
    const found = institutionClassrooms.find(c => c.id === selectedClassroomId);
    return found ? [found] : institutionClassrooms;
  }, [selectedClassroomId, institutionClassrooms]);

  // Attendance lookup for the selected date
  const dayAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    allAttendanceRecords.forEach(rec => {
      if (rec.date === selectedDate) {
        map.set(rec.studentId, rec);
        if (rec.matricula) {
          map.set(`mat_${rec.matricula}`, rec);
        }
      }
    });
    return map;
  }, [allAttendanceRecords, selectedDate]);

  // Helper for desk label
  const getDeskLabel = (room: Classroom, studentId: string): string => {
    if (!room.seatingMap) return 'Não alocado';
    for (const [deskId, sId] of Object.entries(room.seatingMap)) {
      if (sId === studentId) {
        const match = deskId.match(/^r(\d+)_c(\d+)$/);
        if (match) {
          const row = parseInt(match[1], 10) + 1;
          const col = parseInt(match[2], 10) + 1;
          return `F${row}-C${col} (Fila ${row}, Carteira ${col})`;
        }
        return deskId;
      }
    }
    return 'Não alocado';
  };

  // Compile list of students with their computed status for the day
  const compiledRows = useMemo(() => {
    const rows: {
      student: Student;
      classroom: Classroom;
      attendance?: AttendanceRecord;
      isPresent: boolean;
      isLate: boolean;
      deskLabel: string;
      entryTime: string;
      photoUrl?: string;
    }[] = [];

    targetClassrooms.forEach(room => {
      room.students.forEach(student => {
        const attendance = dayAttendanceMap.get(student.id) || (student.matricula ? dayAttendanceMap.get(`mat_${student.matricula}`) : undefined);
        const isPresent = !!attendance;
        const entryTime = attendance?.entryTime || '';
        const isLate = isPresent && isCutoffActive && !!cutoffTime && !!entryTime && entryTime > cutoffTime;
        const deskLabel = getDeskLabel(room, student.id);
        const photo = (student as any).foto || student.photoUrl || (student as any).avatar || (student as any).image;

        rows.push({
          student,
          classroom: room,
          attendance,
          isPresent,
          isLate,
          deskLabel,
          entryTime,
          photoUrl: photo,
        });
      });
    });

    return rows;
  }, [targetClassrooms, dayAttendanceMap, isCutoffActive, cutoffTime]);

  // Summary Metrics
  const totalStudents = compiledRows.length;
  const presentCount = compiledRows.filter(r => r.isPresent).length;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const lateCount = compiledRows.filter(r => r.isLate).length;
  const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Filtered rows for the table
  const filteredRows = useMemo(() => {
    return compiledRows.filter(row => {
      // Status filter
      if (statusFilter === 'present' && !row.isPresent) return false;
      if (statusFilter === 'absent' && row.isPresent) return false;
      if (statusFilter === 'late' && !row.isLate) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = row.student.name.toLowerCase().includes(q) || (row.student.nickname || '').toLowerCase().includes(q);
        const matchMat = (row.student.matricula || '').toLowerCase().includes(q) || String(row.student.rollNumber).includes(q);
        const matchRoom = row.classroom.name.toLowerCase().includes(q);
        if (!matchName && !matchMat && !matchRoom) return false;
      }

      return true;
    });
  }, [compiledRows, statusFilter, searchQuery]);

  // Mini-cards metrics per classroom
  const classroomsSummary = useMemo(() => {
    return institutionClassrooms.map(c => {
      const roomStudents = c.students;
      const count = roomStudents.length;
      let present = 0;
      let late = 0;
      roomStudents.forEach(s => {
        const att = dayAttendanceMap.get(s.id) || (s.matricula ? dayAttendanceMap.get(`mat_${s.matricula}`) : undefined);
        if (att) {
          present++;
          if (isCutoffActive && cutoffTime && att.entryTime && att.entryTime > cutoffTime) {
            late++;
          }
        }
      });
      const pct = count > 0 ? Math.round((present / count) * 100) : 0;
      return {
        classroom: c,
        total: count,
        present,
        absent: Math.max(0, count - present),
        late,
        pct,
      };
    });
  }, [institutionClassrooms, dayAttendanceMap, isCutoffActive, cutoffTime]);

  // Date stepper
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

  // Manual Confirmation Action
  const handleConfirmManual = async (row: typeof compiledRows[0]) => {
    try {
      setActionLoadingId(row.student.id);
      const now = new Date();
      const currentEntryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const photo = row.photoUrl;
      await recordAttendanceEntry({
        institutionId: activeInstitution?.id || row.classroom.institutionId || 'unidade',
        classroomId: row.classroom.id,
        classroomName: row.classroom.name,
        studentId: row.student.id,
        studentName: row.student.name,
        matricula: row.student.matricula || '',
        photoUrl: photo,
        foto: photo,
        date: selectedDate,
        entryTime: currentEntryTime,
        source: 'manual'
      });
    } catch (e) {
      console.error('Error confirming manual attendance:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove Attendance Action
  const handleRemoveRecord = async (row: typeof compiledRows[0]) => {
    if (!row.attendance) return;
    if (!window.confirm(`Deseja remover o registro de presença de ${row.student.name} no dia ${selectedDate.split('-').reverse().join('/')}?`)) {
      return;
    }
    try {
      setActionLoadingId(row.student.id);
      const instId = activeInstitution?.id || row.classroom.institutionId || 'unidade';
      await removeAttendanceRecord(instId, row.attendance.id);
    } catch (e) {
      console.error('Error removing attendance record:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // CSV Export with UTF-8 BOM
  const handleExportCsv = () => {
    const headers = ['Unidade', 'Turma', 'Data', 'Aluno', 'Matrícula', 'Carteira', 'Status', 'Horário de Entrada', 'Origem'];
    const rows = filteredRows.map(r => {
      let statusStr = 'Ausente';
      if (r.isPresent) {
        statusStr = r.isLate ? 'Atrasado' : 'Presente';
      }
      return [
        activeInstitution?.name || 'Unidade Principal',
        r.classroom.name,
        selectedDate.split('-').reverse().join('/'),
        r.student.name,
        r.student.matricula || String(r.student.rollNumber),
        r.deskLabel,
        statusStr,
        r.entryTime || '-',
        r.isPresent ? (r.attendance?.source === 'manual' ? 'Manual' : 'Adesivo NFC') : '-'
      ];
    });

    const escapeCell = (cell: string | number) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
      headers.map(escapeCell).join(';'),
      ...rows.map(row => row.map(escapeCell).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const roomSlug = selectedClassroomId === 'all' ? 'todas_as_turmas' : (targetClassrooms[0]?.name.replace(/\s+/g, '_') || 'turma');
    link.download = `conferencia_diaria_${roomSlug}_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* FILTER BAR                                               */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121216] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-4">
        
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Institution Selector (if Master) */}
            {isMaster && institutions && institutions.length > 1 ? (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-3 py-2 rounded-2xl border border-slate-200 dark:border-zinc-700">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Unidade:</span>
                <select
                  value={activeInstitution?.id || ''}
                  onChange={(e) => onSelectInstitution?.(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id} className="dark:bg-zinc-900">
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900/60 px-3 py-2 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {activeInstitution?.name || 'Unidade Principal'}
                </span>
              </div>
            )}

            {/* Classroom Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-3 py-2 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Turma:</span>
              <select
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-zinc-900">
                  Todas as Turmas da Instituição ({institutionClassrooms.length})
                </option>
                {institutionClassrooms.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-zinc-900">
                    Turma {c.name} ({c.students.length} alunos)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Stepper */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => handleStepDate('prev')}
                title="Dia anterior"
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
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
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isToday && (
                <button
                  onClick={() => setSelectedDate(getTodayDateStr())}
                  className="px-2 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer ml-1"
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Cutoff Time */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={isCutoffActive}
                  onChange={(e) => setIsCutoffActive(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Limite Entrada:</span>
              </label>
              <input
                type="time"
                value={cutoffTime}
                disabled={!isCutoffActive}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Export & Print Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Exportar dados da conferência diária em planilha CSV (Excel)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Planilha (CSV)</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Abrir visualização pronta para impressão ou PDF com cabeçalho oficial"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Imprimir / Gerar Relatório</span>
            </button>
          </div>

        </div>

        {/* Secondary Row: Quick Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/80">
          {/* Status Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filtrar:</span>
            
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              Todos ({totalStudents})
            </button>

            <button
              onClick={() => setStatusFilter('present')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Presentes ({presentCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('absent')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'absent'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/50'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Ausentes ({absentCount})</span>
            </button>

            {isCutoffActive && (
              <button
                onClick={() => setStatusFilter('late')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'late'
                    ? 'bg-yellow-500 text-slate-950 shadow-xs'
                    : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 border border-yellow-200 dark:border-yellow-800/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Atrasados ({lateCount})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou matrícula..."
              className="w-full text-xs py-2 pl-9 pr-4 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* KPIS SUMMARY CARDS                                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total */}
        <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total de Alunos</p>
            <p className="text-xl font-black text-slate-900 dark:text-zinc-100 font-display">{totalStudents}</p>
            <p className="text-[10px] text-slate-400">{targetClassrooms.length} turma(s) considerada(s)</p>
          </div>
        </div>

        {/* Presentes */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Presentes</p>
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md">
                {presentPercentage}%
              </span>
            </div>
            <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-display">{presentCount}</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Presença confirmada hoje</p>
          </div>
        </div>

        {/* Ausentes */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Ausentes</p>
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.2 rounded-md">
                {100 - presentPercentage}%
              </span>
            </div>
            <p className="text-xl font-black text-amber-800 dark:text-amber-300 font-display">{absentCount}</p>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Aguardando ou falta</p>
          </div>
        </div>

        {/* Atrasos */}
        <div className="bg-yellow-50/70 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-800 dark:text-yellow-400">Atrasos</p>
            <p className="text-xl font-black text-yellow-800 dark:text-yellow-300 font-display">{lateCount}</p>
            <p className="text-[10px] text-yellow-600/80 dark:text-yellow-400/80">
              {isCutoffActive ? `Após ${cutoffTime}` : 'Limite inativo'}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* QUICK SUMMARY BY CLASSROOM (WHEN "TODAS AS TURMAS")      */}
      {/* ======================================================== */}
      {selectedClassroomId === 'all' && classroomsSummary.length > 1 && (
        <div className="bg-white dark:bg-[#121216] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Resumo por Turma da Instituição no Dia ({classroomsSummary.length})</span>
            </h4>
            <span className="text-[11px] text-slate-500">Clique em uma turma para filtrar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {classroomsSummary.map(item => (
              <button
                key={item.classroom.id}
                onClick={() => setSelectedClassroomId(item.classroom.id)}
                className="text-left p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    Turma {item.classroom.name}
                  </span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    item.pct >= 75 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {item.pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${item.pct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                  <span><strong>{item.present}</strong> de {item.total} presentes</span>
                  {item.late > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">{item.late} atraso(s)</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DAILY CONFERENCE TABLE                                   */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121216] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 font-display flex items-center gap-2">
              <span>Lista de Chamada e Conferência</span>
              <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                ({selectedDate.split('-').reverse().join('/')})
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Mostrando {filteredRows.length} de {totalStudents} aluno(s)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Presente
            </span>
            {isCutoffActive && (
              <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-bold text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                Atrasado
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
              Ausente
            </span>
          </div>
        </div>

        {/* Table */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              Nenhum aluno encontrado para os filtros selecionados
            </p>
            <p className="text-xs text-slate-500">
              Tente redefinir os filtros de busca ou trocar a turma.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-zinc-300">
              <thead className="bg-slate-100 dark:bg-[#16161c] text-slate-800 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Foto</th>
                  <th className="py-3 px-4">Nome do Aluno</th>
                  <th className="py-3 px-3">Matrícula</th>
                  <th className="py-3 px-3">Turma</th>
                  <th className="py-3 px-4">Carteira no Espelho</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Horário de Entrada</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredRows.map((row) => {
                  const hasPhoto = !!row.photoUrl && !imgErrors[row.student.id];

                  return (
                    <tr 
                      key={`${row.classroom.id}_${row.student.id}`} 
                      className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors ${
                        row.isPresent ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Foto */}
                      <td className="py-2.5 px-3">
                        {hasPhoto ? (
                          <img
                            src={row.photoUrl}
                            alt={row.student.name}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setImgErrors(prev => ({ ...prev, [row.student.id]: true }))}
                            className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500/70 shadow-xs"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full text-xs font-bold text-white flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: row.student.avatarColor || '#10b981' }}
                          >
                            {row.student.rollNumber || row.student.name.charAt(0)}
                          </div>
                        )}
                      </td>

                      {/* Nome */}
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectStudent?.(row.student)}
                          className="text-left font-bold text-slate-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <span className="block">{row.student.name}</span>
                          {row.student.nickname && (
                            <span className="text-[10px] text-slate-400 font-normal">({row.student.nickname})</span>
                          )}
                        </button>
                      </td>

                      {/* Matrícula */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-zinc-400">
                        {row.student.matricula || `Nº ${row.student.rollNumber}`}
                      </td>

                      {/* Turma */}
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                        {row.classroom.name}
                      </td>

                      {/* Carteira no Espelho */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                        {row.deskLabel}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {row.isPresent ? (
                          row.isLate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/40">
                              <Clock className="w-3 h-3" />
                              Atrasado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                              <Check className="w-3 h-3" />
                              Presente
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
                            Ausente
                          </span>
                        )}
                      </td>

                      {/* Horário */}
                      <td className="py-2.5 px-3">
                        {row.isPresent ? (
                          <div className="space-y-0.5">
                            <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                              row.isLate
                                ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {row.entryTime}
                            </span>
                            <span className="text-[9px] block text-slate-400">
                              {row.attendance?.source === 'manual' ? 'Manual' : 'Adesivo NFC'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-4 text-right">
                        {row.isPresent ? (
                          <button
                            onClick={() => handleRemoveRecord(row)}
                            disabled={actionLoadingId === row.student.id}
                            title="Remover presença (caso tenha sido lançado por engano)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConfirmManual(row)}
                            disabled={actionLoadingId === row.student.id}
                            title="Registrar presença manual para o aluno neste dia"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 rounded-xl border border-emerald-300 dark:border-emerald-800/60 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirmar Manual</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* PRINT MODAL                                              */}
      {/* ======================================================== */}
      <NfcPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Relatório Diário de Frequência e Conferência"
        subtitle={`Conferência Geral de Alunos • Data: ${selectedDate.split('-').reverse().join('/')}`}
        institution={activeInstitution}
        dateOrMonthLabel={`Data de Referência: ${selectedDate.split('-').reverse().join('/')}`}
        classroomName={selectedClassroomId === 'all' ? 'Todas as Turmas da Instituição' : (targetClassrooms[0]?.name || 'Turma')}
        metrics={{
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          percentage: presentPercentage,
        }}
        headers={['Nº', 'Aluno(a)', 'Matrícula', 'Turma', 'Carteira no Espelho', 'Status', 'Horário']}
        rows={filteredRows.map((r, i) => [
          i + 1,
          r.student.name,
          r.student.matricula || String(r.student.rollNumber),
          r.classroom.name,
          r.deskLabel,
          r.isPresent ? (r.isLate ? 'Atrasado' : 'Presente') : 'Ausente',
          r.entryTime || '-'
        ])}
      />

    </div>
  );
};
