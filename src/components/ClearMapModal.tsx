import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, Lock, Unlock, Users, ShieldAlert, Check } from 'lucide-react';
import { Classroom } from '../types';

interface ClearMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  activePlanName?: string;
  onConfirmClear: (mode: 'unlocked_only' | 'all') => void;
}

export const ClearMapModal: React.FC<ClearMapModalProps> = ({
  isOpen,
  onClose,
  classroom,
  activePlanName,
  onConfirmClear,
}) => {
  if (!isOpen) return null;

  const seatingMap = classroom.seatingMap || {};
  const lockedDesks = classroom.lockedDesks || {};

  // Count seated students
  const seatedStudentsCount = Object.values(seatingMap).filter(Boolean).length;

  // Count locked desks that currently have a student assigned
  const lockedWithStudentCount = Object.entries(lockedDesks).filter(
    ([deskId, isLocked]) => isLocked && Boolean(seatingMap[deskId])
  ).length;

  const totalLockedCount = Object.values(lockedDesks).filter(Boolean).length;

  // Default mode: if there are locked desks with students, suggest preserving them
  const [clearMode, setClearMode] = useState<'unlocked_only' | 'all'>(
    lockedWithStudentCount > 0 ? 'unlocked_only' : 'all'
  );

  const handleConfirm = () => {
    onConfirmClear(clearMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="clear-map-modal-dialog"
        className="bg-white dark:bg-[#131317] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-display">
                Limpar Carteiras do Mapa
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate max-w-[240px]">
                {classroom.name} {activePlanName ? `• ${activePlanName}` : ''}
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

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {seatedStudentsCount === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                O mapa já está completamente vazio!
              </p>
              <p className="text-slate-500 dark:text-zinc-400 text-xs">
                Nenhum aluno está posicionado nas carteiras neste momento.
              </p>
              {totalLockedCount > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onConfirmClear('all')}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Destravar todas as {totalLockedCount} carteiras bloqueadas
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Context Summary */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950 dark:text-amber-200">
                    Deseja retirar os alunos das carteiras?
                  </p>
                  <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    Atualmente há <strong>{seatedStudentsCount} aluno(s)</strong> acomodado(s) neste espelho de classe.
                  </p>
                </div>
              </div>

              {/* Preservation reassurance */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Seus alunos continuam seguros</span>
                </div>
                <p className="leading-relaxed">
                  Nenhum aluno será excluído da turma. Eles apenas voltarão para a lista de alunos livres para serem redistribuídos ou sorteados novamente.
                </p>
              </div>

              {/* Mode Selection if there are locked desks */}
              {lockedWithStudentCount > 0 ? (
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block uppercase tracking-wider text-[10px]">
                    Como deseja proceder com as carteiras travadas?
                  </label>

                  {/* Option 1: Unlocked Only */}
                  <label
                    onClick={() => setClearMode('unlocked_only')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      clearMode === 'unlocked_only'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs'
                        : 'bg-white dark:bg-[#18181f] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="clearMode"
                      checked={clearMode === 'unlocked_only'}
                      onChange={() => setClearMode('unlocked_only')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Manter carteiras travadas ({lockedWithStudentCount} fixadas)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Preserva alunos com necessidades especiais ou posições fixadas e esvazia apenas as demais carteiras.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Clear All */}
                  <label
                    onClick={() => setClearMode('all')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      clearMode === 'all'
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500 text-rose-950 dark:text-rose-100 shadow-xs'
                        : 'bg-white dark:bg-[#18181f] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="clearMode"
                      checked={clearMode === 'all'}
                      onChange={() => setClearMode('all')}
                      className="mt-0.5 accent-rose-600"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Unlock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Esvaziar 100% do mapa (Inclusive travadas)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Remove todos os alunos do mapa e destrava todas as carteiras para recomeçar do zero.
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="text-slate-600 dark:text-zinc-400 text-xs">
                  Todas as carteiras ocupadas serão esvaziadas neste espelho de classe.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-[#16161c] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          {seatedStudentsCount > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2 rounded-xl font-bold text-white cursor-pointer shadow-md flex items-center gap-2 transition-all active:scale-98 ${
                clearMode === 'all'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {clearMode === 'all' ? 'Esvaziar Todo o Mapa' : 'Limpar Carteiras Livres'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
