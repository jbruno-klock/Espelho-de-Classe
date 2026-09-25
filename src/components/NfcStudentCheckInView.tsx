import React, { useState, useEffect } from 'react';
import { 
  SmartphoneNfc, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Building2, 
  GraduationCap, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Classroom, Student, Institution, AttendanceRecord } from '../types';
import { recordAttendanceEntry } from '../lib/firebase';

const STORAGE_LAST_MATRICULA = 'espelho_nfc_last_matricula';

interface NfcStudentCheckInViewProps {
  unidadeId?: string;
  allInstitutions: Institution[];
  allClassrooms: Classroom[];
  onExitCheckIn?: () => void;
}

export const NfcStudentCheckInView: React.FC<NfcStudentCheckInViewProps> = ({
  unidadeId,
  allInstitutions,
  allClassrooms,
  onExitCheckIn,
}) => {
  // Step: 1 = Digitar Matrícula, 2 = Confirmar Identidade, 3 = Sucesso / Comprovante
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [matriculaInput, setMatriculaInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected student and their classroom
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [matchedClassroom, setMatchedClassroom] = useState<Classroom | null>(null);

  // Result info from recording
  const [attendanceResult, setAttendanceResult] = useState<{
    isFirstToday: boolean;
    record: AttendanceRecord;
    originalTime?: string;
  } | null>(null);

  // Identify institution
  const activeInstitution = allInstitutions.find(i => i.id === unidadeId) || allInstitutions[0];

  // Pre-fill last matricula from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAST_MATRICULA);
      if (saved) {
        setMatriculaInput(saved);
      }
    } catch (e) {
      console.error('Error reading last matricula:', e);
    }
  }, []);

  // Filter classrooms belonging to this institution
  const institutionClassrooms = allClassrooms.filter(c => {
    if (!unidadeId) return true;
    return c.institutionId === unidadeId || !c.institutionId;
  });

  // Step 1: Search Student by Matrícula
  const handleSearchMatricula = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    const query = matriculaInput.trim().toLowerCase();

    if (!query) {
      setErrorMessage('Por favor, digite o número da sua matrícula.');
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      let foundStudent: Student | null = null;
      let foundClass: Classroom | null = null;

      for (const cls of institutionClassrooms) {
        for (const std of cls.students) {
          const stdMatricula = (std.matricula || '').trim().toLowerCase();
          // Match by matricula, or fallback to rollNumber match if numeric query equals rollNumber
          if (stdMatricula && stdMatricula === query) {
            foundStudent = std;
            foundClass = cls;
            break;
          } else if (!stdMatricula && String(std.rollNumber) === query) {
            foundStudent = std;
            foundClass = cls;
            break;
          }
        }
        if (foundStudent) break;
      }

      setIsSearching(false);

      if (foundStudent && foundClass) {
        setMatchedStudent(foundStudent);
        setMatchedClassroom(foundClass);
        // Save to localStorage for convenience next time
        try {
          localStorage.setItem(STORAGE_LAST_MATRICULA, matriculaInput.trim());
        } catch (err) {
          // ignore
        }
        setStep(2);
      } else {
        setErrorMessage('Matrícula não encontrada. Verifique o número digitado.');
      }
    }, 250);
  };

  // Step 2: Confirm and Record Attendance
  const handleConfirmAttendance = async () => {
    if (!matchedStudent || !matchedClassroom) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const now = new Date();
    // YYYY-MM-DD
    const dateStr = now.toISOString().split('T')[0];
    // HH:mm:ss (24h format)
    const timeStr = now.toLocaleTimeString('pt-BR', { hour12: false });

    try {
      const result = await recordAttendanceEntry({
        institutionId: activeInstitution?.id || matchedClassroom.institutionId || 'inst-default',
        classroomId: matchedClassroom.id,
        classroomName: matchedClassroom.name,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        matricula: matchedStudent.matricula || String(matchedStudent.rollNumber),
        date: dateStr,
        entryTime: timeStr,
        source: 'nfc',
      });

      setAttendanceResult({
        isFirstToday: result.isFirstToday,
        record: result.record,
        originalTime: result.originalTime || result.record.entryTime,
      });

      setStep(3);

      // Trigger celebration confetti on first check-in of the day
      if (result.isFirstToday) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Error confirming attendance:', err);
      setErrorMessage('Ocorreu um erro ao salvar sua presença. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to Step 1 for another check-in
  const handleResetForAnother = () => {
    setMatchedStudent(null);
    setMatchedClassroom(null);
    setAttendanceResult(null);
    setErrorMessage(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Mobile Bar */}
      <header className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <SmartphoneNfc className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight font-display">
                Portaria NFC • Entrada Única
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                Check-in
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {activeInstitution?.name || 'Unidade Escolar'}
            </p>
          </div>
        </div>

        {onExitCheckIn && (
          <button
            onClick={onExitCheckIn}
            className="text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all cursor-pointer"
          >
            Acessar Sistema
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center z-10">
        
        {/* ======================================================== */}
        {/* ETAPA 1: DIGITAR MATRÍCULA                               */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto">
                <SmartphoneNfc className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
                Registro de Entrada
              </h2>
              <p className="text-xs text-slate-400">
                Aproxime o celular ou digite o número da sua matrícula para confirmar presença na portaria.
              </p>
            </div>

            <form onSubmit={handleSearchMatricula} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Matrícula do Aluno
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="text"
                    autoFocus
                    value={matriculaInput}
                    onChange={(e) => {
                      setMatriculaInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Ex: 2026001"
                    className="w-full text-center font-mono text-xl sm:text-2xl font-black py-4 px-4 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all tracking-wider"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs animate-in shake duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching || !matriculaInput.trim()}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Buscando Aluno...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar Matrícula</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-700/60">
              <p className="text-[11px] text-slate-500">
                Sua matrícula fica salva para agilizar os próximos dias.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: CONFIRMAÇÃO DE IDENTIDADE                      */}
        {/* ======================================================== */}
        {step === 2 && matchedStudent && matchedClassroom && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Etapa 2 • Confirmação de Identidade
              </span>
              <h2 className="text-lg font-bold text-white font-display">
                Confirma seus dados para registrar a entrada?
              </h2>
            </div>

            {/* Student Identity Card */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-inner">
              <div
                className="w-20 h-24 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border-2 border-white/20 overflow-hidden relative"
                style={{ backgroundColor: matchedStudent.avatarColor || '#10b981' }}
              >
                {matchedStudent.photoUrl ? (
                  <img
                    src={matchedStudent.photoUrl}
                    alt={matchedStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  matchedStudent.rollNumber
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white">
                  {matchedStudent.name}
                </h3>
                {matchedStudent.nickname && (
                  <p className="text-xs text-slate-400">
                    "{matchedStudent.nickname}"
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full border-t border-slate-800">
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700">
                  Turma: <strong className="text-white">{matchedClassroom.name}</strong>
                </span>
                <span className="px-2.5 py-1 bg-emerald-500/10 rounded-lg text-xs font-mono font-bold text-emerald-400 border border-emerald-500/20">
                  Matrícula: {matchedStudent.matricula || matchedStudent.rollNumber}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmAttendance}
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registrando na Nuvem...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Sim, confirmar minha entrada</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="w-full py-3 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Não sou eu / Corrigir matrícula</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 3: COMPROVANTE & SUCESSO                          */}
        {/* ======================================================== */}
        {step === 3 && attendanceResult && matchedStudent && matchedClassroom && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            {attendanceResult.isFirstToday ? (
              // Primeiro registro do dia (Sucesso em verde com animação)
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 mx-auto shadow-lg shadow-emerald-950">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Check-in Realizado com Sucesso!
                  </span>
                  <h2 className="text-xl font-black text-white font-display">
                    Entrada Registrada
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sua presença já foi transmitida para o mapa de sala do professor.
                  </p>
                </div>
              </>
            ) : (
              // Já registrado hoje (aviso amigável sem sobrescrever horário original)
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Aviso de Presença
                  </span>
                  <h2 className="text-lg font-bold text-white font-display">
                    Olá, {matchedStudent.name.split(' ')[0]}!
                  </h2>
                  <p className="text-xs text-slate-300">
                    Sua entrada de hoje já estava registrada desde às{' '}
                    <strong className="text-amber-400 font-mono font-bold">
                      {attendanceResult.originalTime || attendanceResult.record.entryTime}
                    </strong>.
                  </p>
                </div>
              </>
            )}

            {/* Receipt Summary Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Aluno:</span>
                <strong className="text-white">{matchedStudent.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Turma:</span>
                <span className="text-slate-200 font-semibold">{matchedClassroom.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Matrícula:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {matchedStudent.matricula || matchedStudent.rollNumber}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Data:</span>
                <span className="text-slate-200 font-mono">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Horário de Entrada:</span>
                <strong className="text-emerald-400 font-mono text-sm">
                  {attendanceResult.originalTime || attendanceResult.record.entryTime}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForAnother}
              className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Registrar outro aluno</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="px-5 py-3 text-center border-t border-slate-800 bg-slate-900/80 z-10">
        <p className="text-[11px] text-slate-500 font-medium">
          Sistema de Presença Integrado com Espelho de Classe • NFC Portaria
        </p>
      </footer>
    </div>
  );
};
