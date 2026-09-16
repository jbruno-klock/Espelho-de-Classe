import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, School, Users, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Classroom } from '../types';

interface ClearClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onConfirmClear: () => void;
}

export const ClearClassroomModal: React.FC<ClearClassroomModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onConfirmClear,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const studentCount = classroom.students?.length || 0;
  const seatedCount = Object.values(classroom.seatingMap || {}).filter(Boolean).length;

  const handleConfirm = () => {
    if (!confirmed && studentCount > 0) return;
    onConfirmClear();
    setConfirmed(false);
    onClose();
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="clear-classroom-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-950/40 max-w-md w-full overflow-hidden text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-rose-50/80 dark:bg-[#181214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shadow-xs shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                Limpar Turma
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Excluir todos os alunos</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Banner */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-rose-900 dark:text-rose-200 font-bold">
                Tem certeza que deseja limpar todos os alunos desta turma?
              </p>
              <p className="text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
                Você está prestes a excluir permanentemente todos os <strong>{studentCount} alunos</strong> da turma <strong>{classroom.name}</strong>.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-[#18181f] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 space-y-2.5 text-xs text-slate-800 dark:text-zinc-300">
            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Turma:
              </span>
              <span className="font-bold text-slate-900 dark:text-zinc-100">{classroom.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Alunos a excluir:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{studentCount} alunos</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Carteiras no mapa:
              </span>
              <span className="font-medium text-slate-800 dark:text-zinc-300">
                {seatedCount > 0 ? `${seatedCount} ocupadas (serão desocupadas)` : 'Já desocupadas'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1">
            <p>• Todos os dados dos alunos (nomes, números, fotos, afinidades e comportamentos) serão apagados.</p>
            <p>• A estrutura da sala e as configurações de carteiras (fileiras e colunas) serão mantidas.</p>
          </div>

          {/* Confirmation Checkbox */}
          {studentCount > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 cursor-pointer select-none">
              <input
                type="checkbox"
                id="confirm-clear-classroom-checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-tight">
                Estou ciente de que todos os {studentCount} alunos desta turma serão excluídos permanentemente.
              </span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={studentCount > 0 && !confirmed}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-rose-950/40 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Confirmar e Limpar Turma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
