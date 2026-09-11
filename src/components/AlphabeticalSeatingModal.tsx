import React, { useState, useMemo } from 'react';
import { 
  ArrowDownAZ, 
  X, 
  Columns, 
  Rows, 
  Lock, 
  Sparkles, 
  Check, 
  ArrowDownNarrowWide, 
  ArrowUpNarrowWide,
  Users,
  Eye,
  Hash
} from 'lucide-react';
import { Classroom, AlphabeticalGenerationOptions } from '../types';
import { getActiveDesks } from '../utils/algorithm';

interface AlphabeticalSeatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onConfirm: (options: AlphabeticalGenerationOptions) => void;
  isGenerating?: boolean;
}

export const AlphabeticalSeatingModal: React.FC<AlphabeticalSeatingModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onConfirm,
  isGenerating = false,
}) => {
  const [direction, setDirection] = useState<'columns' | 'rows'>('columns');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'rollNumber'>('name');
  const [respectFixedDesks, setRespectFixedDesks] = useState<boolean>(true);
  const [respectSpecialNeeds, setRespectSpecialNeeds] = useState<boolean>(false);

  // Active desks count
  const activeDesks = useMemo(() => getActiveDesks(classroom), [classroom]);
  const lockedDesks = classroom.lockedDesks || {};
  const seatingMap = classroom.seatingMap || {};

  const lockedCount = useMemo(() => {
    return Object.entries(lockedDesks).filter(([id, isLocked]) => isLocked && Boolean(seatingMap[id])).length;
  }, [lockedDesks, seatingMap]);

  // Special needs count
  const specialNeedsCount = useMemo(() => {
    return classroom.students.filter(s => 
      (Array.isArray(s.specialNeeds) && s.specialNeeds.length > 0) ||
      s.visionNeeds === 'needs_front' ||
      s.hearingNeeds === 'needs_front' ||
      s.reducedMobility ||
      s.preferredRow === 'front'
    ).length;
  }, [classroom.students]);

  // Sort students preview
  const previewStudents = useMemo(() => {
    const list = [...classroom.students];
    list.sort((a, b) => {
      if (sortBy === 'rollNumber') {
        const numA = typeof a.rollNumber === 'number' ? a.rollNumber : 9999;
        const numB = typeof b.rollNumber === 'number' ? b.rollNumber : 9999;
        if (numA !== numB) {
          return sortOrder === 'desc' ? numB - numA : numA - numB;
        }
      }
      const comp = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      return sortOrder === 'desc' ? -comp : comp;
    });
    return list;
  }, [classroom.students, sortBy, sortOrder]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    onConfirm({
      direction,
      sortOrder,
      sortBy,
      respectFixedDesks,
      respectSpecialNeeds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="alphabetical-seating-modal-dialog"
        className="bg-white dark:bg-[#131317] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-indigo-50/60 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowDownAZ className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-display">
                Gerar Espelho por Ordem Alfabética
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate max-w-[280px]">
                {classroom.name} • {classroom.students.length} alunos • {activeDesks.length} carteiras ativas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* Direction Choice Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Disposição e Sentido das Carteiras
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: By Column / Fileira (Default in BR schools) */}
              <button
                type="button"
                onClick={() => setDirection('columns')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                  direction === 'columns'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-[#18181f] dark:hover:bg-[#202028] border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${
                      direction === 'columns' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}>
                      <Columns className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                      Por Fileiras
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    Padrão Escolar
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Preenche a Fileira 1 da frente para o fundo, depois a Fileira 2 da frente para o fundo, e assim por diante.
                </p>
              </button>

              {/* Option 2: By Row / Horizontal */}
              <button
                type="button"
                onClick={() => setDirection('rows')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                  direction === 'rows'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-[#18181f] dark:hover:bg-[#202028] border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${
                      direction === 'rows' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}>
                      <Rows className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                      Por Linhas
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                    Horizontal
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Preenche a 1ª linha na frente da esquerda para a direita, depois a 2ª linha, até o fundo da sala.
                </p>
              </button>

            </div>
          </div>

          {/* Ordering Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Criteria */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Critério de Ordenação
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-[#18181f] p-1 border border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSortBy('name')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sortBy === 'name'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  Nome do Aluno
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('rollNumber')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sortBy === 'rollNumber'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  Nº de Chamada
                </button>
              </div>
            </div>

            {/* Sort direction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Direção Alfabética
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-[#18181f] p-1 border border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSortOrder('asc')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sortOrder === 'asc'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownNarrowWide className="w-3.5 h-3.5" />
                  A → Z (Crescente)
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('desc')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sortOrder === 'desc'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpNarrowWide className="w-3.5 h-3.5" />
                  Z → A (Decrescente)
                </button>
              </div>
            </div>
          </div>

          {/* Checkboxes / Rules */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 space-y-2.5">
            {/* Locked desks toggle */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={respectFixedDesks}
                onChange={(e) => setRespectFixedDesks(e.target.checked)}
                className="mt-0.5 rounded-md border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Manter carteiras travadas com cadeado
                  {lockedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {lockedCount} travada{lockedCount > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {lockedCount > 0 
                    ? `Os ${lockedCount} alunos que estão fixados não serão trocados de lugar.`
                    : 'Nenhuma carteira travada no momento.'}
                </p>
              </div>
            </label>

            {/* Special needs in front toggle */}
            {specialNeedsCount > 0 && (
              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200 dark:border-zinc-800/80">
                <input
                  type="checkbox"
                  checked={respectSpecialNeeds}
                  onChange={(e) => setRespectSpecialNeeds(e.target.checked)}
                  className="mt-0.5 rounded-md border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Priorizar alunos com necessidades especiais nas primeiras carteiras
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {specialNeedsCount} aluno{specialNeedsCount > 1 ? 's' : ''}
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Posiciona estudantes com baixa visão, audição ou TDAH nas carteiras mais próximas à lousa antes de ordenar os demais.
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Student Order Preview Box */}
          <div className="p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Prévia da Ordem (Primeiros Estudantes):
              </span>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">
                Total: {classroom.students.length} alunos
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {previewStudents.slice(0, 6).map((student, idx) => (
                <div
                  key={student.id}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-indigo-200/80 dark:border-indigo-800/50 text-[10px] text-slate-800 dark:text-zinc-200 font-medium flex items-center gap-1 shadow-2xs"
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {idx + 1}º
                  </span>
                  <span className="truncate max-w-[110px]">
                    {student.name}
                  </span>
                </div>
              ))}
              {previewStudents.length > 6 && (
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium px-1">
                  +{previewStudents.length - 6} outros
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-[#121216]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="btn-confirm-alphabetical-generation"
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || classroom.students.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Organizando...</span>
              </>
            ) : (
              <>
                <ArrowDownAZ className="w-4 h-4" />
                <span>Gerar em Ordem Alfabética</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
