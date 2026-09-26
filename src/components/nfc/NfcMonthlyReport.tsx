import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  BarChart3, 
  ListFilter, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  X, 
  Building2, 
  GraduationCap,
  CalendarCheck
} from 'lucide-react';
import { Classroom, Student, Institution, AttendanceRecord } from '../../types';
import { NfcPrintModal } from './NfcPrintModal';

interface NfcMonthlyReportProps {
  classroom: Classroom;
  allClassrooms: Classroom[];
  activeInstitution?: Institution;
  allAttendanceRecords: AttendanceRecord[];
  onSelectStudent?: (student: Student) => void;
}

export const NfcMonthlyReport: React.FC<NfcMonthlyReportProps> = ({
  classroom,
  allClassrooms,
  activeInstitution,
  allAttendanceRecords,
  onSelectStudent,
}) => {
  const getTodayMonthStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayMonthStr());
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all'); // 'all' or 'YYYY-MM-DD'
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'low' | 'perfect'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'log'>('matrix');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Filter classrooms by active institution
  const institutionClassrooms = useMemo(() => {
    const instId = activeInstitution?.id || classroom.institutionId;
    if (!instId) return allClassrooms;
    const filtered = allClassrooms.filter(c => c.institutionId === instId);
    return filtered.length > 0 ? filtered : allClassrooms;
  }, [allClassrooms, activeInstitution, classroom]);

  // Target classrooms in current scope
  const targetClassrooms = useMemo(() => {
    if (selectedClassroomId === 'all') return institutionClassrooms;
    const found = institutionClassrooms.find(c => c.id === selectedClassroomId);
    return found ? [found] : institutionClassrooms;
  }, [selectedClassroomId, institutionClassrooms]);

  // All attendance records in selected month for target classrooms
  const targetClassroomIds = useMemo(() => new Set(targetClassrooms.map(c => c.id)), [targetClassrooms]);

  const monthRecords = useMemo(() => {
    return allAttendanceRecords.filter(rec => {
      if (!rec.date.startsWith(selectedMonth)) return false;
      // Match classroom or student in target classrooms
      const matchRoom = targetClassroomIds.has(rec.classroomId);
      const matchStudent = targetClassrooms.some(r => r.students.some(s => s.id === rec.studentId || (s.matricula && s.matricula === rec.matricula)));
      return matchRoom || matchStudent;
    });
  }, [allAttendanceRecords, selectedMonth, targetClassroomIds, targetClassrooms]);

  // Distinct school days in the month that have attendance records
  const activeDaysInMonth = useMemo(() => {
    const daysSet = new Set<string>();
    monthRecords.forEach(r => daysSet.add(r.date));
    return Array.from(daysSet).sort();
  }, [monthRecords]);

  // Month navigation
  const handleStepMonth = (direction: 'prev' | 'next') => {
    const [yyyy, mm] = selectedMonth.split('-').map(Number);
    const date = new Date(yyyy, mm - 1, 1);
    date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    const nextYyyy = date.getFullYear();
    const nextMm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYyyy}-${nextMm}`);
    setSelectedDayFilter('all');
  };

  // Helper to calculate average arrival time
  const calculateAverageTime = (times: string[]): string => {
    if (!times || times.length === 0) return '-';
    let validCount = 0;
    const totalSeconds = times.reduce((acc, t) => {
      const parts = t.split(':').map(Number);
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return acc;
      validCount++;
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      return acc + (h * 3600 + m * 60 + s);
    }, 0);

    if (validCount === 0) return '-';
    const avg = Math.round(totalSeconds / validCount);
    const avgH = String(Math.floor(avg / 3600)).padStart(2, '0');
    const avgM = String(Math.floor((avg % 3600) / 60)).padStart(2, '0');
    const avgS = String(avg % 60).padStart(2, '0');
    return `${avgH}:${avgM}:${avgS}`;
  };

  // Map of student attendance by day: studentId -> Map<dateStr, AttendanceRecord>
  const studentMonthAttendance = useMemo(() => {
    const map = new Map<string, Map<string, AttendanceRecord>>();
    monthRecords.forEach(r => {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, new Map());
      }
      map.get(r.studentId)!.set(r.date, r);

      // Also map by matricula for cross-lookup
      if (r.matricula) {
        const matKey = `mat_${r.matricula}`;
        if (!map.has(matKey)) {
          map.set(matKey, new Map());
        }
        map.get(matKey)!.set(r.date, r);
      }
    });
    return map;
  }, [monthRecords]);

  // Compute student summary rows for Matrix view
  const studentMatrixRows = useMemo(() => {
    const totalSchoolDays = activeDaysInMonth.length;
    const rows: {
      student: Student;
      classroom: Classroom;
      schoolDaysCount: number;
      presenceCount: number;
      absenceCount: number;
      frequencyPct: number;
      averageTime: string;
      daysRecords: { date: string; record?: AttendanceRecord }[];
      photoUrl?: string;
    }[] = [];

    targetClassrooms.forEach(room => {
      room.students.forEach(student => {
        const studentDaysMap = studentMonthAttendance.get(student.id) || (student.matricula ? studentMonthAttendance.get(`mat_${student.matricula}`) : undefined);
        
        let presences = 0;
        const arrivalTimes: string[] = [];
        const daysRecords: { date: string; record?: AttendanceRecord }[] = [];

        activeDaysInMonth.forEach(dateStr => {
          const rec = studentDaysMap?.get(dateStr);
          if (rec) {
            presences++;
            if (rec.entryTime) arrivalTimes.push(rec.entryTime);
            daysRecords.push({ date: dateStr, record: rec });
          } else {
            daysRecords.push({ date: dateStr, record: undefined });
          }
        });

        const absences = Math.max(0, totalSchoolDays - presences);
        const frequencyPct = totalSchoolDays > 0 ? Math.round((presences / totalSchoolDays) * 100) : 100;
        const averageTime = calculateAverageTime(arrivalTimes);
        const photo = (student as any).foto || student.photoUrl || (student as any).avatar || (student as any).image;

        rows.push({
          student,
          classroom: room,
          schoolDaysCount: totalSchoolDays,
          presenceCount: presences,
          absenceCount: absences,
          frequencyPct,
          averageTime,
          daysRecords,
          photoUrl: photo,
        });
      });
    });

    // Sort by name
    return rows.sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [targetClassrooms, activeDaysInMonth, studentMonthAttendance]);

  // Filtered Matrix rows
  const filteredMatrixRows = useMemo(() => {
    return studentMatrixRows.filter(row => {
      // Frequency Filter
      if (frequencyFilter === 'low' && row.frequencyPct >= 75) return false;
      if (frequencyFilter === 'perfect' && row.frequencyPct < 100) return false;

      // Day specific filter (if a single day is selected in the month)
      if (selectedDayFilter !== 'all') {
        const dayRecord = row.daysRecords.find(d => d.date === selectedDayFilter);
        if (!dayRecord || !dayRecord.record) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = row.student.name.toLowerCase().includes(q) || (row.student.nickname || '').toLowerCase().includes(q);
        const matchMat = (row.student.matricula || '').toLowerCase().includes(q) || String(row.student.rollNumber).includes(q);
        const matchRoom = row.classroom.name.toLowerCase().includes(q);
        if (!matchName && !matchMat && !matchRoom) return false;
      }

      return true;
    });
  }, [studentMatrixRows, frequencyFilter, selectedDayFilter, searchQuery]);

  // Log View rows (chronological entries)
  const logRows = useMemo(() => {
    let list = [...monthRecords];
    if (selectedDayFilter !== 'all') {
      list = list.filter(r => r.date === selectedDayFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.studentName.toLowerCase().includes(q) || 
        (r.matricula || '').toLowerCase().includes(q) ||
        (r.classroomName || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.entryTime || '').localeCompare(a.entryTime || '');
    });
  }, [monthRecords, selectedDayFilter, searchQuery]);

  // Month stats
  const totalEnrolled = studentMatrixRows.length;
  const criticalCount = studentMatrixRows.filter(r => r.frequencyPct < 75).length;
  const perfectCount = studentMatrixRows.filter(r => r.frequencyPct === 100).length;
  const avgAttendancePct = totalEnrolled > 0
    ? Math.round(studentMatrixRows.reduce((acc, r) => acc + r.frequencyPct, 0) / totalEnrolled)
    : 0;

  // CSV Export with UTF-8 BOM
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const [yyyy, mm] = selectedMonth.split('-');
    const formattedMonth = `${mm}/${yyyy}`;

    if (viewMode === 'matrix') {
      headers = [
        'Unidade',
        'Turma',
        'Aluno',
        'Matrícula',
        'Mês de Referência',
        'Dias Letivos no Mês',
        'Total Presenças',
        'Total Faltas',
        '% Frequência',
        'Horário Médio de Chegada'
      ];
      rows = filteredMatrixRows.map(r => [
        activeInstitution?.name || 'Unidade Principal',
        r.classroom.name,
        r.student.name,
        r.student.matricula || String(r.student.rollNumber),
        formattedMonth,
        r.schoolDaysCount,
        r.presenceCount,
        r.absenceCount,
        `${r.frequencyPct}%`,
        r.averageTime
      ]);
    } else {
      headers = ['Unidade', 'Turma', 'Data', 'Horário de Entrada', 'Aluno', 'Matrícula', 'Origem', 'Status'];
      rows = logRows.map(r => [
        activeInstitution?.name || 'Unidade Principal',
        r.classroomName || classroom.name,
        r.date.split('-').reverse().join('/'),
        r.entryTime,
        r.studentName,
        r.matricula || '-',
        r.source === 'manual' ? 'Manual' : 'Adesivo NFC Portaria',
        'Presente'
      ]);
    }

    const escapeCell = (cell: string | number) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
      headers.map(escapeCell).join(';'),
      ...rows.map(row => row.map(escapeCell).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const modeSlug = viewMode === 'matrix' ? 'matriz_resumo' : 'log_detalhado';
    link.download = `relatorio_mensal_${modeSlug}_${selectedMonth}.csv`;
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
        
        {/* Top Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Unit Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900/60 px-3 py-2 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {activeInstitution?.name || 'Unidade Principal'}
              </span>
            </div>

            {/* Month Stepper */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => handleStepMonth('prev')}
                title="Mês anterior"
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedDayFilter('all');
                  }}
                  className="bg-transparent font-bold text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => handleStepMonth('next')}
                title="Próximo mês"
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Month Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-3 py-2 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Dia:</span>
              <select
                value={selectedDayFilter}
                onChange={(e) => setSelectedDayFilter(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-zinc-900">
                  Todos os dias do mês ({activeDaysInMonth.length} dias letivos)
                </option>
                {activeDaysInMonth.map(d => {
                  const dayNum = d.split('-')[2];
                  return (
                    <option key={d} value={d} className="dark:bg-zinc-900">
                      Dia {dayNum} ({d.split('-').reverse().join('/')})
                    </option>
                  );
                })}
              </select>
            </div>

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
          </div>

          {/* Export & Print */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Exportar planilha consolidada do mês em formato CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Planilha (CSV)</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Imprimir relatório mensal consolidado"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Imprimir / Gerar Relatório</span>
            </button>
          </div>

        </div>

        {/* Secondary Row: Mode Switcher, Status Filters, Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/80">
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visão Matriz / Resumo por Aluno</span>
              </button>

              <button
                onClick={() => setViewMode('log')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'log'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Log Geral de Entradas</span>
              </button>
            </div>

            {/* Frequency Filter (for Matrix view) */}
            {viewMode === 'matrix' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFrequencyFilter('all')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    frequencyFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Todos ({totalEnrolled})
                </button>

                <button
                  onClick={() => setFrequencyFilter('low')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    frequencyFilter === 'low'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Frequência Baixa &lt; 75% ({criticalCount})</span>
                </button>

                <button
                  onClick={() => setFrequencyFilter('perfect')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    frequencyFilter === 'perfect'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Presentes ({perfectCount})</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por aluno ou matrícula..."
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
      {/* KPIS SUMMARY                                             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total de Alunos</p>
          <p className="text-xl font-black text-slate-900 dark:text-zinc-100 font-display">{totalEnrolled}</p>
          <p className="text-[10px] text-slate-400">{targetClassrooms.length} turma(s) considerada(s)</p>
        </div>

        <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Dias Letivos no Mês</p>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-display">{activeDaysInMonth.length}</p>
          <p className="text-[10px] text-slate-400">Com registro de presença</p>
        </div>

        <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Média Geral de Presença</p>
          <p className="text-xl font-black text-slate-900 dark:text-zinc-100 font-display">{avgAttendancePct}%</p>
          <p className="text-[10px] text-slate-400">{monthRecords.length} check-ins registrados</p>
        </div>

        <div className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Alerta de Faltas (&lt; 75%)</p>
          <p className="text-xl font-black text-rose-700 dark:text-rose-400 font-display">{criticalCount}</p>
          <p className="text-[10px] text-slate-400">Alunos com risco de reprovação</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: MATRIZ / RESUMO POR ALUNO                        */}
      {/* ======================================================== */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-[#121216] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 font-display flex items-center gap-2">
                <span>Resumo Analítico por Aluno ({selectedMonth})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Clique na linha do aluno para expandir o detalhamento diário de presenças e faltas do mês.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {filteredMatrixRows.length} de {totalEnrolled} aluno(s)
            </span>
          </div>

          {filteredMatrixRows.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                Nenhum aluno encontrado para este filtro
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-zinc-300">
                <thead className="bg-slate-100 dark:bg-[#16161c] text-slate-800 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Foto</th>
                    <th className="py-3 px-4">Nome do Aluno</th>
                    <th className="py-3 px-3">Turma</th>
                    <th className="py-3 px-3">Matrícula</th>
                    <th className="py-3 px-3 text-center">Dias Letivos</th>
                    <th className="py-3 px-3 text-center">Presenças</th>
                    <th className="py-3 px-3 text-center">Faltas</th>
                    <th className="py-3 px-4">% Frequência</th>
                    <th className="py-3 px-3">Horário Médio</th>
                    <th className="py-3 px-3 text-center">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {filteredMatrixRows.map((row) => {
                    const isExpanded = expandedStudentId === row.student.id;
                    const hasPhoto = !!row.photoUrl && !imgErrors[row.student.id];

                    return (
                      <React.Fragment key={row.student.id}>
                        <tr 
                          onClick={() => setExpandedStudentId(isExpanded ? null : row.student.id)}
                          className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
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
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {row.student.name}
                            {row.student.nickname && (
                              <span className="block text-[10px] text-slate-400 font-normal">({row.student.nickname})</span>
                            )}
                          </td>

                          {/* Turma */}
                          <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                            {row.classroom.name}
                          </td>

                          {/* Matrícula */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-zinc-400">
                            {row.student.matricula || `Nº ${row.student.rollNumber}`}
                          </td>

                          {/* Dias Letivos */}
                          <td className="py-2.5 px-3 text-center font-bold">
                            {row.schoolDaysCount}
                          </td>

                          {/* Presenças */}
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            {row.presenceCount}
                          </td>

                          {/* Faltas */}
                          <td className="py-2.5 px-3 text-center font-bold text-amber-700 dark:text-amber-400">
                            {row.absenceCount}
                          </td>

                          {/* % Frequência com barra */}
                          <td className="py-2.5 px-4 min-w-[130px]">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                              <span className={row.frequencyPct >= 75 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                                {row.frequencyPct}%
                              </span>
                              <span className="text-[9px] font-normal text-slate-400">
                                {row.frequencyPct >= 75 ? 'Regular' : 'Atenção'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  row.frequencyPct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${row.frequencyPct}%` }}
                              />
                            </div>
                          </td>

                          {/* Horário Médio */}
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-zinc-300">
                            {row.averageTime !== '-' ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {row.averageTime}
                              </span>
                            ) : '-'}
                          </td>

                          {/* Expand Trigger */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="p-1 rounded-lg text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200">
                              {isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                            </span>
                          </td>
                        </tr>

                        {/* Accordion Detail Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-zinc-900/60">
                            <td colSpan={10} className="p-4 border-y border-slate-200 dark:border-zinc-800">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Presenças e Faltas de {row.student.name} em {selectedMonth}</span>
                                  </h5>
                                  <span className="text-[11px] text-slate-500">
                                    {row.presenceCount} presenças em {row.schoolDaysCount} dias de aula
                                  </span>
                                </div>

                                {row.daysRecords.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">Nenhum dia de aula registrado neste mês.</p>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                    {row.daysRecords.map(dayItem => {
                                      const isPresent = !!dayItem.record;
                                      const dayNum = dayItem.date.split('-')[2];

                                      return (
                                        <div
                                          key={dayItem.date}
                                          className={`p-2 rounded-xl border text-center text-xs space-y-0.5 ${
                                            isPresent
                                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                                          }`}
                                        >
                                          <span className="text-[10px] font-bold block uppercase tracking-wider opacity-75">
                                            Dia {dayNum}
                                          </span>
                                          <div className="font-bold flex items-center justify-center gap-1">
                                            {isPresent ? (
                                              <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span>{dayItem.record?.entryTime || 'Presente'}</span>
                                              </>
                                            ) : (
                                              <>
                                                <X className="w-3 h-3 text-rose-500" />
                                                <span>Falta</span>
                                              </>
                                            )}
                                          </div>
                                          {isPresent && dayItem.record?.source && (
                                            <span className="text-[9px] block opacity-60">
                                              {dayItem.record.source === 'manual' ? 'Manual' : 'Adesivo NFC'}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: LOG GERAL CRONOLÓGICO                            */}
      {/* ======================================================== */}
      {viewMode === 'log' && (
        <div className="bg-white dark:bg-[#121216] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 font-display">
                Histórico Cronológico de Entradas ({selectedMonth})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Lista de todos os check-ins registrados via adesivo NFC e lançamentos manuais.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {logRows.length} registro(s) encontrado(s)
            </span>
          </div>

          {logRows.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                Nenhum check-in registrado para os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-zinc-300">
                <thead className="bg-slate-100 dark:bg-[#16161c] text-slate-800 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-3">Horário de Entrada</th>
                    <th className="py-3 px-4">Aluno(a)</th>
                    <th className="py-3 px-3">Matrícula</th>
                    <th className="py-3 px-3">Turma</th>
                    <th className="py-3 px-3">Origem</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {logRows.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold">
                        {rec.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                          <Clock className="w-3 h-3" />
                          {rec.entryTime}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-zinc-100">
                        {rec.studentName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400">
                        {rec.matricula || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">
                        {rec.classroomName || classroom.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {rec.source === 'manual' ? 'Lançamento Manual' : 'Adesivo NFC Portaria'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                          Presente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* PRINT MODAL                                              */}
      {/* ======================================================== */}
      <NfcPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Relatório Mensal de Frequência Escolar"
        subtitle={`Visão Consolidada de Presenças • Mês de Referência: ${selectedMonth}`}
        institution={activeInstitution}
        dateOrMonthLabel={`Mês de Referência: ${selectedMonth}`}
        classroomName={selectedClassroomId === 'all' ? 'Todas as Turmas da Instituição' : (targetClassrooms[0]?.name || 'Turma')}
        metrics={{
          totalStudents: totalEnrolled,
          presentCount: totalEnrolled - criticalCount,
          absentCount: criticalCount,
          percentage: avgAttendancePct,
        }}
        headers={
          viewMode === 'matrix'
            ? ['Nº', 'Aluno(a)', 'Matrícula', 'Turma', 'Dias Letivos', 'Presenças', 'Faltas', '% Freq.', 'Média']
            : ['Data', 'Horário', 'Aluno(a)', 'Matrícula', 'Turma', 'Origem', 'Status']
        }
        rows={
          viewMode === 'matrix'
            ? filteredMatrixRows.map((r, i) => [
                i + 1,
                r.student.name,
                r.student.matricula || String(r.student.rollNumber),
                r.classroom.name,
                r.schoolDaysCount,
                r.presenceCount,
                r.absenceCount,
                `${r.frequencyPct}%`,
                r.averageTime
              ])
            : logRows.map(r => [
                r.date.split('-').reverse().join('/'),
                r.entryTime,
                r.studentName,
                r.matricula || '-',
                r.classroomName || classroom.name,
                r.source === 'manual' ? 'Manual' : 'Adesivo NFC',
                'Presente'
              ])
        }
      />

    </div>
  );
};
