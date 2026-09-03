import React, { useState } from 'react';
import { X, School, BookOpen, User, Calendar, Hash, Check, Trash2 } from 'lucide-react';
import { Classroom } from '../types';
import { createDefaultRoomConfig } from '../utils/sampleData';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClassroom: (classroom: Classroom) => void;
  onDeleteClassroom?: (classroomId: string) => void;
  initialClassroom?: Classroom | null;
  currentInstitutionId?: string;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSaveClassroom,
  onDeleteClassroom,
  initialClassroom,
  currentInstitutionId,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialClassroom?.name || '');
  const [grade, setGrade] = useState(initialClassroom?.grade || 'Ensino Fundamental II');
  const [schoolName, setSchoolName] = useState(initialClassroom?.schoolName || 'Colégio Municipal');
  const [teacherName, setTeacherName] = useState(initialClassroom?.teacherName || 'Prof. Titular');
  const [academicYear, setAcademicYear] = useState(initialClassroom?.academicYear || new Date().getFullYear().toString());
  const [roomNumber, setRoomNumber] = useState(initialClassroom?.roomNumber || 'Sala 101');
  const [rows, setRows] = useState(initialClassroom?.roomConfig.rows || 5);
  const [cols, setCols] = useState(initialClassroom?.roomConfig.cols || 6);
  const [layoutType, setLayoutType] = useState<Classroom['roomConfig']['layoutType']>(
    initialClassroom?.roomConfig.layoutType || 'rows'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialClassroom) {
      // Edit existing
      const updated: Classroom = {
        ...initialClassroom,
        name: name.trim(),
        grade: grade.trim(),
        schoolName: schoolName.trim(),
        teacherName: teacherName.trim(),
        academicYear: academicYear.trim(),
        roomNumber: roomNumber.trim(),
        roomConfig: {
          ...initialClassroom.roomConfig,
          rows,
          cols,
          layoutType,
        },
        updatedAt: Date.now(),
      };
      onSaveClassroom(updated);
    } else {
      // Create new
      const newClassroom: Classroom = {
        id: `class-${Date.now()}`,
        institutionId: currentInstitutionId,
        name: name.trim(),
        grade: grade.trim(),
        schoolName: schoolName.trim(),
        teacherName: teacherName.trim(),
        academicYear: academicYear.trim(),
        roomNumber: roomNumber.trim(),
        roomConfig: createDefaultRoomConfig(rows, cols, layoutType),
        students: [],
        seatingMap: {},
        lockedDesks: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onSaveClassroom(newClassroom);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                {initialClassroom ? 'Editar Dados da Turma' : 'Cadastrar Nova Turma'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Configure as informações gerais e a estrutura da sala</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with guaranteed scrollbar */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-scroll flex-1 overscroll-contain custom-modal-scroll text-slate-800 dark:text-zinc-200 pr-4">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
              Nome da Turma / Identificação *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 8º Ano A - Matutino, 3º EM Turma B..."
                className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                Série / Nível
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ex: Ensino Fundamental II"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Ano Letivo / Semestre
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="Ex: 2026"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-500" />
                Escola / Instituição
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ex: Fleming Educação"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Professor(a) / Regente
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ex: Profª Ana Silva"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Número / Nome da Sala
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Ex: Sala 104 - Bloco B"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          {/* Room Configuration Grid Dimensions */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-300 mb-3">
              Dimensões da Grade de Carteiras
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1">
                  Fileiras (Linhas: 1 a 15)
                </label>
                <select
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm font-semibold text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(r => (
                    <option key={r} value={r} className="bg-white dark:bg-[#18181f] text-slate-900 dark:text-zinc-100">
                      {r} {r === 1 ? 'fileira (linha)' : 'fileiras (linhas)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1">
                  Colunas (1 a 15)
                </label>
                <select
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm font-semibold text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#15151b] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(c => (
                    <option key={c} value={c} className="bg-white dark:bg-[#18181f] text-slate-900 dark:text-zinc-100">
                      {c} {c === 1 ? 'coluna' : 'colunas'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1">
                Disposição Padrão das Carteiras
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLayoutType('rows')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                    layoutType === 'rows'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <p className="font-bold text-slate-900 dark:text-zinc-200">Fileiras Tradicionais</p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-500 font-normal">Alinhamento padrão individual</p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutType('pairs')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                    layoutType === 'pairs'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <p className="font-bold text-slate-900 dark:text-zinc-200">Duplas de Trabalho</p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-500 font-normal">Carteiras agrupadas em pares</p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutType('groups_4')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                    layoutType === 'groups_4'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <p className="font-bold text-slate-900 dark:text-zinc-200">Grupos / Ilhas (4)</p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-500 font-normal">Mesas agrupadas para equipe</p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutType('u_shape')}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                    layoutType === 'u_shape'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <p className="font-bold text-slate-900 dark:text-zinc-200">Formato em U / Ferradura</p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-500 font-normal">Visão aberta central</p>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2 bg-slate-100 dark:bg-[#18181f] p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800">
              💡 Capacidade máxima calculada: <strong className="text-slate-900 dark:text-zinc-200">{rows * cols} carteiras</strong>. Você poderá desativar carteiras individuais ou corredores a qualquer momento no editor.
            </p>
          </div>
          </div>

          {/* Footer Actions (fixo na base da janela) */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c] shrink-0">
            {initialClassroom && onDeleteClassroom ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteClassroom(initialClassroom.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Turma
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {initialClassroom ? 'Salvar Alterações' : 'Criar Turma'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
